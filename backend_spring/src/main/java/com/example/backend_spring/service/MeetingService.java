package com.example.backend_spring.service;

import com.example.backend_spring.dto.meeting.CreateMeetingRequest;
import com.example.backend_spring.dto.meeting.MeetingResponse;
import com.example.backend_spring.entity.Meeting;
import com.example.backend_spring.entity.Notification;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.NotificationType;
import com.example.backend_spring.enums.UserRole;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.MeetingRepository;
import com.example.backend_spring.repository.NotificationRepository;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<MeetingResponse> getMeetings(User viewer) {
        List<Meeting> meetings = switch (viewer.getRole()) {
            case STUDENT -> meetingRepository.findVisibleForStudent(viewer.getGroupName());
            default -> meetingRepository.findAllByOrderByStartTimeAsc();
        };
        return meetings.stream().map(MeetingResponse::from).toList();
    }

    @Transactional
    public MeetingResponse create(CreateMeetingRequest req, User author) {
        Meeting meeting = Meeting.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .meetLink(req.getMeetLink())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .createdBy(author.getId())
                .targetGroup(req.getTargetGroup())
                .build();
        meeting = meetingRepository.save(meeting);

        List<User> targets = req.getTargetGroup() == null
                ? userRepository.findByIsActiveTrue()
                : userRepository.findByIsActiveTrue().stream()
                        .filter(u -> req.getTargetGroup().equals(u.getGroupName()))
                        .toList();

        final UUID meetingId = meeting.getId();
        List<Notification> notifications = targets.stream()
                .filter(u -> !u.getId().equals(author.getId()))
                .map(u -> Notification.builder()
                        .userId(u.getId())
                        .type(NotificationType.MEETING)
                        .referenceId(meetingId)
                        .build())
                .toList();
        notificationRepository.saveAll(notifications);

        return MeetingResponse.from(meeting);
    }

    public void delete(UUID id, User user) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        if (!meeting.getCreatedBy().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Not authorized to delete this meeting");
        }
        meetingRepository.delete(meeting);
    }
}
