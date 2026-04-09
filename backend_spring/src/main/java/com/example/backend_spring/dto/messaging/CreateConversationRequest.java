package com.example.backend_spring.dto.messaging;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateConversationRequest {

    @NotBlank
    private String type; // "direct" | "group"

    private String name; // required for group

    @NotEmpty
    private List<UUID> memberIds; // other participants (excluding current user)
}
