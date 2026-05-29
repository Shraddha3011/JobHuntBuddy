package com.jobhuntbuddy.backend.controller;
import com.jobhuntbuddy.backend.entity.*;
import com.jobhuntbuddy.backend.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/resumes") @RequiredArgsConstructor
public class ResumeController {
    private final ResumeRepository resumeRepo;

    @GetMapping
    public List<Resume> getAll(@AuthenticationPrincipal User user) {
        return resumeRepo.findByUserId(user.getId());
    }

    @PostMapping
    public Resume create(@AuthenticationPrincipal User user, @RequestBody Resume dto) {
        return resumeRepo.save(Resume.builder()
                .user(user).name(dto.getName()).description(dto.getDescription())
                .fileUrl(dto.getFileUrl()).build());
    }
}