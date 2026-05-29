package com.jobhuntbuddy.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/coral/sources")
public class CoralSourceController {
    private static final List<String> RECOMMENDED_SOURCES = List.of("github", "google_calendar", "notion", "slack");

    @GetMapping
    public ResponseEntity<Map<String, Object>> sources() {
        return ResponseEntity.ok(Map.of(
                "configured", runCoral("source", "list"),
                "available", runCoral("source", "discover"),
                "recommended", RECOMMENDED_SOURCES
        ));
    }

    @GetMapping("/{name}")
    public ResponseEntity<Map<String, Object>> sourceInfo(@PathVariable String name) {
        return ResponseEntity.ok(Map.of("name", name, "info", runCoral("source", "info", name)));
    }

    private String runCoral(String... args) {
        try {
            String[] command = new String[args.length + 1];
            command[0] = "coral";
            System.arraycopy(args, 0, command, 1, args.length);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            boolean finished = proc.waitFor(10, TimeUnit.SECONDS);
            String output = new String(proc.getInputStream().readAllBytes());
            if (!finished) {
                proc.destroyForcibly();
                return "Coral command timed out.";
            }
            return output.isBlank() ? "No output." : output;
        } catch (IOException e) {
            return "Coral CLI is not available on PATH.";
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Coral command was interrupted.";
        }
    }
}
