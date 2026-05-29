package com.jobhuntbuddy.backend.controller;

import com.jobhuntbuddy.backend.dto.GmailConnectRequest;
import com.jobhuntbuddy.backend.entity.JobApplication;
import com.jobhuntbuddy.backend.entity.Platform;
import com.jobhuntbuddy.backend.entity.Status;
import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.repository.JobApplicationRepository;
import com.jobhuntbuddy.backend.service.CoralRunner;
import com.jobhuntbuddy.backend.service.GmailConnectionService;
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
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agent/email")
@RequiredArgsConstructor
public class EmailIntelligenceController {
    // Avoid double quotes inside the SQL string — Windows Coral CLI can split on them.
    private static final String JOB_EMAIL_QUERY =
            "newer_than:365d (application OR applied OR applying OR submitted OR sent OR received OR interview OR assessment OR unfortunately OR offer OR shortlisted OR rejected OR recruiter OR hiring OR career OR job OR linkedin)";
    private static final List<String> GMAIL_API_QUERIES = List.of(
            JOB_EMAIL_QUERY,
            "newer_than:365d (\"your application was sent\" OR \"application was sent to\" OR \"thank you again for applying\" OR \"thank you for applying\" OR \"thank you for your interest\" OR \"we received\" OR \"has been submitted\" OR \"application status\")",
            "newer_than:365d (\"not be moving forward\" OR \"not moving forward\" OR \"decided not to progress\" OR \"not selected\" OR \"unable to proceed\" OR \"next steps\" OR \"coding challenge\" OR \"online assessment\")",
            "newer_than:365d (\"new jobs similar to\" OR \"apply now to\" OR invitation)",
            "newer_than:365d (from:linkedin OR from:greenhouse OR from:lever OR from:workday OR from:ashby OR from:smartrecruiters OR from:successfactors)"
    );
    private static final List<String> CORAL_GMAIL_QUERIES = List.of(
            "in:anywhere newer_than:365d",
            "in:anywhere newer_than:365d (application OR applied OR submitted OR interview OR assessment OR unfortunately OR recruiter OR hiring OR job)",
            "in:anywhere newer_than:365d (\"your application was sent\" OR \"application was sent to\" OR \"thank you again for applying\" OR \"thank you for applying\")",
            "in:anywhere newer_than:365d (\"not be moving forward\" OR \"not moving forward\" OR \"decided not to progress\" OR \"unable to proceed\")",
            "in:anywhere newer_than:365d (\"new jobs similar to\" OR \"apply now to\" OR invitation)",
            "in:anywhere newer_than:365d from:linkedin"
    );

    private final JobApplicationRepository appRepo;
    private final ObjectMapper objectMapper;
    private final GmailConnectionService gmailConnectionService;
    private final CoralRunner coralRunner;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(@AuthenticationPrincipal User user) {
        boolean connected = gmailConnectionService.isConnected(user);
        return ResponseEntity.ok(Map.of(
                "connected", connected,
                "googleClientId", googleClientId == null ? "" : googleClientId,
                "oauthAvailable", googleClientId != null && !googleClientId.isBlank(),
                "scope", "https://www.googleapis.com/auth/gmail.readonly"
        ));
    }

    @PostMapping("/connect")
    public ResponseEntity<Map<String, Object>> connect(@AuthenticationPrincipal User user,
                                                       @RequestBody GmailConnectRequest body) {
        String accessToken = body == null ? "" : body.accessToken();
        GmailConnectionService.ConnectResult result = gmailConnectionService.connect(user, accessToken);
        return ResponseEntity.ok(Map.of(
                "connected", result.connected(),
                "message", result.message()
        ));
    }

    @DeleteMapping("/connect")
    public ResponseEntity<Map<String, Object>> disconnect(@AuthenticationPrincipal User user) {
        gmailConnectionService.disconnect(user);
        return ResponseEntity.ok(Map.of("connected", false, "message", "Gmail disconnected."));
    }

