package com.example.backend_spring.dto.announcement;

import com.example.backend_spring.entity.Announcement;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class AnnouncementResponse {
    private UUID id;
    private String title;
    private String content;
    private String targetGroup;
    private String courseName;
    private OffsetDateTime deadline;
    private String tags;
    private String attachments;
    private String summary;
    private UUID createdBy;
    private String authorName;
    private OffsetDateTime createdAt;

    public static AnnouncementResponse from(Announcement a) {
        AnnouncementResponse r = new AnnouncementResponse();
        r.id = a.getId();
        r.title = a.getTitle();
        r.content = a.getContent();
        r.targetGroup = a.getTargetGroup();
        r.courseName = a.getCourseName();
        r.deadline = a.getDeadline();
        r.tags = a.getTags();
        r.attachments = a.getAttachments();
        r.summary = a.getSummary();
        r.createdBy = a.getCreatedBy();
        if (a.getAuthor() != null) {
            r.authorName = a.getAuthor().getFirstName() + " " + a.getAuthor().getLastName();
        }
        r.createdAt = a.getCreatedAt();
        return r;
    }
}
