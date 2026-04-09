package com.example.backend_spring.dto.auth;

import com.example.backend_spring.entity.User;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class UserResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String groupName;
    private String specialty;
    private boolean isActive;
    private OffsetDateTime createdAt;

    public static UserResponse from(User user) {
        UserResponse r = new UserResponse();
        r.id = user.getId();
        r.firstName = user.getFirstName();
        r.lastName = user.getLastName();
        r.email = user.getEmail();
        r.role = user.getRole().name().toLowerCase();
        r.groupName = user.getGroupName();
        r.specialty = user.getSpecialty();
        r.isActive = user.isActive();
        r.createdAt = user.getCreatedAt();
        return r;
    }
}
