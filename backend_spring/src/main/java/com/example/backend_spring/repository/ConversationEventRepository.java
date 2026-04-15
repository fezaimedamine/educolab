package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ConversationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationEventRepository extends JpaRepository<ConversationEvent, UUID> {
    
    List<ConversationEvent> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    @Query("SELECT e FROM ConversationEvent e JOIN FETCH e.user LEFT JOIN FETCH e.triggeredBy WHERE e.conversation.id = :conversationId ORDER BY e.createdAt")
    List<ConversationEvent> findByConversationIdWithUsers(@Param("conversationId") UUID conversationId);
}