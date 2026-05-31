package com.jobhuntbuddy.backend.service;

import com.jobhuntbuddy.backend.entity.JobApplication;
import com.jobhuntbuddy.backend.entity.Resume;
import com.jobhuntbuddy.backend.entity.Status;
import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.repository.JobApplicationRepository;
import com.jobhuntbuddy.backend.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CoralJobHuntExportService {
    private final JobApplicationRepository appRepo;
    private final ResumeRepository resumeRepo;
    private final CoralRunner coralRunner;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public ExportResult export(User user) {
        try {
            Path dataDir = dataDir(user);
            Files.createDirectories(dataDir);

            List<JobApplication> applications = appRepo.findByUserId(user.getId());
            List<Resume> resumes = resumeRepo.findByUserId(user.getId());

            writeJsonl(dataDir.resolve("applications.jsonl"), applications.stream().map(this::applicationRow).toList());
            writeJsonl(dataDir.resolve("resumes.jsonl"), resumes.stream().map(this::resumeRow).toList());

            return new ExportResult(
                    true,
                    "Exported " + applications.size() + " applications and " + resumes.size() + " resumes for Coral.",
                    dataDir,
                    dataDir.toUri().toString(),
                    applications.size(),
                    resumes.size()
            );
        } catch (Exception e) {
            return new ExportResult(false, "Could not export JobHuntBuddy data: " + e.getMessage(), null, "", 0, 0);
        }
    }

    @Transactional(readOnly = true)
    public SyncResult syncLocalSource(User user) {
        ExportResult export = export(user);
        if (!export.success()) {
            return new SyncResult(false, export.message(), export, null, null);
        }
        return installLocalSource(export, true);
    }

    @Transactional(readOnly = true)
    public SyncResult ensureLocalSource(User user) {
        ExportResult export = export(user);
        if (!export.success()) {
            return new SyncResult(false, export.message(), export, null, null);
        }
        return installLocalSource(export, false);
    }

    private SyncResult installLocalSource(ExportResult export, boolean forceRefreshSource) {
        Map<String, String> env = Map.of("JOBHUNTBUDDY_DATA_DIR", export.dataDirUri());
        if (!forceRefreshSource && sourceListMentionsJobHuntBuddy()) {
            CoralRunner.CoralCommandResult test = coralRunner.testJobHuntBuddySource(env);
            boolean ready = test.success() || sourceListMentionsJobHuntBuddy();
            return new SyncResult(
                    ready,
                    ready
                            ? "JobHuntBuddy local data is already available in Coral and the exported files were refreshed."
                            : "JobHuntBuddy source is installed, but Coral test did not pass yet.",
                    export,
                    null,
                    test
            );
        }

        CoralRunner.CoralCommandResult add = coralRunner.addJobHuntBuddySource(env);
        if (!add.success() && !alreadyConfigured(add.output())) {
            return new SyncResult(false, "Local Coral source export succeeded, but source add failed.", export, add, null);
        }

        CoralRunner.CoralCommandResult test = coralRunner.testJobHuntBuddySource(env);
        boolean ready = test.success() || sourceListMentionsJobHuntBuddy();
        String message = ready
                ? "JobHuntBuddy local data is queryable in Coral as jobhuntbuddy.applications and jobhuntbuddy.resumes."
                : "JobHuntBuddy data was exported, but Coral test did not pass yet.";
        return new SyncResult(ready, message, export, add, test);
    }

    private Path dataDir(User user) {
        return Path.of(System.getProperty("user.dir"))
                .toAbsolutePath()
                .normalize()
                .resolve("data")
                .resolve("coral")
                .resolve("user-" + user.getId());
    }

    private void writeJsonl(Path path, List<Map<String, Object>> rows) throws IOException {
        StringBuilder out = new StringBuilder();
        for (Map<String, Object> row : rows) {
            out.append(objectMapper.writeValueAsString(row)).append('\n');
        }
        if (out.isEmpty()) {
            out.append('\n');
        }
        Files.writeString(path, out.toString(), StandardCharsets.UTF_8);
    }

    private Map<String, Object> applicationRow(JobApplication app) {
        LocalDate appliedDate = app.getAppliedDate();
        long daysSinceApplied = appliedDate == null
                ? 0
                : Math.max(0, ChronoUnit.DAYS.between(appliedDate, LocalDate.now()));
        int followUpAfterDays = followUpAfterDays(app.getStatus());
        Resume resume = app.getResume();

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", app.getId());
        row.put("company_name", text(app.getCompanyName()));
        row.put("job_title", text(app.getJobTitle()));
        row.put("job_url", text(app.getJobUrl()));
        row.put("source_platform", app.getSourcePlatform() == null ? "OTHER" : app.getSourcePlatform().name());
        row.put("status", app.getStatus() == null ? "APPLIED" : app.getStatus().name());
        row.put("resume_id", resume == null ? null : resume.getId());
        row.put("resume_name", resume == null ? "" : text(resume.getName()));
        row.put("applied_date", appliedDate == null ? "" : appliedDate.toString());
        row.put("last_updated", app.getLastUpdated() == null ? "" : app.getLastUpdated().toString());
        row.put("location", text(app.getLocation()));
        row.put("salary_range", text(app.getSalaryRange()));
        row.put("is_remote", Boolean.TRUE.equals(app.getIsRemote()));
        row.put("notes", text(app.getNotes()));
        row.put("has_resume", resume != null);
        row.put("has_job_description", !isBlank(app.getJobDescription()));
        row.put("has_key_requirements", !isBlank(app.getKeyRequirements()));
        row.put("has_job_url", !isBlank(app.getJobUrl()));
        row.put("days_since_applied", daysSinceApplied);
        row.put("follow_up_after_days", followUpAfterDays);
        row.put("follow_up_due", isActive(app.getStatus()) && daysSinceApplied >= followUpAfterDays);
        row.put("is_active", isActive(app.getStatus()));
        return row;
    }

    private Map<String, Object> resumeRow(Resume resume) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", resume.getId());
        row.put("name", text(resume.getName()));
        row.put("description", text(resume.getDescription()));
        row.put("file_url", text(resume.getFileUrl()));
        row.put("created_at", resume.getCreatedAt() == null ? "" : resume.getCreatedAt().toString());
        return row;
    }

    private boolean sourceListMentionsJobHuntBuddy() {
        CoralRunner.CoralCommandResult list = coralRunner.listSources();
        return list.success() && list.output().toLowerCase().contains("jobhuntbuddy");
    }

    private boolean alreadyConfigured(String output) {
        String lower = output == null ? "" : output.toLowerCase();
        return lower.contains("already") || lower.contains("exists") || lower.contains("jobhuntbuddy");
    }

    private int followUpAfterDays(Status status) {
        if (status == Status.INTERVIEW) return 3;
        if (status == Status.OA) return 5;
        return 7;
    }

    private boolean isActive(Status status) {
        return status == Status.APPLIED || status == Status.OA || status == Status.INTERVIEW || status == Status.HIRING;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String text(String value) {
        return value == null ? "" : value;
    }

    public record ExportResult(
            boolean success,
            String message,
            Path dataDir,
            String dataDirUri,
            int applications,
            int resumes
    ) {
        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("success", success);
            map.put("message", message);
            map.put("dataDir", dataDir == null ? "" : dataDir.toString());
            map.put("dataDirUri", dataDirUri);
            map.put("applications", applications);
            map.put("resumes", resumes);
            return map;
        }
    }

    public record SyncResult(
            boolean ready,
            String message,
            ExportResult export,
            CoralRunner.CoralCommandResult add,
            CoralRunner.CoralCommandResult test
    ) {
        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("ready", ready);
            map.put("message", message);
            map.put("export", export == null ? Map.of() : export.toMap());
            map.put("addOutput", add == null ? "" : add.output());
            map.put("testOutput", test == null ? "" : test.output());
            return map;
        }
    }
}
