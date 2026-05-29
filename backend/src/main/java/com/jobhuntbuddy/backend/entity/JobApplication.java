package com.jobhuntbuddy.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "job_applications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) private User user;

    @Column(name = "company_name", nullable = false) private String companyName;
    @Column(name = "job_title", nullable = false) private String jobTitle;
    @Column(name = "job_url") private String jobUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_platform") private Platform sourcePlatform;

    @Enumerated(EnumType.STRING)
    @Builder.Default private Status status = Status.APPLIED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id") private Resume resume;

    @Column(name = "job_description", columnDefinition = "TEXT") private String jobDescription;
    @Column(name = "key_requirements", columnDefinition = "TEXT") private String keyRequirements;
    @Column(name = "salary_range") private String salaryRange;
    private String location;
    @Column(name = "is_remote") @Builder.Default private Boolean isRemote = false;
    @Column(name = "applied_date") private LocalDate appliedDate;
    private String notes;
    @Column(name = "last_updated") private LocalDateTime lastUpdated;

    @PrePersist protected void onCreate() { lastUpdated = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { lastUpdated = LocalDateTime.now(); }
}