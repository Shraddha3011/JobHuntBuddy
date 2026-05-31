package com.jobhuntbuddy.backend.service;

import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.entity.UserIntegration;
import com.jobhuntbuddy.backend.repository.UserIntegrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GoogleDriveConnectionService {
    public static final String PROVIDER_GOOGLE_DRIVE = "google_drive";

    private final UserIntegrationRepository integrationRepo;
    private final CoralRunner coralRunner;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public boolean isConnected(User user) {
        return findToken(user).isPresent();
    }

    public Optional<String> findToken(User user) {
        return integrationRepo.findByUserIdAndProvider(user.getId(), PROVIDER_GOOGLE_DRIVE)
                .map(UserIntegration::getAccessToken)
                .filter(token -> !token.isBlank());
    }

    public Map<String, String> driveEnv(String accessToken) {
        return Map.of("GOOGLE_DRIVE_ACCESS_TOKEN", accessToken);
    }

    @Transactional
    public ConnectResult connect(User user, String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return ConnectResult.failure("A Google Drive access token is required.");
        }

        String trimmed = accessToken.trim();
        Optional<String> formatError = detectTokenFormatIssue(trimmed);
        if (formatError.isPresent()) {
            return ConnectResult.failure(formatError.get());
        }

        Optional<String> validationError = validateToken(trimmed);
        if (validationError.isPresent()) {
            return ConnectResult.failure(validationError.get());
        }

        Map<String, String> env = driveEnv(trimmed);
        CoralRunner.CoralCommandResult addResult = coralRunner.addGoogleDriveSource(env);
        String coralNote = "";
        if (!coralLooksHealthy(addResult) && !alreadyConfigured(addResult.output())) {
            coralNote = " Coral setup warning: " + summarize(addResult.output());
        } else {
            CoralRunner.CoralCommandResult testResult = coralRunner.testGoogleDriveSource(env);
            if (!coralLooksHealthy(testResult)) {
                coralNote = " Coral setup warning: " + summarize(testResult.output());
            }
        }

        UserIntegration integration = integrationRepo.findByUserIdAndProvider(user.getId(), PROVIDER_GOOGLE_DRIVE)
                .orElse(UserIntegration.builder().user(user).provider(PROVIDER_GOOGLE_DRIVE).build());
        integration.setAccessToken(trimmed);
        integration.setConnectedAt(LocalDateTime.now());
        integrationRepo.save(integration);

        return ConnectResult.success(
                "Google Drive connected. Resume versions can now be imported from Drive." + coralNote
        );
    }

    @Transactional
    public void disconnect(User user) {
        integrationRepo.deleteByUserIdAndProvider(user.getId(), PROVIDER_GOOGLE_DRIVE);
        coralRunner.removeGoogleDriveSource();
    }

    private Optional<String> detectTokenFormatIssue(String token) {
        if (token.contains("apps.googleusercontent.com")) {
            return Optional.of(
                    "That looks like a Google Client ID, not an access token. Use Sign in with Google or paste an OAuth access token."
            );
        }
        if (token.startsWith("GOCSPX-") || token.length() < 30) {
            return Optional.of(
                    "That does not look like a Google access token. Use a token with drive.metadata.readonly scope."
            );
        }
        return Optional.empty();
    }

    private Optional<String> validateToken(String accessToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.googleapis.com/drive/v3/about?fields=user"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return Optional.empty();
            }
            if (response.statusCode() == 401 || response.statusCode() == 403) {
                return Optional.of(
                        "Google rejected this token. Generate a new access token with scope https://www.googleapis.com/auth/drive.metadata.readonly."
                );
            }
            return Optional.of("Could not verify Google Drive token (HTTP " + response.statusCode() + ").");
        } catch (Exception e) {
            return Optional.of("Could not reach Google Drive API to verify token: " + e.getMessage());
        }
    }

    private boolean coralLooksHealthy(CoralRunner.CoralCommandResult result) {
        if (result.success()) {
            return true;
        }
        String output = result.output() == null ? "" : result.output().toLowerCase(Locale.ROOT);
        return output.contains("connected successfully")
                || output.contains("added source google_drive")
                || output.contains("secrets: keychain");
    }

    private boolean alreadyConfigured(String output) {
        String lower = output == null ? "" : output.toLowerCase(Locale.ROOT);
        return lower.contains("already") || lower.contains("exists");
    }

    private String summarize(String output) {
        if (output == null || output.isBlank()) {
            return "No output from Coral.";
        }
        String trimmed = output.trim();
        return trimmed.length() > 400 ? trimmed.substring(0, 400) + "..." : trimmed;
    }

    public record ConnectResult(boolean connected, String message) {
        public static ConnectResult success(String message) {
            return new ConnectResult(true, message);
        }

        public static ConnectResult failure(String message) {
            return new ConnectResult(false, message);
        }
    }
}
