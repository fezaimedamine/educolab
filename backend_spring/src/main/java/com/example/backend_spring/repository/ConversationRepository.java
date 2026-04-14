package com.example.backend_spring.repository;

import com.example.backend_spring.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

       @Query("SELECT c FROM Conversation c " +
              "LEFT JOIN FETCH c.members cm " +
              "LEFT JOIN FETCH cm.user " +
              "WHERE c.id = :id")
       Optional<Conversation> findByIdWithMembers(@Param("id") UUID id);
    
       @Query("SELECT DISTINCT c FROM Conversation c " +
              "LEFT JOIN FETCH c.members " +
              "WHERE c.id IN (SELECT cm.conversation.id FROM ConversationMember cm WHERE cm.user.id = :userId) " +
              "ORDER BY c.createdAt DESC")
       List<Conversation> findByMemberUserId(@Param("userId") UUID userId);
    
       @Query("SELECT DISTINCT c FROM Conversation c " +
              "LEFT JOIN FETCH c.members m1 " +
              "LEFT JOIN FETCH c.members m2 " +
              "WHERE c.type = 'direct' AND m1.user.id = :userId1 AND m2.user.id = :userId2")
       List<Conversation> findDirectConversation(
              @Param("userId1") UUID userId1,
              @Param("userId2") UUID userId2);

       Optional<Conversation> findByInviteCode(String inviteCode);
       
       boolean existsByInviteCode(String inviteCode);
}
