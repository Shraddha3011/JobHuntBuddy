package com.jobhuntbuddy.backend.controller;
import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.service.CacheService;
import com.jobhuntbuddy.backend.service.CoralJobHuntExportService;
import com.jobhuntbuddy.backend.service.CoralRunner;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@RestController @RequestMapping("/api/coral")
@RequiredArgsConstructor
public class CoralController {
    private final CoralRunner coralRunner;
    private final CoralJobHuntExportService exportService;
    private final CacheService cacheService;

    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> runQuery(@AuthenticationPrincipal User user,
                                                        @RequestBody Map<String, String> body) {
        String sql = body.get("sql");
        if (sql == null || sql.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "SQL is required"));
        if (!isReadOnlySelect(sql)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Only read-only SELECT/WITH queries are allowed in the Coral workspace.",
                    "sql", sql
            ));
        }

        String format = body.getOrDefault("format", "table");
        String cacheKey = "coral_query_" + user.getId() + "_" + hash(sql + "|" + format);
        Map<String, Object> cached = cacheService.get(cacheKey);
        if (cached != null) {
            Map<String, Object> response = new LinkedHashMap<>(cached);
            response.put("cached", true);
            return ResponseEntity.ok(response);
        }

        CoralJobHuntExportService.SyncResult localSource = exportService.ensureLocalSource(user);
        CoralRunner.CoralCommandResult result = "json".equalsIgnoreCase(format)
                ? coralRunner.runSqlJson(sql, null)
                : coralRunner.runSqlTable(sql, null);

        Map<String, Object> response = queryResponse(sql, result, localSource, false);
        cacheService.set(cacheKey, response, 120);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/insight/{type}")
    public ResponseEntity<Map<String, Object>> insight(@AuthenticationPrincipal User user,
                                                       @PathVariable String type) {
        Map<String, String> queries = Map.of(
                "ghosted", "SELECT company_name, job_title, status, applied_date, days_since_applied FROM jobhuntbuddy.applications WHERE follow_up_due = true ORDER BY days_since_applied DESC",
                "platform-conversion", "SELECT source_platform, COUNT(*) AS total, SUM(CASE WHEN status = 'INTERVIEW' OR status = 'OFFER' THEN 1 ELSE 0 END) AS positive_signals FROM jobhuntbuddy.applications GROUP BY source_platform ORDER BY positive_signals DESC",
                "timeline", "SELECT applied_date, COUNT(*) AS applications FROM jobhuntbuddy.applications WHERE applied_date <> '' GROUP BY applied_date ORDER BY applied_date DESC LIMIT 30",
                "resume-memory", "SELECT r.name, COUNT(a.id) AS applications FROM jobhuntbuddy.resumes r LEFT JOIN jobhuntbuddy.applications a ON a.resume_id = r.id GROUP BY r.name ORDER BY applications DESC",
                "company-data", "SELECT company_name, job_title, status, source_platform, resume_name FROM jobhuntbuddy.applications ORDER BY applied_date DESC LIMIT 30",
                "memory-gaps", "SELECT company_name, job_title, has_resume, has_job_description, has_key_requirements, has_job_url FROM jobhuntbuddy.applications WHERE has_resume = false OR has_job_description = false OR has_key_requirements = false OR has_job_url = false ORDER BY applied_date DESC",
                "drive-join", "SELECT a.company_name, a.job_title, a.resume_name, r.file_url FROM jobhuntbuddy.applications a LEFT JOIN jobhuntbuddy.resumes r ON a.resume_id = r.id ORDER BY a.applied_date DESC",
                "coral-catalog", "SELECT table_catalog, table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('jobhuntbuddy', 'gmail', 'google_drive') ORDER BY table_schema, table_name"
        );
        String sql = queries.getOrDefault(type, "SELECT * FROM jobhuntbuddy.applications LIMIT 10");
        String cacheKey = "coral_insight_" + user.getId() + "_" + type;
        Map<String, Object> cached = cacheService.get(cacheKey);
        if (cached != null) {
            Map<String, Object> response = new LinkedHashMap<>(cached);
            response.put("cached", true);
            return ResponseEntity.ok(response);
        }

        CoralJobHuntExportService.SyncResult localSource = exportService.ensureLocalSource(user);
        CoralRunner.CoralCommandResult result = coralRunner.runSqlTable(sql, null);
        Map<String, Object> response = queryResponse(sql, result, localSource, false);
        cacheService.set(cacheKey, response, 120);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/win-brief")
    public ResponseEntity<Map<String, Object>> winBrief(@AuthenticationPrincipal User user) {
        CoralJobHuntExportService.SyncResult localSource = exportService.ensureLocalSource(user);
        Map<String, String> queries = new LinkedHashMap<>();
        queries.put("followUps", "SELECT company_name, job_title, days_since_applied FROM jobhuntbuddy.applications WHERE follow_up_due = true ORDER BY days_since_applied DESC LIMIT 5");
        queries.put("memoryGaps", "SELECT company_name, job_title, has_resume, has_job_description, has_key_requirements FROM jobhuntbuddy.applications WHERE has_resume = false OR has_job_description = false OR has_key_requirements = false LIMIT 8");
        queries.put("resumeUsage", "SELECT r.name, COUNT(a.id) AS applications FROM jobhuntbuddy.resumes r LEFT JOIN jobhuntbuddy.applications a ON a.resume_id = r.id GROUP BY r.name ORDER BY applications DESC");
        queries.put("sourceROI", "SELECT source_platform, COUNT(*) AS total, SUM(CASE WHEN status = 'INTERVIEW' OR status = 'OFFER' THEN 1 ELSE 0 END) AS positive_signals FROM jobhuntbuddy.applications GROUP BY source_platform ORDER BY positive_signals DESC");

        Map<String, Object> outputs = new LinkedHashMap<>();
        queries.forEach((label, sql) -> outputs.put(label, queryResponse(sql, coralRunner.runSqlTable(sql, null), localSource, false)));

        return ResponseEntity.ok(Map.of(
                "localSource", localSource.toMap(),
                "queries", outputs,
                "message", "This briefing is generated by Coral SQL over exported JobHuntBuddy data, then used by the First Mate agent for next actions."
        ));
    }

    private Map<String, Object> queryResponse(String sql,
                                              CoralRunner.CoralCommandResult result,
                                              CoralJobHuntExportService.SyncResult localSource,
                                              boolean cached) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", result.success());
        response.put("result", result.output());
        response.put("sql", sql);
        response.put("cached", cached);
        response.put("exitCode", result.exitCode());
        response.put("localSource", localSource.toMap());
        if (!result.success()) {
            response.put("message", "Coral query did not complete. Check Coral CLI, source auth, or SQL table names.");
        }
        return response;
    }

    private boolean isReadOnlySelect(String sql) {
        String normalized = sql.stripLeading().toLowerCase(Locale.ROOT);
        return normalized.startsWith("select ") || normalized.startsWith("with ");
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return Integer.toHexString(value.hashCode());
        }
    }
}
