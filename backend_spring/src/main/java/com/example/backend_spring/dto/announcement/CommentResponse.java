package com.example.backend_spring.dto.announcement;

import com.example.backend_spring.entity.AnnouncementComment;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class CommentResponse {
    private UUID id;
    private UUID announcementId;
    private String content;
    private UUID createdBy;
    private String authorName;
    private OffsetDateTime createdAt;

    public static CommentResponse from(AnnouncementComment c) {
        CommentResponse r = new CommentResponse();
        r.id = c.getId();
        r.announcementId = c.getAnnouncementId();
        r.content = c.getContent();
        r.createdBy = c.getCreatedBy();
        if (c.getAuthor() != null) {
            r.authorName = c.getAuthor().getFirstName() + " " + c.getAuthor().getLastName();
        }
        r.createdAt = c.getCreatedAt();
        return r;
    }
}
