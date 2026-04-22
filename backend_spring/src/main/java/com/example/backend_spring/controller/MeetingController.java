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
import java.util.Map;
import java.util.UUID;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

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

    public static class ParticipantInfo {
        public UUID userId;
        public String firstName;
        public String lastName;
        public String peerId;

        public ParticipantInfo() {}
        public ParticipantInfo(UUID userId, String firstName, String lastName, String peerId) {
            this.userId = userId;
            this.firstName = firstName;
            this.lastName = lastName;
            this.peerId = peerId;
        }
    }

    private final Map<String, List<ParticipantInfo>> activeRooms = new ConcurrentHashMap<>();

    @PostMapping("/{id}/join-live")
    public ResponseEntity<?> joinLive(
            @PathVariable String id, 
            @RequestBody Map<String, String> payload, 
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        String peerId = payload.get("peerId");
        
        activeRooms.computeIfAbsent(id, k -> new CopyOnWriteArrayList<>())
            .removeIf(p -> p.userId.equals(user.getId()));
            
        activeRooms.get(id).add(new ParticipantInfo(user.getId(), user.getFirstName(), user.getLastName(), peerId));
        return ResponseEntity.ok(activeRooms.get(id));
    }

    @GetMapping("/{id}/live-participants")
    public ResponseEntity<?> getLiveParticipants(@PathVariable String id) {
        return ResponseEntity.ok(activeRooms.getOrDefault(id, Collections.emptyList()));
    }
    
    @PostMapping("/{id}/leave-live")
    public ResponseEntity<?> leaveLive(
            @PathVariable String id, 
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        if(activeRooms.containsKey(id)){
             activeRooms.get(id).removeIf(p -> p.userId.equals(user.getId()));
        }
        return ResponseEntity.ok().build();
    }
}
