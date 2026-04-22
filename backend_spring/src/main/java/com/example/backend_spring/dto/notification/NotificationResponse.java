package com.example.backend_spring.dto.notification;

import com.example.backend_spring.entity.Notification;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class NotificationResponse {
    private UUID id;
    private UUID userId;
    private String type;
    private UUID referenceId;
    private String title;
    private String content;
    private String senderName;
    private boolean read;
    private OffsetDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.id = n.getId();
        r.userId = n.getUserId();
        r.type = n.getType().name().toLowerCase();
        r.referenceId = n.getReferenceId();
        r.title = n.getTitle();
        r.content = n.getContent();
        r.senderName = n.getSenderName();
        r.read = n.isRead();
        r.createdAt = n.getCreatedAt();
        return r;
    }
}
