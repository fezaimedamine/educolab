package com.example.backend_spring.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.example.backend_spring.util.InviteCodeGenerator;

import com.example.backend_spring.dto.messaging.AttachmentDto;
import com.example.backend_spring.dto.messaging.ConversationEventDto;
import com.example.backend_spring.dto.messaging.ConversationResponse;
import com.example.backend_spring.dto.messaging.CreateConversationRequest;
import com.example.backend_spring.dto.messaging.MessageResponse;
import com.example.backend_spring.entity.*;
import com.example.backend_spring.enums.ConversationType;
import com.example.backend_spring.enums.EventType;
import com.example.backend_spring.enums.NotificationType;
import com.example.backend_spring.enums.UserRole;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.exception.BadRequestException;

import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.*;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final MessageRepository messageRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final ConversationEventRepository eventRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final FileStorageService fileStorageService;

    // ==================== CONVERSATION MANAGEMENT ====================

    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversations(UUID userId) {
        return conversationRepository.findByMemberUserId(userId)
                .stream()
                .map(ConversationResponse::from)
                .toList();
    }

    @Transactional
    public ConversationResponse createConversation(CreateConversationRequest req, UUID creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.getType() == ConversationType.DIRECT) {
            return handleCreateDirectConversation(req, creatorId);
        }

        // Only teachers/admins can create groups
        if (creator.getRole() != UserRole.TEACHER && creator.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only teachers and admins can create group conversations");
        }

        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new BadRequestException("Group conversation requires a name");
        }

        String inviteCode;
        do {
            inviteCode = InviteCodeGenerator.generate();
        } while (conversationRepository.existsByInviteCode(inviteCode));

        Conversation conversation = Conversation.builder()
                .type(ConversationType.GROUP)
                .name(req.getName().trim())
                .inviteCode(inviteCode)
                .build();
        
        conversation = conversationRepository.save(conversation);
        addMemberLogic(conversation, creatorId);

        return ConversationResponse.from(conversation);
    }

    private ConversationResponse handleCreateDirectConversation(CreateConversationRequest req, UUID creatorId) {
        if (req.getMemberIds() == null || req.getMemberIds().size() != 1) {
            throw new BadRequestException("Direct conversation requires exactly one other member");
        }

        UUID otherUserId = req.getMemberIds().get(0);
        if (otherUserId.equals(creatorId)) {
            throw new BadRequestException("Cannot create direct conversation with yourself");
        }

        if (!userRepository.existsById(otherUserId)) {
            throw new ResourceNotFoundException("Target user not found");
        }

        List<Conversation> existing = conversationRepository.findDirectConversation(creatorId, otherUserId);
        if (!existing.isEmpty()) {
            return ConversationResponse.from(existing.get(0));
        }

        Conversation conversation = Conversation.builder()
                .type(ConversationType.DIRECT)
                .build();
        conversation = conversationRepository.save(conversation);

        addMemberLogic(conversation, creatorId);
        addMemberLogic(conversation, otherUserId);

        return ConversationResponse.from(conversation);
    }

    // ==================== MESSAGING & ATTACHMENTS ====================

    @Transactional
    public MessageResponse sendMessage(UUID conversationId, String content, List<MultipartFile> files, UUID senderId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!isMember(conversationId, senderId)) {
            throw new ForbiddenException("Not a member of this conversation");
        }

        // 1. Save Message (Using conversationId UUID field)
        Message message = Message.builder()
                .conversationId(conversationId) // Corrected from .conversation()
                .senderId(senderId)             // Corrected from .sender()
                .content(content != null ? content.trim() : "")
                .isRead(false)
                .edited(false)
                .build();
        
        // Manually setting sender for the Response DTO later
        message.setSender(sender); 
        message = messageRepository.save(message);

        // 2. Handle Attachments
        List<AttachmentDto> attachmentDTOs = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            fileStorageService.validateFiles(files);
            for (MultipartFile file : files) {
                String filePath = fileStorageService.storeFile(file, conversationId);

                MessageAttachment attachment = MessageAttachment.builder()
                        .message(message)
                        .fileName(file.getOriginalFilename())
                        .filePath(filePath)
                        .fileSize(file.getSize())
                        .mimeType(file.getContentType())
                        .build();

                attachmentRepository.save(attachment);
                
                // Map to DTO
                AttachmentDto dto = new AttachmentDto();
                dto.setId(attachment.getId());
                dto.setFileName(attachment.getFileName());
                dto.setMimeType(attachment.getMimeType());
                dto.setFileSize(attachment.getFileSize());
                attachmentDTOs.add(dto);
            }
        }

        // 3. Map & Broadcast
        MessageResponse response = MessageResponse.from(message, attachmentDTOs);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(UUID conversationId, UUID userId, int page, int size) {
        if (!isMember(conversationId, userId)) {
            throw new ForbiddenException("Access denied");
        }

        // Ensure this import is: org.springframework.data.domain.Sort
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        return messageRepository.findByConversationId(conversationId, pageable)
                .stream()
                .map(msg -> {
                    List<AttachmentDto> atts = attachmentRepository.findByMessageId(msg.getId())
                            .stream()
                            .map(this::mapToAttachmentDTO) // Use the helper here
                            .toList();
                    return MessageResponse.from(msg, atts);
                })
                .toList();
    }

    // ==================== MEMBERSHIP & EVENTS ====================

    @Transactional
    public ConversationResponse joinByCode(String code, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Conversation conversation = conversationRepository.findByInviteCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid invite code"));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only join groups via code");
        }

        if (isMember(conversation.getId(), userId)) {
            throw new BadRequestException("Already a member");
        }

        addMemberLogic(conversation, userId);
        createEvent(conversation.getId(), EventType.member_joined, user, null);

        return ConversationResponse.from(conversation);
    }

    @Transactional
    public void leaveConversation(UUID conversationId, UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (!isMember(conversationId, userId)) {
            throw new ForbiddenException("Not a member");
        }

        memberRepository.deleteById(new ConversationMemberId(userId, conversationId));
        createEvent(conversationId, EventType.member_left, user, null);
    }

    @Transactional
    public void kickMember(UUID conversationId, UUID targetUserId, UUID kickerId) {
        User kicker = userRepository.findById(kickerId).orElseThrow();
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        if (kicker.getRole() != UserRole.TEACHER && kicker.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only teachers/admins can kick members");
        }

        if (target.getRole() == UserRole.ADMIN || target.getRole() == UserRole.TEACHER) {
            throw new ForbiddenException("Cannot kick other staff members");
        }

        if (!isMember(conversationId, targetUserId)) {
            throw new BadRequestException("User is not in this conversation");
        }

        memberRepository.deleteById(new ConversationMemberId(targetUserId, conversationId));
        createEvent(conversationId, EventType.member_left, target, kicker);
    }

    // ==================== UTILS & HELPERS ====================

    private void addMemberLogic(Conversation conversation, UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        ConversationMember member = ConversationMember.builder()
                .id(new ConversationMemberId(userId, conversation.getId()))
                .user(user)
                .conversation(conversation)
                .build();
        memberRepository.save(member);
    }

    private void createEvent(UUID conversationId, EventType type, User targetUser, User triggeredBy) {
        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow();
        
        ConversationEvent event = ConversationEvent.builder()
                .conversation(conversation)
                .eventType(type)
                .user(targetUser)
                .triggeredBy(triggeredBy)
                .build();
        eventRepository.save(event);

        ConversationEventDto dto = ConversationEventDto.builder()
                .id(event.getId())
                .conversationId(conversationId)
                .eventType(type)
                .userId(targetUser.getId())
                .userName(targetUser.getFirstName() + " " + targetUser.getLastName())
                .triggeredById(triggeredBy != null ? triggeredBy.getId() : null)
                .triggeredByName(triggeredBy != null ? triggeredBy.getFirstName() + " " + triggeredBy.getLastName() : null)  // ADD THIS
                .createdAt(event.getCreatedAt())
                .build();

        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/events", dto);
    }

    private void createMessageNotifications(UUID conversationId, UUID senderId, UUID messageId) {
        List<ConversationMember> members = memberRepository.findById_ConversationId(conversationId);
        List<Notification> notifications = members.stream()
                .filter(m -> !m.getId().getUserId().equals(senderId))
                .map(m -> Notification.builder()
                        .userId(m.getId().getUserId())
                        .type(NotificationType.MESSAGE)
                        .referenceId(messageId)
                        .build())
                .toList();
        notificationRepository.saveAll(notifications);
    }

    public boolean isMember(UUID conversationId, UUID userId) {
        return memberRepository.existsById_UserIdAndId_ConversationId(userId, conversationId);
    }

    private AttachmentDto mapToAttachmentDTO(MessageAttachment att) {
        return AttachmentDto.builder()
                .id(att.getId())
                .fileName(att.getFileName())
                .fileSize(att.getFileSize())
                .mimeType(att.getMimeType())
                .createdAt(att.getCreatedAt())
                .build();
    }

    // DELETE CONVERSATION //

    @Transactional
    public void deleteConversation(UUID conversationId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        
        // Only teachers/admins can delete conversations
        if (user.getRole() != UserRole.TEACHER && user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only teachers and admins can delete conversations");
        }
        
        conversationRepository.delete(conversation);
    }

    // UPDATE CONVERSATION'S NAME //

    @Transactional
    public ConversationResponse updateConversationName(UUID conversationId, String newName, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        
        // Only teachers/admins can rename
        if (user.getRole() != UserRole.TEACHER && user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only teachers and admins can rename conversations");
        }
        
        // Only groups can be renamed
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Cannot rename direct conversations");
        }
        
        if (newName == null || newName.trim().isEmpty()) {
            throw new BadRequestException("Name cannot be empty");
        }
        
        conversation.setName(newName.trim());
        conversationRepository.save(conversation);
        
        return ConversationResponse.from(
            conversationRepository.findByIdWithMembers(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"))
        );
    }

    //Delete Message

    @Transactional
    public void deleteMessage(UUID conversationId, UUID messageId, UUID userId) {
        Message message = messageRepository.findByIdAndConversationId(messageId, conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        
        if (!message.getSenderId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own messages");
        }
        
        // Delete attachments from disk
        attachmentRepository.findByMessageId(messageId).forEach(att -> 
            fileStorageService.deleteFile(att.getFilePath())
        );
        
        messageRepository.delete(message);

        messagingTemplate.convertAndSend(
            "/topic/conversations/" + conversationId + "/delete",
            Map.of("messageId", messageId.toString())
        );
    }

    //Edit Message

    @Transactional
    public MessageResponse updateMessage(UUID conversationId, UUID messageId, String newContent, UUID userId) {
        Message message = messageRepository.findByIdAndConversationId(messageId, conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        
        // Only sender can edit
        if (!message.getSenderId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own messages");
        }
        
        if (newContent == null || newContent.trim().isEmpty()) {
            throw new BadRequestException("Message content cannot be empty");
        }
        
        message.setContent(newContent.trim());
        message.setEdited(true); // Assuming you have this field
        messageRepository.save(message);

        User sender = userRepository.findById(message.getSenderId()).orElseThrow();
        message.setSender(sender);

        // Fetch existing attachments so they are included in the update broadcast
        List<AttachmentDto> attachments = attachmentRepository.findByMessageId(messageId)
                .stream()
                .map(this::mapToAttachmentDTO) // Using your mapping helper
                .toList();

        MessageResponse response = MessageResponse.from(message, attachments);
        
        // BROADCAST UPDATE
        messagingTemplate.convertAndSend(
            "/topic/conversations/" + conversationId + "/update",
            response
        );
        
        return response;
    }

    @Transactional
    public void markMessageRead(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        
        // Security check: Ensure user is part of the conversation this message belongs to
        if (!isMember(message.getConversationId(), userId)) {
            throw new ForbiddenException("Access denied");
        }
        
        message.setRead(true);
        messageRepository.save(message);
    }
}
