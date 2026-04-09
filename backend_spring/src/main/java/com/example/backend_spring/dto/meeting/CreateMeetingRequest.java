package com.example.backend_spring.dto.meeting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class CreateMeetingRequest {

    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String meetLink;

    @NotNull
    private OffsetDateTime startTime;

    @NotNull
    private OffsetDateTime endTime;

    private String targetGroup; // null = all groups
}
