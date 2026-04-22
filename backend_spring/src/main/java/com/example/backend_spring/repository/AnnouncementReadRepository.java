package com.example.backend_spring.repository;

import com.example.backend_spring.entity.AnnouncementRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, UUID> {
    List<AnnouncementRead> findByUserId(UUID userId);
    boolean existsByAnnouncementIdAndUserId(UUID announcementId, UUID userId);
}
