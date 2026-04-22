package com.example.backend_spring.dto.announcement;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAnnouncementRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private String targetGroup; // null = all groups

    private String courseName;
    private java.time.OffsetDateTime deadline;
    private String tags;
    private String attachments;
    private String summary;
}
