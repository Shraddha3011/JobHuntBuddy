package com.jobhuntbuddy.backend.controller;

import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.service.CoralJobHuntExportService;
import com.jobhuntbuddy.backend.service.CoralRunner;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coral/sources")
@RequiredArgsConstructor
public class CoralSourceController {
    private static final List<String> RECOMMENDED_SOURCES = List.of(
            "jobhuntbuddy", "gmail", "google_drive", "google_calendar", "notion", "github", "slack"
    );

    private final CoralRunner coralRunner;
    private final CoralJobHuntExportService exportService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> sources() {
        CoralRunner.CoralCommandResult version = coralRunner.version();
        CoralRunner.CoralCommandResult configured = coralRunner.listSources();
        CoralRunner.CoralCommandResult available = coralRunner.discoverSources();

        Map<String, Object> health = new LinkedHashMap<>();
        health.put("cliAvailable", version.success());
        health.put("version", version.output());
        health.put("jobhuntbuddy", sourceInstalled(configured.output(), "jobhuntbuddy"));
        health.put("gmail", sourceInstalled(configured.output(), "gmail"));
        health.put("google_drive", sourceInstalled(configured.output(), "google_drive"));
        health.put("multiSourceReady", sourceInstalled(configured.output(), "jobhuntbuddy")
                && (sourceInstalled(configured.output(), "gmail") || sourceInstalled(configured.output(), "google_drive")));

        return ResponseEntity.ok(Map.of(
                "configured", output(configured),
                "available", output(available),
                "recommended", RECOMMENDED_SOURCES,
                "health", health
        ));
    }

    @GetMapping("/{name}")
    public ResponseEntity<Map<String, Object>> sourceInfo(@PathVariable String name) {
        CoralRunner.CoralCommandResult info = coralRunner.sourceInfo(name);
        return ResponseEntity.ok(Map.of("name", name, "info", output(info), "success", info.success()));
    }

    @PostMapping("/jobhuntbuddy/sync")
    public ResponseEntity<Map<String, Object>> syncJobHuntBuddy(@AuthenticationPrincipal User user) {
        CoralJobHuntExportService.SyncResult sync = exportService.syncLocalSource(user);
        return ResponseEntity.ok(sync.toMap());
    }

    private String output(CoralRunner.CoralCommandResult result) {
        return result.output() == null || result.output().isBlank() ? "No output." : result.output();
    }

    private boolean sourceInstalled(String configured, String name) {
        return configured != null && configured.toLowerCase().contains(name.toLowerCase());
    }
}
