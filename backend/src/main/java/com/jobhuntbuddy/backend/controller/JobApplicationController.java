package com.jobhuntbuddy.backend.controller;
import com.jobhuntbuddy.backend.dto.JobApplicationDto;
import com.jobhuntbuddy.backend.entity.*;
import com.jobhuntbuddy.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController @RequestMapping("/api/applications") @RequiredArgsConstructor
public class JobApplicationController {
    private final JobApplicationRepository appRepo;
    private final ResumeRepository resumeRepo;

    @GetMapping
    public List<JobApplication> getAll(@AuthenticationPrincipal User user) {
        return appRepo.findByUserId(user.getId());
    }

    @PostMapping
    public JobApplication create(@AuthenticationPrincipal User user, @RequestBody JobApplicationDto dto) {
        JobApplication app = JobApplication.builder()
                .user(user).companyName(dto.getCompanyName()).jobTitle(dto.getJobTitle())
                .jobUrl(dto.getJobUrl()).sourcePlatform(dto.getSourcePlatform())
                .status(dto.getStatus() != null ? dto.getStatus() : Status.APPLIED)
                .jobDescription(dto.getJobDescription()).keyRequirements(dto.getKeyRequirements())
                .salaryRange(dto.getSalaryRange()).location(dto.getLocation())
                .isRemote(dto.getIsRemote() != null && dto.getIsRemote())
                .appliedDate(dto.getAppliedDate()).notes(dto.getNotes())
                .build();
        if (dto.getResumeId() != null)
            resumeRepo.findById(dto.getResumeId()).ifPresent(app::setResume);
        return appRepo.save(app);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobApplication> update(@AuthenticationPrincipal User user,
                                                 @PathVariable Long id, @RequestBody JobApplicationDto dto) {
        return appRepo.findById(id)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .map(a -> {
                    if (dto.getStatus() != null) a.setStatus(dto.getStatus());
                    if (dto.getNotes() != null) a.setNotes(dto.getNotes());
                    if (dto.getJobDescription() != null) a.setJobDescription(dto.getJobDescription());
                    if (dto.getKeyRequirements() != null) a.setKeyRequirements(dto.getKeyRequirements());
                    if (dto.getResumeId() != null)
                        resumeRepo.findById(dto.getResumeId()).ifPresent(a::setResume);
                    return ResponseEntity.ok(appRepo.save(a));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return appRepo.findById(id)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .map(a -> { appRepo.delete(a); return ResponseEntity.ok().<Void>build(); })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@AuthenticationPrincipal User user) {
        Long uid = user.getId();
        List<JobApplication> applications = appRepo.findByUserId(uid);
        List<JobApplication> ghosted = appRepo.findGhosted(uid, LocalDateTime.now().minusDays(14));
        List<Object[]> platformData = appRepo.getPlatformStats(uid);
        Map<String, Object> result = new HashMap<>();
        result.put("total", applications.size());
        result.put("interviews", appRepo.countByUserIdAndStatus(uid, Status.INTERVIEW));
        result.put("offers", appRepo.countByUserIdAndStatus(uid, Status.OFFER));
        result.put("ghosted", ghosted.size());
        result.put("platformStats", platformData);
        return result;
    }
}
