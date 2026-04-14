package com.example.backend_spring.dto.messaging;

import com.example.backend_spring.entity.Message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor // Required for @Builder
public class MessageResponse {
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private String content;
    private boolean isRead;
    private boolean edited;
    private List<AttachmentDto> attachments;
    private OffsetDateTime createdAt;

    public static MessageResponse from(Message m, List<AttachmentDto> attachments) {
        MessageResponse r = from(m); // Call the basic one first
        r.setAttachments(attachments);
        return r;
    }

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
        r.edited = m.getEdited();
        r.createdAt = m.getCreatedAt();
        return r;
    }
}
