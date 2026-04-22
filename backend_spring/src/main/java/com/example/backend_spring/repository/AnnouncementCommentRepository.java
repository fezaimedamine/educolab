package com.example.backend_spring.repository;

import com.example.backend_spring.entity.AnnouncementComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnnouncementCommentRepository extends JpaRepository<AnnouncementComment, UUID> {
    List<AnnouncementComment> findByAnnouncementIdOrderByCreatedAtAsc(UUID announcementId);
}
