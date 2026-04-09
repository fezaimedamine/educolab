package com.example.backend_spring.controller;

import com.example.backend_spring.dto.announcement.AnnouncementResponse;
import com.example.backend_spring.dto.announcement.CreateAnnouncementRequest;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.service.AnnouncementService;
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
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        User viewer = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(announcementService.getAnnouncements(viewer));
    }

    @PostMapping
    public ResponseEntity<AnnouncementResponse> create(
            @Valid @RequestBody CreateAnnouncementRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User author = userService.findByEmail(userDetails.getUsername());
        enforceTeacherOrAdmin(author);
        return ResponseEntity.ok(announcementService.create(req, author));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        announcementService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    private void enforceTeacherOrAdmin(User user) {
        switch (user.getRole()) {
            case STUDENT -> throw new ForbiddenException("Students cannot create announcements");
            default -> {}
        }
    }
}
