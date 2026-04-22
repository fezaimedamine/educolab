package com.example.backend_spring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "announcement_reads", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"announcement_id", "user_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AnnouncementRead {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "announcement_id", nullable = false)
    private UUID announcementId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;
}
