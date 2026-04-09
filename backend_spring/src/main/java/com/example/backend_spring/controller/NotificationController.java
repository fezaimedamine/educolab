package com.example.backend_spring.controller;

import com.example.backend_spring.dto.notification.NotificationResponse;
import com.example.backend_spring.service.NotificationService;
import com.example.backend_spring.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(notificationService.getAll(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        notificationService.markRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = userService.findByEmail(userDetails.getUsername()).getId();
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }
}
