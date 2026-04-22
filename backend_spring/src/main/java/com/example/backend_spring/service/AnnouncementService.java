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
    private final com.example.backend_spring.repository.AnnouncementCommentRepository commentRepository;
    private final com.example.backend_spring.repository.AnnouncementReadRepository readRepository;

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncements(User viewer) {
        List<Announcement> announcements = switch (viewer.getRole()) {
            case STUDENT -> announcementRepository.findVisibleForStudent(viewer.getGroupName());
            default -> announcementRepository.findAllByOrderByCreatedAtDesc();
        };
        return announcements.stream().map(AnnouncementResponse::from).toList();
    }

    @Transactional
    public AnnouncementResponse create(CreateAnnouncementRequest req, User author) {
        if (author.getRole() == UserRole.STUDENT) {
            req.setTargetGroup(author.getGroupName());
        }

        Announcement announcement = Announcement.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .targetGroup(req.getTargetGroup())
                .courseName(req.getCourseName())
                .deadline(req.getDeadline())
                .tags(req.getTags())
                .attachments(req.getAttachments())
                .summary(req.getSummary())
                .createdBy(author.getId())
                .build();
        announcement = announcementRepository.save(announcement);

        // Notify targeted users
        List<User> targets = req.getTargetGroup() == null
                ? userRepository.findByIsActiveTrue()
                : userRepository.findByIsActiveTrue().stream()
                        .filter(u -> u.getGroupName() != null && u.getGroupName().trim().equalsIgnoreCase(req.getTargetGroup().trim()))
                        .toList();

        final UUID announcementId = announcement.getId();
        final String authorName = author.getFirstName() + " " + author.getLastName();
        final String announcementTitle = announcement.getTitle();
        
        List<Notification> notifications = targets.stream()
                .filter(u -> !u.getId().equals(author.getId()))
                .map(u -> Notification.builder()
                        .userId(u.getId())
                        .type(NotificationType.ANNOUNCEMENT)
                        .referenceId(announcementId)
                        .title("New Announcement")
                        .content(announcementTitle)
                        .senderName(authorName)
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

    @Transactional(readOnly = true)
    public List<com.example.backend_spring.dto.announcement.CommentResponse> getComments(UUID announcementId, User viewer) {
        // Optional: verify viewer can see this announcement
        return commentRepository.findByAnnouncementIdOrderByCreatedAtAsc(announcementId)
                .stream()
                .map(com.example.backend_spring.dto.announcement.CommentResponse::from)
                .toList();
    }

    @Transactional
    public com.example.backend_spring.dto.announcement.CommentResponse addComment(UUID announcementId, com.example.backend_spring.dto.announcement.CreateCommentRequest req, User author) {
        // Optional: verify this announcement exists and is visible to the author
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        com.example.backend_spring.entity.AnnouncementComment comment = com.example.backend_spring.entity.AnnouncementComment.builder()
                .announcementId(announcementId)
                .content(req.getContent())
                .createdBy(author.getId())
                .build();
        comment = commentRepository.save(comment);

        // Optional: Notify announcement author if it's someone else commenting
        if (!author.getId().equals(announcement.getCreatedBy())) {
            Notification n = Notification.builder()
                    .userId(announcement.getCreatedBy())
                    .type(NotificationType.ANNOUNCEMENT)
                    .referenceId(announcement.getId())
                    .title("New Comment")
                    .content(req.getContent())
                    .senderName(author.getFirstName() + " " + author.getLastName())
                    .build();
            notificationRepository.save(n);
        }

        return com.example.backend_spring.dto.announcement.CommentResponse.from(comment);
    }

    @Transactional
    public void markAsRead(UUID announcementId, User user) {
        if (!readRepository.existsByAnnouncementIdAndUserId(announcementId, user.getId())) {
            com.example.backend_spring.entity.AnnouncementRead ar = com.example.backend_spring.entity.AnnouncementRead.builder()
                    .announcementId(announcementId)
                    .userId(user.getId())
                    .build();
            readRepository.save(ar);
        }
    }

    @Transactional(readOnly = true)
    public List<UUID> getReadAnnouncements(User user) {
        return readRepository.findByUserId(user.getId())
                .stream()
                .map(com.example.backend_spring.entity.AnnouncementRead::getAnnouncementId)
                .toList();
    }
}
