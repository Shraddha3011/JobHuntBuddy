package com.jobhuntbuddy.backend.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "resumes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Resume {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(nullable = false) private String name;
    private String description;
    @Column(name = "file_url") private String fileUrl;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}