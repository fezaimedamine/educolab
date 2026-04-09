package com.example.backend_spring.dto.meeting;

import com.example.backend_spring.entity.Meeting;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class MeetingResponse {
    private UUID id;
    private String title;
    private String description;
    private String meetLink;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private UUID createdBy;
    private String authorName;
    private String targetGroup;
    private OffsetDateTime createdAt;

    public static MeetingResponse from(Meeting m) {
        MeetingResponse r = new MeetingResponse();
        r.id = m.getId();
        r.title = m.getTitle();
        r.description = m.getDescription();
        r.meetLink = m.getMeetLink();
        r.startTime = m.getStartTime();
        r.endTime = m.getEndTime();
        r.createdBy = m.getCreatedBy();
        if (m.getAuthor() != null) {
            r.authorName = m.getAuthor().getFirstName() + " " + m.getAuthor().getLastName();
        }
        r.targetGroup = m.getTargetGroup();
        r.createdAt = m.getCreatedAt();
        return r;
    }
}
