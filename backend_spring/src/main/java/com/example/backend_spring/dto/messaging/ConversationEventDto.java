package com.example.backend_spring.dto.messaging;

import com.example.backend_spring.enums.EventType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationEventDto {
    private UUID id;
    private UUID conversationId;
    private EventType eventType;
    private UUID userId;
    private String userName;
    private UUID triggeredById;
    private String triggeredByName;
    private LocalDateTime createdAt;
}