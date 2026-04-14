package com.example.backend_spring.repository;

import com.example.backend_spring.entity.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, UUID> {
    
    List<MessageAttachment> findByMessageId(UUID messageId);

    @Query("SELECT m.conversationId FROM MessageAttachment a JOIN a.message m WHERE a.id = :id")
    Optional<UUID> findConversationIdByAttachmentId(@Param("id") UUID id);
}