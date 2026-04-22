package com.example.backend_spring.repository;

import com.example.backend_spring.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    // Returns announcements visible to a student: global (targetGroup null) or in their group
    @Query("SELECT a FROM Announcement a WHERE a.targetGroup IS NULL OR LOWER(TRIM(a.targetGroup)) = LOWER(TRIM(:group)) ORDER BY a.createdAt DESC")
    List<Announcement> findVisibleForStudent(@Param("group") String group);

    List<Announcement> findAllByOrderByCreatedAtDesc();
}
