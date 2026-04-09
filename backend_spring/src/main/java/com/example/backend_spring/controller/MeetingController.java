package com.example.backend_spring.controller;

import com.example.backend_spring.dto.meeting.CreateMeetingRequest;
import com.example.backend_spring.dto.meeting.MeetingResponse;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.service.MeetingService;
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
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<MeetingResponse>> getAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        User viewer = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(meetingService.getMeetings(viewer));
    }

    @PostMapping
    public ResponseEntity<MeetingResponse> create(
            @Valid @RequestBody CreateMeetingRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User author = userService.findByEmail(userDetails.getUsername());
        enforceTeacherOrAdmin(author);
        return ResponseEntity.ok(meetingService.create(req, author));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        meetingService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    private void enforceTeacherOrAdmin(User user) {
        switch (user.getRole()) {
            case STUDENT -> throw new ForbiddenException("Students cannot create meetings");
            default -> {}
        }
    }
}
