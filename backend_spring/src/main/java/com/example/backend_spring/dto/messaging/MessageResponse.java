package com.example.backend_spring.dto.messaging;

import com.example.backend_spring.entity.Message;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class MessageResponse {
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private String content;
    private boolean isRead;
    private OffsetDateTime createdAt;

    public static MessageResponse from(Message m) {
        MessageResponse r = new MessageResponse();
        r.id = m.getId();
        r.conversationId = m.getConversationId();
        r.senderId = m.getSenderId();
        if (m.getSender() != null) {
            r.senderName = m.getSender().getFirstName() + " " + m.getSender().getLastName();
        }
        r.content = m.getContent();
        r.isRead = m.isRead();
        r.createdAt = m.getCreatedAt();
        return r;
    }
}
