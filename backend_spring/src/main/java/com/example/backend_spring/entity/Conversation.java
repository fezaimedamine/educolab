package com.example.backend_spring.entity;

import com.example.backend_spring.enums.ConversationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "invite_code", length = 6, unique = true)
    private String inviteCode;

    // converter (ConversationTypeConverter, autoApply=true) handles lowercase mapping
    @Column(nullable = false, columnDefinition = "conversation_type")
    private ConversationType type;

    @Column(length = 255)
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "conversation", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private List<ConversationMember> members = new ArrayList<>();

    @PrePersist
    protected void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