    @GetMapping("/preview")
    public ResponseEntity<Map<String, Object>> preview(@AuthenticationPrincipal User user,
                                                       @RequestParam(defaultValue = "25") int limit,
                                                       @RequestParam(defaultValue = "0") int offset) {
        if (!gmailConnectionService.isConnected(user)) {
            return ResponseEntity.ok(notConnectedResponse());
        }

        EmailScan scan = scanGmail(user, limit, offset);
        if (!scan.available()) {
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "message", scan.error(),
                    "needsReconnect", scan.error().toLowerCase(Locale.ROOT).contains("401")
                            || scan.error().toLowerCase(Locale.ROOT).contains("403")
            ));
        }
        List<InferredApplication> inferred = scan.inferred();
        return ResponseEntity.ok(Map.of(
                "connected", true,
                "emailsScanned", scan.emails().size(),
                "emails", scan.emails(),
                "inferred", inferred,
                "overview", overview(inferred),
                "existingApplications", appRepo.findByUserId(user.getId()).size()
        ));
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> sync(@AuthenticationPrincipal User user,
                                                    @RequestParam(defaultValue = "25") int limit,
                                                    @RequestParam(defaultValue = "0") int offset) {
        if (!gmailConnectionService.isConnected(user)) {
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "imported", 0,
                    "message", "Connect Gmail before importing.",
                    "needsReconnect", false
            ));
        }

        EmailScan scan = scanGmail(user, limit, offset);
        if (!scan.available()) {
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "imported", 0,
                    "message", scan.error(),
                    "needsReconnect", scan.error().toLowerCase(Locale.ROOT).contains("401")
                            || scan.error().toLowerCase(Locale.ROOT).contains("403")
            ));
        }

        List<JobApplication> existing = appRepo.findByUserId(user.getId());
        List<JobApplication> imported = new ArrayList<>();

        for (InferredApplication inferred : scan.inferred()) {
            boolean duplicate = existing.stream().anyMatch(app ->
                    same(app.getCompanyName(), inferred.companyName()) &&
                            same(app.getJobTitle(), inferred.jobTitle()) &&
                            Objects.equals(app.getAppliedDate(), inferred.date())
            );
            if (duplicate) continue;

            JobApplication app = JobApplication.builder()
                    .user(user)
                    .companyName(inferred.companyName())
                    .jobTitle(inferred.jobTitle())
                    .sourcePlatform(inferred.platform())
                    .status(inferred.status())
                    .appliedDate(inferred.date())
                    .notes("Auto-created from Gmail via Coral. Email subject: " + inferred.subject())
                    .jobDescription(inferred.snippet())
                    .build();
            imported.add(appRepo.save(app));
            existing.add(app);
        }

        return ResponseEntity.ok(Map.of(
                "connected", true,
                "imported", imported.size(),
                "emailsScanned", scan.emails().size(),
                "emails", scan.emails(),
                "inferred", scan.inferred(),
                "overview", overview(scan.inferred())
        ));
    }

    private Map<String, Object> notConnectedResponse() {
        return Map.of(
                "connected", false,
                "message", "Connect your Gmail account below to scan application emails.",
                "oauthAvailable", googleClientId != null && !googleClientId.isBlank(),
                "googleClientId", googleClientId == null ? "" : googleClientId,
                "scope", "https://www.googleapis.com/auth/gmail.readonly"
        );
    }

    private EmailScan scanGmail(User user, int requestedLimit, int requestedOffset) {
        Optional<String> token = gmailConnectionService.findToken(user);
        if (token.isEmpty()) {
            return new EmailScan(false, "Gmail is not connected for this account.", List.of(), List.of());
        }

        int limit = Math.max(1, Math.min(requestedLimit, 50));
        int offset = Math.max(0, requestedOffset);
        Map<String, String> env = gmailConnectionService.gmailEnv(token.get());
        List<RawEmail> emails = new ArrayList<>();
        List<InferredApplication> inferred = new ArrayList<>();
        try {
            Set<String> ids = new LinkedHashSet<>();
            String lastError = "";
            for (String query : CORAL_GMAIL_QUERIES) {
                CoralRunner.CoralCommandResult idsResult = coralRunner.runSqlJson(
                        "SELECT id FROM gmail.search_messages(q => '" + escapeSql(query) + "', max_results => 100)",
                        env
                );
                if (!idsResult.success()) {
                    lastError = idsResult.output();
                    continue;
                }
                List<Map<String, Object>> rows = objectMapper.readValue(idsResult.output(), new TypeReference<>() {});
                for (Map<String, Object> row : rows) {
                    String id = value(row.get("id"));
                    if (!id.isBlank()) ids.add(id);
                }
            }
            if (ids.isEmpty() && !lastError.isBlank()) {
                EmailScan apiScan = scanGmailApi(token.get());
                return apiScan.available() ? apiScan : new EmailScan(false, friendlyCoralError(lastError), List.of(), List.of());
            }
            if (ids.isEmpty()) {
                return scanGmailApi(token.get());
            }

            List<String> batchIds = ids.stream().skip(offset).limit(limit).toList();
            for (String id : batchIds) {
                CoralRunner.CoralCommandResult messageResult = coralRunner.runSqlJson(
                        "SELECT id, snippet, \"internalDate\", payload FROM gmail.message(id => '" + escapeSql(id) + "')",
                        env
                );
                if (!messageResult.success()) continue;
                List<Map<String, Object>> messages = objectMapper.readValue(messageResult.output(), new TypeReference<>() {});
                for (Map<String, Object> message : messages) {
                    Optional<InferredApplication> inferredApplication = infer(message);
                    emails.add(rawEmail(message, inferredApplication.isPresent()));
                    inferredApplication.ifPresent(inferred::add);
                }
            }
            if (!ids.isEmpty() && emails.isEmpty()) {
                return scanGmailApi(token.get());
            }
        } catch (Exception e) {
            return new EmailScan(false, "Could not parse Coral Gmail result: " + e.getMessage(), List.of(), emails);
        }

        List<InferredApplication> sorted = inferred.stream()
                .sorted(Comparator.comparing(InferredApplication::date, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        return new EmailScan(true, null, sorted, emails);
    }

    private EmailScan scanGmailApi(String accessToken) {
        try {
            Set<String> messageIds = new LinkedHashSet<>();
            String pageToken = "";
            while (messageIds.size() < 500) {
                String listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100"
                        + (pageToken.isBlank() ? "" : "&pageToken=" + URLEncoder.encode(pageToken, StandardCharsets.UTF_8));
                HttpResponse<String> listResponse = sendGmailGet(listUrl, accessToken);
                if (listResponse.statusCode() != 200) {
                    return new EmailScan(false, "Gmail API returned HTTP " + listResponse.statusCode() + ".", List.of(), List.of());
                }
                JsonNode root = objectMapper.readTree(listResponse.body());
                for (JsonNode messageRef : root.path("messages")) {
                    String id = messageRef.path("id").asText("");
                    if (!id.isBlank()) {
                        messageIds.add(id);
                    }
                }
                pageToken = root.path("nextPageToken").asText("");
                if (pageToken.isBlank()) {
                    break;
                }
            }

            for (String rawQuery : GMAIL_API_QUERIES) {
                String query = URLEncoder.encode(rawQuery, StandardCharsets.UTF_8);
                String listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=" + query + "&maxResults=100";
                HttpResponse<String> listResponse = sendGmailGet(listUrl, accessToken);
                if (listResponse.statusCode() != 200) {
                    if (listResponse.statusCode() == 401 || listResponse.statusCode() == 403) {
                        return new EmailScan(false, "Gmail API returned HTTP " + listResponse.statusCode() + ".", List.of(), List.of());
                    }
                    continue;
                }
                JsonNode messages = objectMapper.readTree(listResponse.body()).path("messages");
                for (JsonNode messageRef : messages) {
                    String id = messageRef.path("id").asText("");
                    if (!id.isBlank()) {
                        messageIds.add(id);
                    }
                }
            }

            List<InferredApplication> inferred = new ArrayList<>();
            List<RawEmail> emails = new ArrayList<>();
            for (String id : messageIds) {
                String messageUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + id + "?format=full";
                HttpResponse<String> messageResponse = sendGmailGet(messageUrl, accessToken);
                if (messageResponse.statusCode() != 200) continue;

                JsonNode message = objectMapper.readTree(messageResponse.body());
                Map<String, Object> row = new HashMap<>();
                row.put("id", message.path("id").asText(""));
                row.put("snippet", message.path("snippet").asText(""));
                row.put("internalDate", message.path("internalDate").asText(""));
                row.put("payload", message.path("payload").toString());
                Optional<InferredApplication> inferredApplication = infer(row);
                emails.add(rawEmail(row, inferredApplication.isPresent()));
                inferredApplication.ifPresent(inferred::add);
            }

            List<InferredApplication> sorted = inferred.stream()
                    .sorted(Comparator.comparing(InferredApplication::date, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
            return new EmailScan(true, null, sorted, emails);
        } catch (Exception e) {
            return new EmailScan(false, e.getMessage(), List.of(), List.of());
        }
    }

    private HttpResponse<String> sendGmailGet(String url, String accessToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private Optional<ParsedEmail> fetchGmailMetadata(String accessToken, String id) {
        try {
            String messageUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + id
                    + "?format=metadata&metadataHeaders=Subject&metadataHeaders=From";
            HttpResponse<String> messageResponse = sendGmailGet(messageUrl, accessToken);
            if (messageResponse.statusCode() != 200) return Optional.empty();

            JsonNode message = objectMapper.readTree(messageResponse.body());
            Map<String, Object> row = new HashMap<>();
            row.put("id", message.path("id").asText(""));
            row.put("snippet", message.path("snippet").asText(""));
            row.put("internalDate", message.path("internalDate").asText(""));
            row.put("payload", message.path("payload").toString());
            Optional<InferredApplication> inferredApplication = infer(row);
            return Optional.of(new ParsedEmail(rawEmail(row, inferredApplication.isPresent()), inferredApplication));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private RawEmail rawEmail(Map<String, Object> message, boolean matchedJobEmail) {
        Object payload = message.get("payload");
        return new RawEmail(
                inferDate(message.get("internalDate")),
                header(payload, "Subject"),
                emailContent(payload, value(message.get("snippet")))
        );
    }

    private String emailContent(Object payload, String fallback) {
        try {
            JsonNode payloadNode = payload instanceof JsonNode node ? node : objectMapper.readTree(value(payload));
            List<String> parts = new ArrayList<>();
            collectBodyText(payloadNode, parts);
            String joined = String.join("\n", parts).replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
            return joined.isBlank() ? fallback : joined;
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private void collectBodyText(JsonNode node, List<String> parts) {
        if (node == null || node.isMissingNode() || node.isNull()) return;
        String data = node.path("body").path("data").asText("");
        if (!data.isBlank()) {
            try {
                byte[] decoded = Base64.getUrlDecoder().decode(data);
                String text = new String(decoded, StandardCharsets.UTF_8).trim();
                if (!text.isBlank()) parts.add(text);
            } catch (IllegalArgumentException ignored) {
                // Some Gmail payloads omit body data or use nested parts only.
            }
        }
        for (JsonNode part : node.path("parts")) {
            collectBodyText(part, parts);
        }
    }

    private String friendlyCoralError(String output) {
        if (output == null || output.isBlank()) {
            return "Coral could not query Gmail. Try reconnecting your account.";
        }
        String trimmed = output.trim();
        if (trimmed.contains("unexpected argument 'you'")) {
            return "Coral command failed due to a shell quoting issue. Reconnect Gmail from this page and try again.";
        }
        if (trimmed.toLowerCase(Locale.ROOT).contains("not available on path")) {
            return "Coral CLI is not installed on the server. Install Coral and restart the backend.";
        }
        return trimmed.length() > 500 ? trimmed.substring(0, 500) + "..." : trimmed;
    }

    private Optional<InferredApplication> infer(Map<String, Object> message) {
        String snippet = value(message.get("snippet"));
        Object payload = message.get("payload");
        String subject = header(payload, "Subject");
        String from = header(payload, "From");
        String content = emailContent(payload, snippet);
        String joined = (subject + " " + snippet).trim();
        if (joined.isBlank()) return Optional.empty();
        if (isBlockedEmail(subject, from)) return Optional.empty();
        if (!looksLikeJobEmail(joined, from)) return Optional.empty();

        Status status = inferStatus(joined);
        String company = inferCompany(subject, from, snippet);
        String title = inferTitle(subject, snippet);
        Platform platform = joined.toLowerCase(Locale.ROOT).contains("linkedin") ? Platform.LINKEDIN : Platform.COMPANY_WEBSITE;
        LocalDate date = inferDate(message.get("internalDate"));

        return Optional.of(new InferredApplication(company, title, status, platform, date, subject, from, snippet, content));
    }

    private boolean looksLikeJobEmail(String text, String from) {
        String lower = (text + " " + from).toLowerCase(Locale.ROOT);
        return containsAny(lower,
                "application", "applied", "applying", "submitted", "sent", "thank you for your interest",
                "thank you for applying", "thank you again for applying", "your application was sent",
                "application was sent to", "we received", "interview", "assessment", "coding challenge",
                "recruiter", "hiring", "career", "job", "offer", "shortlisted", "not selected",
                "unfortunately", "unable to proceed", "not be moving forward", "not moving forward",
                "decided not to progress", "greenhouse", "lever", "workday", "ashby",
                "smartrecruiters", "successfactors", "linkedin", "new jobs similar to", "apply now to",
                "invitation");
    }

    private Status inferStatus(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        if (containsAny(lower, "offer", "congratulations")) return Status.OFFER;
        if (containsAny(lower,
                "not selected", "unfortunately", "regret", "unable to proceed",
                "moving forward with other candidates", "not be moving forward",
                "not moving forward", "decided not to progress", "not to progress",
                "will not be progressing")) return Status.REJECTED;
        if (containsAny(lower, "invitation")) return Status.OA;
        if (containsAny(lower, "new jobs similar to", "apply now to")) return Status.HIRING;
        if (containsAny(lower, "interview", "next step", "next steps", "assessment", "coding challenge", "online assessment")) return Status.INTERVIEW;
        return Status.APPLIED;
    }

    private boolean isBlockedEmail(String subject, String from) {
        String lowerSubject = subject.toLowerCase(Locale.ROOT);
        String lowerFrom = from.toLowerCase(Locale.ROOT);
        return lowerFrom.contains("no-reply@leetcode.com") && lowerSubject.contains("leetcode weekly digest");
    }

    private String inferCompany(String subject, String from, String snippet) {
        String text = subject + " " + snippet;
        List<Pattern> patterns = List.of(
                Pattern.compile("(?i)your application was sent to ([A-Z][A-Za-z0-9 .&-]{2,40})"),
                Pattern.compile("(?i)application was sent to ([A-Z][A-Za-z0-9 .&-]{2,40})"),
                Pattern.compile("(?i)your application (?:to|at|for) ([A-Z][A-Za-z0-9 .&-]{2,40})"),
                Pattern.compile("(?i)thank you for applying to ([A-Z][A-Za-z0-9 .&-]{2,40})"),
                Pattern.compile("(?i)application (?:received|submitted).*?([A-Z][A-Za-z0-9 .&-]{2,40})")
        );
        for (Pattern pattern : patterns) {
            var matcher = pattern.matcher(text);
            if (matcher.find()) return clean(matcher.group(1));
        }
        String emailDomain = from.replaceAll(".*@([^>\\s]+).*", "$1");
        if (emailDomain.contains(".")) {
            String domain = emailDomain.split("\\.")[0].replace("-", " ");
            if (!domain.equalsIgnoreCase("mail") && !domain.equalsIgnoreCase("linkedin")) return titleCase(domain);
        }
        return "Unknown company";
    }

    private String inferTitle(String subject, String snippet) {
        String text = subject + " " + snippet;
        List<Pattern> patterns = List.of(
                Pattern.compile("(?i)(?:for|as|role:)\\s+([A-Za-z0-9 /+-]{3,60}(?:engineer|developer|analyst|intern|manager|designer|consultant|scientist))"),
                Pattern.compile("(?i)([A-Za-z0-9 /+-]{3,60}(?:engineer|developer|analyst|intern|manager|designer|consultant|scientist))")
        );
        for (Pattern pattern : patterns) {
            var matcher = pattern.matcher(text);
            if (matcher.find()) return clean(matcher.group(1));
        }
        return "Role from email";
    }

    @SuppressWarnings("unchecked")
    private String header(Object payload, String name) {
        try {
            if (payload instanceof Map<?, ?> map) {
                Object headers = map.get("headers");
                if (headers instanceof List<?> list) {
                    for (Object item : list) {
                        if (item instanceof Map<?, ?> header) {
                            String headerName = value(header.get("name"));
                            if (name.equalsIgnoreCase(headerName)) {
                                return value(header.get("value"));
                            }
                        }
                    }
                }
            }
            JsonNode headers = payload instanceof JsonNode node
                    ? node.path("headers")
                    : objectMapper.readTree(value(payload)).path("headers");
            for (JsonNode header : headers) {
                if (name.equalsIgnoreCase(header.path("name").asText())) return header.path("value").asText("");
            }
        } catch (Exception ignored) {
            return "";
        }
        return "";
    }

    private LocalDate inferDate(Object internalDate) {
        String raw = value(internalDate);
        if (raw.isBlank()) return LocalDate.now();
        try {
            return OffsetDateTime.parse(raw).toLocalDate();
        } catch (Exception ignored) {
            try {
                return java.time.Instant.ofEpochMilli(Long.parseLong(raw)).atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            } catch (Exception ignoredAgain) {
                return LocalDate.now();
            }
        }
    }

    private Map<String, Object> overview(List<InferredApplication> inferred) {
        Map<LocalDate, Map<Status, Long>> byDay = inferred.stream()
                .collect(Collectors.groupingBy(InferredApplication::date, LinkedHashMap::new,
                        Collectors.groupingBy(InferredApplication::status, Collectors.counting())));
        Map<Status, Long> totals = inferred.stream().collect(Collectors.groupingBy(InferredApplication::status, Collectors.counting()));
        return Map.of("byDay", byDay, "totals", totals);
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) if (value.contains(term)) return true;
        return false;
    }

    private String clean(String value) {
        return value.replaceAll("[|\\-–—].*", "").replaceAll("\\s+", " ").trim();
    }

    private String titleCase(String value) {
        String[] parts = value.split("\\s+");
        List<String> titled = new ArrayList<>();
        for (String part : parts) {
            if (part.isBlank()) continue;
            titled.add(part.substring(0, 1).toUpperCase(Locale.ROOT) + part.substring(1).toLowerCase(Locale.ROOT));
        }
        return String.join(" ", titled);
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

    private record EmailScan(boolean available, String error, List<InferredApplication> inferred, List<RawEmail> emails) {}
    private record RawEmail(LocalDate date, String subject, String content) {}
    private record ParsedEmail(RawEmail rawEmail, Optional<InferredApplication> inferredApplication) {}
    private record InferredApplication(String companyName, String jobTitle, Status status, Platform platform, LocalDate date,
                                       String subject, String from, String snippet, String content) {}
}
