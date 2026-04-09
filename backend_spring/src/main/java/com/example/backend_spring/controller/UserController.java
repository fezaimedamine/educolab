package com.example.backend_spring.controller;

import com.example.backend_spring.dto.auth.UserResponse;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.UserRole;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String group,
            @RequestParam(required = false) String specialty,
            @AuthenticationPrincipal UserDetails userDetails) {

        User viewer = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getUsers(search, role, group, specialty, viewer));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activate(@PathVariable UUID id,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        enforceAdmin(userDetails);
        return ResponseEntity.ok(userService.toggleActive(id, true));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivate(@PathVariable UUID id,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        enforceAdmin(userDetails);
        return ResponseEntity.ok(userService.toggleActive(id, false));
    }

    private void enforceAdmin(UserDetails userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) throw new ForbiddenException("Admin access required");
    }
}
