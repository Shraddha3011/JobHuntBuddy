package com.jobhuntbuddy.backend.repository;
import com.jobhuntbuddy.backend.entity.JobApplication;
import com.jobhuntbuddy.backend.entity.Platform;
import com.jobhuntbuddy.backend.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByUserId(Long userId);
    List<JobApplication> findByUserIdAndStatus(Long userId, Status status);
    long countByUserIdAndStatus(Long userId, Status status);

    @Query("SELECT j FROM JobApplication j WHERE j.user.id = :userId AND j.lastUpdated < :cutoff AND j.status = 'APPLIED'")
    List<JobApplication> findGhosted(@Param("userId") Long userId, @Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT j.sourcePlatform, COUNT(j), SUM(CASE WHEN j.status = 'INTERVIEW' THEN 1 ELSE 0 END) FROM JobApplication j WHERE j.user.id = :userId GROUP BY j.sourcePlatform")
    List<Object[]> getPlatformStats(@Param("userId") Long userId);
}