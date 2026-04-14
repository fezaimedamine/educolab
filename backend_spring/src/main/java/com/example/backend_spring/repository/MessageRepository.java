package com.example.backend_spring.repository;

import com.example.backend_spring.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    
    @Query("SELECT m FROM Message m " +
           "LEFT JOIN FETCH m.sender " +
           "WHERE m.conversationId = :conversationId " +
           "ORDER BY m.createdAt DESC")
    Page<Message> findByConversationIdOrderByCreatedAtDesc(
        @Param("conversationId") UUID conversationId, 
        Pageable pageable
    );

    Optional<Message> findByIdAndConversationId(UUID messageId, UUID conversationId);

    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.id = :id")
    Optional<Message> findByIdWithSender(@Param("id") UUID id);

    // Add this line:
    List<Message> findByConversationId(UUID conversationId, Pageable pageable);
}
