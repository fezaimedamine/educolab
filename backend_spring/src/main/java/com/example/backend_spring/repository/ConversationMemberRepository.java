package com.example.backend_spring.repository;

import com.example.backend_spring.entity.ConversationMember;
import com.example.backend_spring.entity.ConversationMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, ConversationMemberId> {

    List<ConversationMember> findById_ConversationId(UUID conversationId);

    boolean existsById_UserIdAndId_ConversationId(UUID userId, UUID conversationId);
}
