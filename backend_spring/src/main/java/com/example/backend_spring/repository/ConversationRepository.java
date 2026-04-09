package com.example.backend_spring.repository;

import com.example.backend_spring.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT DISTINCT c FROM Conversation c JOIN c.members m WHERE m.id.userId = :userId ORDER BY c.createdAt DESC")
    List<Conversation> findByMemberUserId(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT c FROM Conversation c JOIN c.members m1 JOIN c.members m2 " +
           "WHERE c.type = 'direct' AND m1.id.userId = :userId1 AND m2.id.userId = :userId2")
    List<Conversation> findDirectConversation(
            @Param("userId1") UUID userId1,
            @Param("userId2") UUID userId2);
}
