package com.example.backend_spring.service;

import com.example.backend_spring.dto.announcement.AnnouncementResponse;
import com.example.backend_spring.dto.announcement.CreateAnnouncementRequest;
import com.example.backend_spring.entity.Announcement;
import com.example.backend_spring.entity.Notification;
import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.NotificationType;
import com.example.backend_spring.enums.UserRole;
import com.example.backend_spring.exception.ForbiddenException;
import com.example.backend_spring.exception.ResourceNotFoundException;
import com.example.backend_spring.repository.AnnouncementRepository;
import com.example.backend_spring.repository.NotificationRepository;
import com.example.backend_spring.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<AnnouncementResponse> getAnnouncements(User viewer) {
        List<Announcement> announcements = switch (viewer.getRole()) {
            case STUDENT -> announcementRepository.findVisibleForStudent(viewer.getGroupName());
            default -> announcementRepository.findAllByOrderByCreatedAtDesc();
        };
        return announcements.stream().map(AnnouncementResponse::from).toList();
    }

    @Transactional
    public AnnouncementResponse create(CreateAnnouncementRequest req, User author) {
        Announcement announcement = Announcement.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .targetGroup(req.getTargetGroup())
                .createdBy(author.getId())
                .build();
        announcement = announcementRepository.save(announcement);

        // Notify targeted users
        List<User> targets = req.getTargetGroup() == null
                ? userRepository.findByIsActiveTrue()
                : userRepository.findByIsActiveTrue().stream()
                        .filter(u -> req.getTargetGroup().equals(u.getGroupName()))
                        .toList();

        final UUID announcementId = announcement.getId();
        List<Notification> notifications = targets.stream()
                .filter(u -> !u.getId().equals(author.getId()))
                .map(u -> Notification.builder()
                        .userId(u.getId())
                        .type(NotificationType.ANNOUNCEMENT)
                        .referenceId(announcementId)
                        .build())
                .toList();
        notificationRepository.saveAll(notifications);

        return AnnouncementResponse.from(announcement);
    }

    public void delete(UUID id, User user) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        if (!announcement.getCreatedBy().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Not authorized to delete this announcement");
        }
        announcementRepository.delete(announcement);
    }
}
