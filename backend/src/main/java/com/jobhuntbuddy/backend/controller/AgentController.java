package com.jobhuntbuddy.backend.controller;

import com.jobhuntbuddy.backend.entity.JobApplication;
import com.jobhuntbuddy.backend.entity.Resume;
import com.jobhuntbuddy.backend.entity.Status;
import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.repository.JobApplicationRepository;
import com.jobhuntbuddy.backend.repository.ResumeRepository;
import com.jobhuntbuddy.backend.service.CoralJobHuntExportService;
import com.jobhuntbuddy.backend.service.CoralRunner;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {
    private final JobApplicationRepository appRepo;
    private final ResumeRepository resumeRepo;
    private final CoralJobHuntExportService exportService;
    private final CoralRunner coralRunner;

    @GetMapping("/briefing")
    public Map<String, Object> briefing(@AuthenticationPrincipal User user) {
        List<JobApplication> apps = appRepo.findByUserId(user.getId());
        List<Resume> resumes = resumeRepo.findByUserId(user.getId());
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> followUps = apps.stream()
                .filter(this::isActive)
                .filter(app -> daysSince(app, today) >= followUpWindow(app.getStatus()))
                .sorted(Comparator.comparingLong(app -> -daysSince(app, today)))
                .limit(8)
                .map(app -> applicationCard(app, today, "Follow up"))
                .toList();

        List<Map<String, Object>> missingMemory = apps.stream()
                .filter(app -> app.getResume() == null || isBlank(app.getJobDescription()) || isBlank(app.getKeyRequirements()) || isBlank(app.getJobUrl()))
                .sorted(Comparator.comparing(JobApplication::getAppliedDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(8)
                .map(app -> applicationCard(app, today, missingReason(app)))
                .toList();

        List<Map<String, Object>> duplicates = apps.stream()
                .collect(Collectors.groupingBy(this::duplicateKey))
                .values()
                .stream()
                .filter(group -> group.size() > 1)
                .map(group -> Map.<String, Object>of(
                        "companyName", group.get(0).getCompanyName(),
                        "jobTitle", group.get(0).getJobTitle(),
                        "count", group.size(),
                        "ids", group.stream().map(JobApplication::getId).toList()
                ))
                .toList();

        Map<String, Long> resumeUsage = apps.stream()
                .map(JobApplication::getResume)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Resume::getName, LinkedHashMap::new, Collectors.counting()));

        List<String> missions = new ArrayList<>();
        if (!followUps.isEmpty()) missions.add("Send " + followUps.size() + " follow-up messages before applying to more roles.");
        if (!missingMemory.isEmpty()) missions.add("Complete memory for " + missingMemory.size() + " applications so interview callbacks are searchable.");
        if (!duplicates.isEmpty()) missions.add("Review " + duplicates.size() + " possible duplicate applications before reapplying.");
        if (missions.isEmpty()) missions.add("Your job-search memory is clean. Add today's applications with the resume and JD attached.");

        long active = apps.stream().filter(this::isActive).count();
        long interviews = apps.stream().filter(app -> app.getStatus() == Status.INTERVIEW || app.getStatus() == Status.OA).count();
        long missingResume = apps.stream().filter(app -> app.getResume() == null).count();

        Map<String, Object> result = new HashMap<>();
        result.put("summary", Map.of(
                "totalApplications", apps.size(),
                "activeApplications", active,
                "interviewPipeline", interviews,
                "missingResume", missingResume,
                "resumeVersions", resumes.size()
        ));
        result.put("missions", missions);
        result.put("followUps", followUps);
        result.put("missingMemory", missingMemory);
        result.put("duplicates", duplicates);
        result.put("resumeUsage", resumeUsage);
        result.put("coralEvidence", coralEvidence(user));
        result.put("coralSql", Map.of(
                "dailyBriefing", "SELECT company_name, job_title, status, applied_date, resume_id FROM jobhuntbuddy.applications WHERE is_active = true ORDER BY applied_date ASC",
                "resumeMemory", "SELECT r.name, COUNT(a.id) AS applications FROM jobhuntbuddy.resumes r LEFT JOIN jobhuntbuddy.applications a ON a.resume_id = r.id GROUP BY r.name ORDER BY applications DESC",
                "forgottenApplications", "SELECT company_name, job_title FROM jobhuntbuddy.applications WHERE has_resume = false OR has_job_description = false OR has_key_requirements = false"
        ));
        return result;
    }

    private Map<String, Object> coralEvidence(User user) {
        CoralJobHuntExportService.SyncResult sync = exportService.ensureLocalSource(user);
        Map<String, Object> evidence = new LinkedHashMap<>();
        evidence.put("ready", sync.ready());
        evidence.put("message", sync.message());
        evidence.put("localSource", sync.toMap());
        evidence.put("queries", Map.of(
                "statusCounts", runCoral("SELECT status, COUNT(*) AS total FROM jobhuntbuddy.applications GROUP BY status ORDER BY total DESC"),
                "followUpQueue", runCoral("SELECT company_name, job_title, days_since_applied FROM jobhuntbuddy.applications WHERE follow_up_due = true ORDER BY days_since_applied DESC LIMIT 5"),
                "resumeJoin", runCoral("SELECT a.company_name, a.job_title, r.name AS resume_name FROM jobhuntbuddy.applications a LEFT JOIN jobhuntbuddy.resumes r ON a.resume_id = r.id ORDER BY a.applied_date DESC LIMIT 8")
        ));
        return evidence;
    }

    private Map<String, Object> runCoral(String sql) {
        CoralRunner.CoralCommandResult result = coralRunner.runSqlTable(sql, null);
        return Map.of(
                "sql", sql,
                "success", result.success(),
                "result", result.output()
        );
    }

    private boolean isActive(JobApplication app) {
        return app.getStatus() == Status.APPLIED || app.getStatus() == Status.OA || app.getStatus() == Status.INTERVIEW;
    }

    private int followUpWindow(Status status) {
        if (status == Status.INTERVIEW) return 3;
        if (status == Status.OA) return 5;
        return 7;
    }

    private long daysSince(JobApplication app, LocalDate today) {
        LocalDate appliedDate = app.getAppliedDate() == null ? today : app.getAppliedDate();
        return Math.max(0, ChronoUnit.DAYS.between(appliedDate, today));
    }

    private Map<String, Object> applicationCard(JobApplication app, LocalDate today, String reason) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("id", app.getId());
        card.put("companyName", app.getCompanyName());
        card.put("jobTitle", app.getJobTitle());
        card.put("status", app.getStatus());
        card.put("sourcePlatform", app.getSourcePlatform());
        card.put("appliedDate", app.getAppliedDate());
        card.put("daysSinceApplied", daysSince(app, today));
        card.put("resumeName", app.getResume() == null ? null : app.getResume().getName());
        card.put("reason", reason);
        card.put("nextAction", nextAction(app));
        return card;
    }

    private String nextAction(JobApplication app) {
        if (app.getResume() == null) return "Attach the exact resume version before you forget it.";
        if (isBlank(app.getJobDescription())) return "Paste the job description for interview prep.";
        if (app.getStatus() == Status.INTERVIEW) return "Prepare a company-specific answer sheet and confirm the interview date.";
        if (app.getStatus() == Status.OA) return "Schedule assessment practice and check the deadline.";
        return "Send a concise recruiter follow-up with the job title and application date.";
    }

    private String missingReason(JobApplication app) {
        List<String> missing = new ArrayList<>();
        if (app.getResume() == null) missing.add("resume");
        if (isBlank(app.getJobDescription())) missing.add("JD");
        if (isBlank(app.getKeyRequirements())) missing.add("requirements");
        if (isBlank(app.getJobUrl())) missing.add("job link");
        return "Missing " + String.join(", ", missing);
    }

    private String duplicateKey(JobApplication app) {
        return normalize(app.getCompanyName()) + "::" + normalize(app.getJobTitle());
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
