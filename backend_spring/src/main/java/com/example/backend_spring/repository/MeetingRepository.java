package com.example.backend_spring.repository;

import com.example.backend_spring.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MeetingRepository extends JpaRepository<Meeting, UUID> {

    @Query("SELECT m FROM Meeting m WHERE m.targetGroup IS NULL OR m.targetGroup = :group ORDER BY m.startTime ASC")
    List<Meeting> findVisibleForStudent(@Param("group") String group);

    List<Meeting> findAllByOrderByStartTimeAsc();
}
