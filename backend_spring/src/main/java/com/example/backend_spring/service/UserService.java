package com.example.backend_spring.service;

import com.example.backend_spring.dto.auth.UserResponse;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.UserRole;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserResponse> getUsers(String search, String role, String group, String specialty, User viewer) {
        List<User> users = switch (viewer.getRole()) {
            case STUDENT -> userRepository.findVisibleForStudent(
                    UserRole.TEACHER, UserRole.STUDENT, viewer.getGroupName());
            case TEACHER -> userRepository.findByRoleNotAndIsActiveTrue(UserRole.ADMIN);
            case ADMIN -> userRepository.findByIsActiveTrue();
        };

        return users.stream()
                .filter(u -> role == null || u.getRole().name().equalsIgnoreCase(role))
                .filter(u -> group == null || group.equalsIgnoreCase(u.getGroupName()))
                .filter(u -> specialty == null || specialty.equalsIgnoreCase(u.getSpecialty()))
                .filter(u -> search == null || matchesSearch(u, search))
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse getUserById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public UserResponse toggleActive(UUID id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setActive(active);
        return UserResponse.from(userRepository.save(user));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private boolean matchesSearch(User u, String search) {
        String q = search.toLowerCase();
        return u.getFirstName().toLowerCase().contains(q)
                || u.getLastName().toLowerCase().contains(q)
                || u.getEmail().toLowerCase().contains(q);
    }
}
