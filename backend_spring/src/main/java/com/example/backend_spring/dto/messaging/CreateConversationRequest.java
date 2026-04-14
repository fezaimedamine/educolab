package com.example.backend_spring.dto.messaging;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

import com.example.backend_spring.enums.ConversationType;

@Data
public class CreateConversationRequest {

   @NotNull(message = "Conversation type is required")
    private ConversationType type; // Change from String

    private String name; // required for group

    @Valid
    private List<UUID> memberIds; // other participants (excluding current user)
}
