package com.jobhuntbuddy.backend.repository;
import com.jobhuntbuddy.backend.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByUserId(Long userId);
}