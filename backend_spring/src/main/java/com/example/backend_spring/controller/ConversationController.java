package com.example.backend_spring.controller;

import com.example.backend_spring.dto.messaging.ConversationResponse;
import com.example.backend_spring.dto.messaging.CreateConversationRequest;
import com.example.backend_spring.dto.messaging.MessageResponse;
import com.example.backend_spring.dto.messaging.SendMessageRequest;
import com.example.backend_spring.service.ConversationService;
import com.example.backend_spring.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getMyConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(conversationService.getUserConversations(userId));
    }

    @PostMapping
    public ResponseEntity<ConversationResponse> create(
            @Valid @RequestBody CreateConversationRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(conversationService.createConversation(req, userId));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(conversationService.getMessages(id, userId, page, size));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(conversationService.sendMessage(id, req, userId));
    }

    @PatchMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable UUID messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        conversationService.markMessageRead(messageId, userId);
        return ResponseEntity.noContent().build();
    }
}
