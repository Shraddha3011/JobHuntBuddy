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
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GmailConnectionService {
    public static final String PROVIDER_GMAIL = "gmail";

    private final UserIntegrationRepository integrationRepo;
    private final CoralRunner coralRunner;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public boolean isConnected(User user) {
        return findToken(user).isPresent();
    }

    public Optional<String> findToken(User user) {
        return integrationRepo.findByUserIdAndProvider(user.getId(), PROVIDER_GMAIL)
                .map(UserIntegration::getAccessToken)
                .filter(token -> !token.isBlank());
    }

    public Map<String, String> gmailEnv(String accessToken) {
        return Map.of("GMAIL_ACCESS_TOKEN", accessToken);
    }

    @Transactional
    public ConnectResult connect(User user, String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return ConnectResult.failure("A Gmail access token is required.");
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

        Map<String, String> env = gmailEnv(trimmed);
        CoralRunner.CoralCommandResult addResult = coralRunner.addGmailSource(env);
        String coralNote = "";
        if (!coralLooksHealthy(addResult) && !alreadyConfigured(addResult.output())) {
            coralNote = " Coral setup warning: " + summarize(addResult.output());
        } else {
            CoralRunner.CoralCommandResult testResult = coralRunner.testGmailSource(env);
            if (!coralLooksHealthy(testResult)) {
                coralNote = " Coral setup warning: " + summarize(testResult.output());
            }
        }

        UserIntegration integration = integrationRepo.findByUserIdAndProvider(user.getId(), PROVIDER_GMAIL)
                .orElse(UserIntegration.builder().user(user).provider(PROVIDER_GMAIL).build());
        integration.setAccessToken(trimmed);
        integrationRepo.save(integration);

        return ConnectResult.success(
                "Gmail connected successfully. You can preview and import applications now." + coralNote
        );
    }

    @Transactional
    public void disconnect(User user) {
        integrationRepo.deleteByUserIdAndProvider(user.getId(), PROVIDER_GMAIL);
    }

    private Optional<String> detectTokenFormatIssue(String token) {
        if (token.contains("apps.googleusercontent.com")) {
            return Optional.of(
                    "That looks like a Google Client ID, not an access token. "
                            + "Paste the access token from OAuth Playground (starts with ya29.) or use Sign in with Google."
            );
        }
        if (token.startsWith("GOCSPX-") || token.length() < 30) {
            return Optional.of(
                    "That does not look like a Gmail access token. "
                            + "Use an OAuth access token with gmail.readonly scope (usually starts with ya29.)."
            );
        }
        return Optional.empty();
    }

    private Optional<String> validateToken(String accessToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://gmail.googleapis.com/gmail/v1/users/me/profile"))
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
                        "Google rejected this token. Generate a new access token with scope "
                                + "https://www.googleapis.com/auth/gmail.readonly (OAuth Playground or Sign in with Google)."
                );
            }
            return Optional.of("Could not verify Gmail token (HTTP " + response.statusCode() + ").");
        } catch (Exception e) {
            return Optional.of("Could not reach Gmail API to verify token: " + e.getMessage());
        }
    }

    private boolean coralLooksHealthy(CoralRunner.CoralCommandResult result) {
        if (result.success()) {
            return true;
        }
        String output = result.output() == null ? "" : result.output().toLowerCase(Locale.ROOT);
        return output.contains("connected successfully")
                || output.contains("added source gmail")
                || output.contains("secrets: keychain");
    }

    private boolean alreadyConfigured(String output) {
        String lower = output.toLowerCase(Locale.ROOT);
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
