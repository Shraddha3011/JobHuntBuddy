package com.jobhuntbuddy.backend.controller;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@RestController @RequestMapping("/api/coral")
public class CoralController {

    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> runQuery(@RequestBody Map<String, String> body) {
        String sql = body.get("sql");
        if (sql == null || sql.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "SQL is required"));
        try {
            ProcessBuilder pb = new ProcessBuilder("coral", "sql", "--format", "table", sql);
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            String output = new String(proc.getInputStream().readAllBytes());
            proc.waitFor(10, TimeUnit.SECONDS);
            return ResponseEntity.ok(Map.of("result", output, "sql", sql));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("result", "Coral CLI is not available or no source is configured yet. Run: coral onboard", "sql", sql));
        }
    }

    @GetMapping("/insight/{type}")
    public ResponseEntity<Map<String, Object>> insight(@PathVariable String type) {
        Map<String, String> queries = Map.of(
                "ghosted", "SELECT company_name, job_title, applied_date, last_updated FROM job_applications WHERE status = 'APPLIED' AND last_updated < NOW() - INTERVAL '14 days'",
                "platform-conversion", "SELECT source_platform, COUNT(*) as total, SUM(CASE WHEN status = 'INTERVIEW' THEN 1 ELSE 0 END) as interviews FROM job_applications GROUP BY source_platform ORDER BY interviews DESC",
                "timeline", "SELECT DATE(applied_date) as day, COUNT(*) as applications FROM job_applications GROUP BY DATE(applied_date) ORDER BY day DESC LIMIT 30",
                "company-data", "SELECT j.company_name, j.job_title, j.status, c.glassdoor_rating, c.avg_response_days FROM job_applications j LEFT JOIN company_data c ON LOWER(j.company_name) = LOWER(c.company_name) ORDER BY j.applied_date DESC"
        );
        String sql = queries.getOrDefault(type, "SELECT * FROM job_applications LIMIT 10");
        try {
            ProcessBuilder pb = new ProcessBuilder("coral", "sql", "--format", "table", sql);
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            String output = new String(proc.getInputStream().readAllBytes());
            proc.waitFor(10, TimeUnit.SECONDS);
            return ResponseEntity.ok(Map.of("result", output, "sql", sql));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("result", "Sample: " + sql, "sql", sql));
        }
    }
}
