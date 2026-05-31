package com.jobhuntbuddy.backend.controller;

import com.jobhuntbuddy.backend.dto.GoogleDriveConnectRequest;
import com.jobhuntbuddy.backend.entity.Resume;
import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.repository.ResumeRepository;
import com.jobhuntbuddy.backend.service.CoralRunner;
import com.jobhuntbuddy.backend.service.GoogleDriveConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/agent/drive")
@RequiredArgsConstructor
public class GoogleDriveController {
    private static final String DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.metadata.readonly";
    private static final String RESUME_QUERY =
            "(name contains 'resume' or name contains 'Resume' or name contains 'CV' or name contains 'cv') and trashed = false";

    private final GoogleDriveConnectionService driveConnectionService;
    private final ResumeRepository resumeRepo;
    private final CoralRunner coralRunner;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(@AuthenticationPrincipal User user) {
        boolean connected = driveConnectionService.isConnected(user);
        return ResponseEntity.ok(Map.of(
                "connected", connected,
                "googleClientId", googleClientId == null ? "" : googleClientId,
                "oauthAvailable", googleClientId != null && !googleClientId.isBlank(),
                "scope", DRIVE_SCOPE
        ));
    }

    @PostMapping("/connect")
    public ResponseEntity<Map<String, Object>> connect(@AuthenticationPrincipal User user,
                                                       @RequestBody GoogleDriveConnectRequest body) {
        String accessToken = body == null ? "" : body.accessToken();
        GoogleDriveConnectionService.ConnectResult result = driveConnectionService.connect(user, accessToken);
        return ResponseEntity.ok(Map.of(
                "connected", result.connected(),
                "message", result.message()
        ));
    }

    @DeleteMapping("/connect")
    public ResponseEntity<Map<String, Object>> disconnect(@AuthenticationPrincipal User user) {
        driveConnectionService.disconnect(user);
        return ResponseEntity.ok(Map.of("connected", false, "message", "Google Drive disconnected."));
    }

    @GetMapping("/resumes")
    public ResponseEntity<Map<String, Object>> resumeFiles(@AuthenticationPrincipal User user) {
        DriveScan scan = scanDrive(user);
        return ResponseEntity.ok(Map.of(
                "connected", scan.available(),
                "message", scan.available() ? "Resume files loaded from Google Drive." : scan.error(),
                "files", scan.files()
        ));
    }

    @PostMapping("/sync-resumes")
    public ResponseEntity<Map<String, Object>> syncResumes(@AuthenticationPrincipal User user) {
        DriveScan scan = scanDrive(user);
        if (!scan.available()) {
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "imported", 0,
                    "message", scan.error(),
                    "files", scan.files()
            ));
        }

        List<Resume> existing = resumeRepo.findByUserId(user.getId());
        List<Resume> imported = new ArrayList<>();

        for (DriveResumeFile file : scan.files()) {
            boolean duplicate = existing.stream().anyMatch(resume ->
                    same(resume.getFileUrl(), file.webViewLink()) || same(resume.getName(), cleanName(file.name()))
            );
            if (duplicate) {
                continue;
            }

            Resume resume = Resume.builder()
                    .user(user)
                    .name(cleanName(file.name()))
                    .fileUrl(file.webViewLink())
                    .description(description(file))
                    .build();
            Resume saved = resumeRepo.save(resume);
            existing.add(saved);
            imported.add(saved);
        }

        return ResponseEntity.ok(Map.of(
                "connected", true,
                "imported", imported.size(),
                "message", imported.size() + " resume version(s) imported from Google Drive.",
                "files", scan.files(),
                "resumes", resumeRepo.findByUserId(user.getId())
        ));
    }

    private DriveScan scanDrive(User user) {
        Optional<String> token = driveConnectionService.findToken(user);
        if (token.isEmpty()) {
            return new DriveScan(false, "Connect Google Drive before importing resume versions.", List.of());
        }

        Map<String, String> env = driveConnectionService.driveEnv(token.get());
        CoralRunner.CoralCommandResult result = coralRunner.runSqlJson(
                "SELECT id, name, mimeType, webViewLink, modifiedTime FROM google_drive.resume_files(q => '"
                        + escapeSql(RESUME_QUERY) + "', page_size => 50)",
                env
        );

        if (result.success()) {
            try {
                List<Map<String, Object>> rows = objectMapper.readValue(result.output(), new TypeReference<>() {});
                return new DriveScan(true, null, rows.stream().map(this::fromRow).filter(this::hasName).toList());
            } catch (Exception ignored) {
                return scanDriveApi(token.get());
            }
        }

        return scanDriveApi(token.get());
    }

    private DriveScan scanDriveApi(String accessToken) {
        try {
            String url = "https://www.googleapis.com/drive/v3/files"
                    + "?q=" + URLEncoder.encode(RESUME_QUERY, StandardCharsets.UTF_8)
                    + "&pageSize=50"
                    + "&orderBy=modifiedTime%20desc"
                    + "&fields=files(id,name,mimeType,webViewLink,modifiedTime)";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 401 || response.statusCode() == 403) {
                return new DriveScan(false, "Google Drive access expired. Reconnect Drive and try again.", List.of());
            }
            if (response.statusCode() != 200) {
                return new DriveScan(false, "Could not read Google Drive (HTTP " + response.statusCode() + ").", List.of());
            }

            JsonNode root = objectMapper.readTree(response.body());
            List<DriveResumeFile> files = new ArrayList<>();
            for (JsonNode file : root.path("files")) {
                files.add(new DriveResumeFile(
                        file.path("id").asText(""),
                        file.path("name").asText(""),
                        file.path("mimeType").asText(""),
                        file.path("webViewLink").asText(driveLink(file.path("id").asText(""))),
                        file.path("modifiedTime").asText("")
                ));
            }
            return new DriveScan(true, null, files.stream().filter(this::hasName).toList());
        } catch (Exception e) {
            return new DriveScan(false, "Could not reach Google Drive: " + e.getMessage(), List.of());
        }
    }

    private DriveResumeFile fromRow(Map<String, Object> row) {
        String id = value(row.get("id"));
        String link = value(row.get("webViewLink"));
        if (link.isBlank()) {
            link = driveLink(id);
        }
        return new DriveResumeFile(
                id,
                value(row.get("name")),
                value(row.get("mimeType")),
                link,
                value(row.get("modifiedTime"))
        );
    }

    private boolean hasName(DriveResumeFile file) {
        return file != null && file.name() != null && !file.name().isBlank();
    }

    private String cleanName(String value) {
        return value == null
                ? "Resume version"
                : value.replaceAll("(?i)\\.(pdf|docx?|rtf)$", "").replaceAll("\\s+", " ").trim();
    }

    private String description(DriveResumeFile file) {
        String modified = file.modifiedTime() == null || file.modifiedTime().isBlank()
                ? ""
                : " Modified: " + file.modifiedTime();
        return "Imported from Google Drive." + modified;
    }

    private String driveLink(String id) {
        return id == null || id.isBlank() ? "" : "https://drive.google.com/file/d/" + id + "/view";
    }

    private boolean same(String a, String b) {
        return normalize(a).equals(normalize(b));
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private String escapeSql(String value) {
        return value.replace("'", "''");
    }

    private String value(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private record DriveScan(boolean available, String error, List<DriveResumeFile> files) {}

    private record DriveResumeFile(String id, String name, String mimeType, String webViewLink, String modifiedTime) {}
}
