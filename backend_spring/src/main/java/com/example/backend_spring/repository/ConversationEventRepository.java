package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ConversationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationEventRepository extends JpaRepository<ConversationEvent, UUID> {
    
    List<ConversationEvent> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}