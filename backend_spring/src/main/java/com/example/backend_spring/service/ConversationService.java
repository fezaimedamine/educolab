package com.example.backend_spring.service;

import com.example.backend_spring.dto.messaging.ConversationResponse;
import com.example.backend_spring.dto.messaging.CreateConversationRequest;
import com.example.backend_spring.dto.messaging.MessageResponse;
import com.example.backend_spring.dto.messaging.SendMessageRequest;
import com.example.backend_spring.entity.*;
import com.example.backend_spring.enums.ConversationType;
import com.example.backend_spring.enums.NotificationType;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<ConversationResponse> getUserConversations(UUID userId) {
        return conversationRepository.findByMemberUserId(userId)
                .stream()
                .map(ConversationResponse::from)
                .toList();
    }

    @Transactional
    public ConversationResponse createConversation(CreateConversationRequest req, UUID currentUserId) {
        ConversationType type = ConversationType.valueOf(req.getType().toUpperCase());

        // For direct conversations, check if one already exists
        if (type == ConversationType.DIRECT && req.getMemberIds().size() == 1) {
            UUID otherId = req.getMemberIds().get(0);
            List<Conversation> existing = conversationRepository.findDirectConversation(currentUserId, otherId);
            if (!existing.isEmpty()) {
                return ConversationResponse.from(existing.get(0));
            }
        }

        Conversation conversation = Conversation.builder()
                .type(type)
                .name(req.getName())
                .build();
        conversation = conversationRepository.save(conversation);

        // Add current user
        addMember(conversation, currentUserId);

        // Add other members
        for (UUID memberId : req.getMemberIds()) {
            addMember(conversation, memberId);
        }

        // Re-fetch with members
        return ConversationResponse.from(conversationRepository.findById(conversation.getId()).orElseThrow());
    }

    private void addMember(Conversation conversation, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        ConversationMemberId memberId = new ConversationMemberId(userId, conversation.getId());
        ConversationMember member = ConversationMember.builder()
                .id(memberId)
                .user(user)
                .conversation(conversation)
                .build();
        memberRepository.save(member);
    }

    public List<MessageResponse> getMessages(UUID conversationId, UUID currentUserId, int page, int size) {
        if (!memberRepository.existsById_UserIdAndId_ConversationId(currentUserId, conversationId)) {
            throw new ForbiddenException("You are not a member of this conversation");
        }
        return messageRepository
                .findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size))
                .stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional
    public MessageResponse sendMessage(UUID conversationId, SendMessageRequest req, UUID senderId) {
        if (!memberRepository.existsById_UserIdAndId_ConversationId(senderId, conversationId)) {
            throw new ForbiddenException("You are not a member of this conversation");
        }

        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .content(req.getContent())
                .build();
        message = messageRepository.save(message);

        // Notify other members
        User sender = userRepository.findById(senderId).orElseThrow();
        String senderName = sender.getFirstName() + " " + sender.getLastName();
        
        List<ConversationMember> members = memberRepository.findById_ConversationId(conversationId);
        List<Notification> notifications = new ArrayList<>();
        final UUID messageId = message.getId();
        for (ConversationMember m : members) {
            if (!m.getId().getUserId().equals(senderId)) {
                notifications.add(Notification.builder()
                        .userId(m.getId().getUserId())
                        .type(NotificationType.MESSAGE)
                        .referenceId(conversationId)
                        .title("New Message")
                        .content(req.getContent())
                        .senderName(senderName)
                        .build());
            }
        }
        notificationRepository.saveAll(notifications);

        // Re-fetch to get sender info
        Message saved = messageRepository.findById(message.getId()).orElseThrow();
        return MessageResponse.from(saved);
    }

    @Transactional
    public void markMessageRead(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!memberRepository.existsById_UserIdAndId_ConversationId(userId, message.getConversationId())) {
            throw new ForbiddenException("Access denied");
        }
        message.setRead(true);
        messageRepository.save(message);
    }
}
