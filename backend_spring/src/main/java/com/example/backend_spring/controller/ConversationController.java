package com.example.backend_spring.controller;

import com.example.backend_spring.dto.messaging.*;
import com.example.backend_spring.entity.MessageAttachment;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.repository.ConversationEventRepository;
import com.example.backend_spring.repository.MessageAttachmentRepository;
import com.example.backend_spring.repository.UserRepository;
import com.example.backend_spring.service.ConversationService;
import com.example.backend_spring.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final FileStorageService fileStorageService;
    private final MessageAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final ConversationEventRepository eventRepository;

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getMyConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(conversationService.getUserConversations(user.getId()));
    }

    @PostMapping
    public ResponseEntity<ConversationResponse> create(
            @Valid @RequestBody CreateConversationRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(conversationService.createConversation(req, user.getId()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(conversationService.getMessages(id, user.getId(), page, size));
    }

    /**
     * Standard text message (JSON)
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(conversationService.sendMessage(id, req.getContent(), null, user.getId()));
    }

    /**
     * Message with file uploads (Multipart)
     */
    @PostMapping(value = "/{id}/messages/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageResponse> sendMessageWithFiles(
            @PathVariable UUID id,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(conversationService.sendMessage(id, content, files, user.getId()));
    }

    @PatchMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable UUID messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        conversationService.markMessageRead(messageId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/join")
    public ResponseEntity<ConversationResponse> joinByCode(
            @Valid @RequestBody JoinByCodeRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        // Using getCode() based on your original JoinByCodeRequest DTO
        return ResponseEntity.ok(conversationService.joinByCode(req.getCode(), user.getId()));
    }

    @DeleteMapping("/{id}/members/me")
    public ResponseEntity<Void> leaveConversation(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        conversationService.leaveConversation(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/members/{targetUserId}")
    public ResponseEntity<Void> kickMember(
            @PathVariable UUID id,
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User kicker = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        conversationService.kickMember(id, targetUserId, kicker.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        conversationService.deleteConversation(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/name")
    public ResponseEntity<ConversationResponse> updateName(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        String newName = body.get("name");
        return ResponseEntity.ok(conversationService.updateConversationName(id, newName, user.getId()));
    }

    @DeleteMapping("/{id}/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID id,
            @PathVariable UUID messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        conversationService.deleteMessage(id, messageId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/messages/{messageId}")
    public ResponseEntity<MessageResponse> updateMessage(
            @PathVariable UUID id,
            @PathVariable UUID messageId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
    .orElseThrow(() -> new RuntimeException("User not found"));
        String newContent = body.get("content");
        return ResponseEntity.ok(conversationService.updateMessage(id, messageId, newContent, user.getId()));
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID attachmentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        MessageAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

         // FIX: Fetch conversationId in same query
        UUID conversationId = attachmentRepository.findConversationIdByAttachmentId(attachmentId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversationService.isMember(conversationId, user.getId())) {
            return ResponseEntity.status(403).build();
        }

        Resource resource = fileStorageService.loadFileAsResource(attachment.getFilePath());

        String contentType = attachment.getMimeType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "inline; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/{conversationId}/events")
    public List<ConversationEventDto> getEvents(@PathVariable UUID conversationId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        
        if (!conversationService.isMember(conversationId, user.getId())) {
            throw new ForbiddenException("Access denied");
        }
        
        return eventRepository.findByConversationIdWithUsers(conversationId)  // NEW QUERY
            .stream()
            .map(e -> ConversationEventDto.builder()
                .id(e.getId())
                .conversationId(conversationId)
                .eventType(e.getEventType())
                .userId(e.getUser().getId())
                .userName(e.getUser().getFirstName() + " " + e.getUser().getLastName())
                .triggeredById(e.getTriggeredBy() != null ? e.getTriggeredBy().getId() : null)
                .triggeredByName(e.getTriggeredBy() != null ? e.getTriggeredBy().getFirstName() + " " + e.getTriggeredBy().getLastName() : null)
                .createdAt(e.getCreatedAt())
                .build())
            .toList();
    }
}