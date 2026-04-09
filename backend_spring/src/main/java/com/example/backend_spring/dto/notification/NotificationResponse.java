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
    private boolean isRead;
    private OffsetDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.id = n.getId();
        r.userId = n.getUserId();
        r.type = n.getType().name().toLowerCase();
        r.referenceId = n.getReferenceId();
        r.isRead = n.isRead();
        r.createdAt = n.getCreatedAt();
        return r;
    }
}
