package com.jobhuntbuddy.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_integrations", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "provider"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserIntegration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(name = "access_token", nullable = false, length = 4096)
    private String accessToken;

    @Column(name = "connected_at")
    private LocalDateTime connectedAt;

    @PrePersist
    protected void onCreate() {
        if (connectedAt == null) {
            connectedAt = LocalDateTime.now();
        }
    }
}
