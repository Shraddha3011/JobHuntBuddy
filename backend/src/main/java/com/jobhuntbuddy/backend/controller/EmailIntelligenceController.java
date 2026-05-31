package com.jobhuntbuddy.backend.controller;

import com.jobhuntbuddy.backend.dto.GmailConnectRequest;
import com.jobhuntbuddy.backend.entity.JobApplication;
import com.jobhuntbuddy.backend.entity.Platform;
import com.jobhuntbuddy.backend.entity.Status;
import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.repository.JobApplicationRepository;
import com.jobhuntbuddy.backend.service.CoralRunner;
import com.jobhuntbuddy.backend.service.GmailConnectionService;
import com.jobhuntbuddy.backend.service.AsyncInferenceService;
import com.jobhuntbuddy.backend.service.CacheService;
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
    // SINGLE optimized query - searches 365 days with job keywords
    private static final String OPTIMIZED_CORAL_QUERY =
            "newer_than:365d";

    private final JobApplicationRepository appRepo;
    private final ObjectMapper objectMapper;
    private final GmailConnectionService gmailConnectionService;
    private final CoralRunner coralRunner;
    private final AsyncInferenceService asyncInferenceService;
    private final CacheService cacheService;
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
        cacheService.invalidate("gmail_" + user.getId()); // Clear cache on reconnect
        return ResponseEntity.ok(Map.of(
                "connected", result.connected(),
                "message", result.message()
        ));
    }

    @DeleteMapping("/connect")
    public ResponseEntity<Map<String, Object>> disconnect(@AuthenticationPrincipal User user) {
        gmailConnectionService.disconnect(user);
        cacheService.invalidate("gmail_" + user.getId());
        return ResponseEntity.ok(Map.of("connected", false, "message", "Gmail disconnected."));
    }

    @GetMapping("/preview")
    public ResponseEntity<Map<String, Object>> preview(@AuthenticationPrincipal User user,
                                                       @RequestParam(defaultValue = "25") int limit,
                                                       @RequestParam(defaultValue = "0") int offset) {
        System.out.println("PREVIEW API HIT");
        if (!gmailConnectionService.isConnected(user)) {
            return ResponseEntity.ok(notConnectedResponse());
        }

        String cacheKey = "gmail_" + user.getId() + "_" + offset + "_" + limit;
        Map<String, Object> cached = cacheService.get(cacheKey);
        if (cached != null) {
            return ResponseEntity.ok(cached);
        }

        // Fast path: return first 5 inferred with full content, rest queued for async inference
        EmailScan scan = scanGmailFast(user, limit, offset);

        if (!scan.available()) {
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "message", scan.error(),
                    "needsReconnect", scan.error().toLowerCase(Locale.ROOT).contains("401")
                            || scan.error().toLowerCase(Locale.ROOT).contains("403")
            ));
        }

        List<InferredApplication> inferred = scan.inferred();
        Map<String, Object> response = Map.of(
                "connected", true,
                "emailsScanned", scan.emails().size(),
                "emails", scan.emails(),
                "inferred", inferred,
                "overview", overview(inferred),
                "existingApplications", appRepo.findByUserId(user.getId()).size()
        );

        // Cache for 5 minutes
        cacheService.set(cacheKey, response, 300);

        // Queue remaining for background inference
        if (inferred.size() < scan.allEmails().size()) {
            asyncInferenceService.inferInBackground(user, scan.allEmails().subList(inferred.size(), Math.min(inferred.size() + 20, scan.allEmails().size())));
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> sync(@AuthenticationPrincipal User user,
                                                    @RequestParam(defaultValue = "25") int limit,
                                                    @RequestParam(defaultValue = "0") int offset) {
        System.out.println("SYNC API HIT");
        if (!gmailConnectionService.isConnected(user)) {
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "imported", 0,
                    "message", "Connect Gmail before importing.",
                    "needsReconnect", false
            ));
        }

        EmailScan scan = scanGmailFast(user, limit, offset);
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

        cacheService.invalidate("gmail_" + user.getId());

        return ResponseEntity.ok(Map.of(
                "connected", true,
                "imported", imported.size(),
                "emailsScanned", scan.emails().size(),
                "emails", scan.emails(),
                "inferred", scan.inferred(),
                "overview", overview(scan.inferred())
        ));
    }

    private EmailScan scanGmailFast(User user, int requestedLimit, int requestedOffset) {
        Optional<String> token = gmailConnectionService.findToken(user);
        if (token.isEmpty()) {
            return new EmailScan(false, "Gmail is not connected for this account.", List.of(), List.of());
        }

        int limit = requestedLimit;
        int offset = Math.max(0, requestedOffset);
        Map<String, String> env = gmailConnectionService.gmailEnv(token.get());
        List<RawEmail> emails =
                Collections.synchronizedList(new ArrayList<>());

        List<InferredApplication> inferred =
                Collections.synchronizedList(new ArrayList<>());

        List<Map<String, Object>> allRawMessages =
                Collections.synchronizedList(new ArrayList<>());

        try {
            // SINGLE query - much faster
            CoralRunner.CoralCommandResult idsResult = coralRunner.runSqlJson(
                    "SELECT id FROM gmail.search_messages(q => '" +
                            escapeSql(OPTIMIZED_CORAL_QUERY) +
                            "', max_results => 1000)",
                    env
            );

            if (!idsResult.success()) {
                System.out.println("CORAL FAILED - USING GMAIL API FALLBACK");
                System.out.println(idsResult.output());
                return scanGmailApiFast(token.get());
            }

            List<Map<String, Object>> rows = objectMapper.readValue(idsResult.output(), new TypeReference<>() {});
            System.out.println("=================================");
            System.out.println("TOTAL IDS FOUND = " + rows.size());
            System.out.println("REQUESTED LIMIT = " + requestedLimit);
            System.out.println("REQUESTED OFFSET = " + requestedOffset);
            System.out.println("=================================");
            Set<String> ids = new LinkedHashSet<>();
            for (Map<String, Object> row : rows) {
                String id = value(row.get("id"));
                if (!id.isBlank()) ids.add(id);
            }

            if (ids.isEmpty()) {
                return scanGmailApiFast(token.get());
            }
            System.out.println("TOTAL IDS FOUND = " + ids.size());
            System.out.println("OFFSET = " + offset);
            System.out.println("LIMIT = " + limit);

            List<String> batchIds = ids.stream()
                    .skip(offset)
                    .limit(limit)
                    .toList();

            System.out.println("BATCH IDS RETURNED = " + batchIds.size());
            System.out.println("BATCH IDS RETURNED = " + batchIds.size());

            // Fetch all messages in batch
            batchIds.parallelStream().forEach(id -> {
                try {
                    CoralRunner.CoralCommandResult messageResult = coralRunner.runSqlJson(
                            "SELECT id, snippet, \"internalDate\", payload FROM gmail.message(id => '" + escapeSql(id) + "')",
                            env
                    );
                    if (messageResult.success()) {
                        List<Map<String, Object>> messages = objectMapper.readValue(messageResult.output(), new TypeReference<>() {});
                        if (!messages.isEmpty()) {
                            Map<String, Object> message = messages.get(0);
                            allRawMessages.add(message);
                            Optional<InferredApplication> inferredApp = infer(message);
                            emails.add(rawEmail(message, inferredApp.isPresent()));
                            inferredApp.ifPresent(inferred::add);
                        }
                    }
                } catch (Exception ignored) {}
            });

            if (emails.isEmpty()) {
                return scanGmailApiFast(token.get());
            }

            List<InferredApplication> sorted = inferred.stream()
                    .sorted(Comparator.comparing(InferredApplication::date, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();

            return new EmailScan(true, null, sorted, emails, allRawMessages);
        } catch (Exception e) {
            return new EmailScan(false, "Coral error: " + e.getMessage(), List.of(), emails, allRawMessages);
        }
    }

    private EmailScan scanGmailApiFast(String accessToken) {
        try {
            List<String> messageIds = new ArrayList<>();
            List<InferredApplication> inferred = new ArrayList<>();
            List<RawEmail> emails = new ArrayList<>();
            List<Map<String, Object>> allRawMessages = new ArrayList<>();

            // Fetch first 50 messages only (fast)
            String listUrl =
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=newer_than:1y&maxResults=500";
            HttpResponse<String> listResponse = sendGmailGet(listUrl, accessToken);

            if (listResponse.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(listResponse.body());
                for (JsonNode messageRef : root.path("messages")) {
                    messageIds.add(messageRef.path("id").asText(""));
                }
            }

            // Fetch message details
            for (String id : messageIds) {
                try {
                    String messageUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + id + "?format=full";
                    HttpResponse<String> messageResponse = sendGmailGet(messageUrl, accessToken);
                    if (messageResponse.statusCode() == 200) {
                        JsonNode message = objectMapper.readTree(messageResponse.body());
                        Map<String, Object> row = new HashMap<>();
                        row.put("id", message.path("id").asText(""));
                        row.put("snippet", message.path("snippet").asText(""));
                        row.put("internalDate", message.path("internalDate").asText(""));
                        row.put("payload", message.path("payload").toString());

                        allRawMessages.add(row);
                        Optional<InferredApplication> inferredApp = infer(row);
                        emails.add(rawEmail(row, inferredApp.isPresent()));
                        inferredApp.ifPresent(inferred::add);
                    }
                } catch (Exception ignored) {}
            }

            List<InferredApplication> sorted = inferred.stream()
                    .sorted(Comparator.comparing(InferredApplication::date, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
            return new EmailScan(true, null, sorted, emails, allRawMessages);
        } catch (Exception e) {
            return new EmailScan(false, e.getMessage(), List.of(), List.of(), List.of());
        }
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

    private HttpResponse<String> sendGmailGet(String url, String accessToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private RawEmail rawEmail(Map<String, Object> message, boolean matchedJobEmail) {
        Object payload = message.get("payload");
        return new RawEmail(
                inferDate(message.get("internalDate")),
                header(payload, "Subject"),
                value(message.get("snippet"))
        );
    }

    private String emailContent(Object payload, String fallback) {
        try {
            JsonNode payloadNode = payload instanceof JsonNode node ? node : objectMapper.readTree(value(payload));
            List<String> parts = new ArrayList<>();
            collectBodyText(payloadNode, parts);
            String joined = String.join("\n", parts).replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
            return joined.isBlank() ? fallback : joined.substring(0, Math.min(500, joined.length()));
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
            } catch (IllegalArgumentException ignored) {}
        }
        for (JsonNode part : node.path("parts")) {
            collectBodyText(part, parts);
        }
    }

    private Optional<InferredApplication> infer(Map<String, Object> message) {
        String snippet = value(message.get("snippet"));
        Object payload = message.get("payload");
        String subject = header(payload, "Subject");
        String from = header(payload, "From");
        String joined = (subject + " " + snippet).trim();

        if (joined.isBlank()) {
            return Optional.empty();
        }

        if (isBlockedEmail(subject, from)) {
            return Optional.empty();
        }

        if (isRecommendationEmail(subject)) {
            return Optional.empty();
        }

        if (!looksLikeJobEmail(joined, from)) {
            return Optional.empty();
        }
        Status status = inferStatus(joined);
        String company = inferCompany(subject, from, snippet);
        String title = inferTitle(subject, snippet);
        Platform platform = joined.toLowerCase(Locale.ROOT).contains("linkedin") ? Platform.LINKEDIN : Platform.COMPANY_WEBSITE;
        LocalDate date = inferDate(message.get("internalDate"));
        return Optional.of(
                new InferredApplication(
                        company,
                        title,
                        status,
                        platform,
                        date,
                        subject,
                        from,
                        snippet,
                        emailContent(payload, snippet)
                )
        );
    }

    private boolean looksLikeJobEmail(String text, String from) {

        String lower = (text + " " + from).toLowerCase(Locale.ROOT);

        boolean recruiterDomain =
                containsAny(lower,
                        "greenhouse.io",
                        "lever.co",
                        "ashbyhq.com",
                        "myworkdayjobs",
                        "workday.com",
                        "smartrecruiters.com",
                        "icims.com",
                        "successfactors.com",
                        "talent",
                        "recruiting",
                        "careers");

        boolean positive =
                containsAny(lower,
                        "thank you for applying",
                        "application received",
                        "application submitted",
                        "your application",
                        "candidate",
                        "recruiter",
                        "interview invitation",
                        "interview scheduled",
                        "interview round",
                        "technical interview",
                        "assessment invitation",
                        "coding assessment",
                        "online assessment",
                        "offer letter",
                        "job offer",
                        "congratulations",
                        "not selected",
                        "rejection",
                        "unable to proceed",
                        "moving forward");

        boolean negative =
                containsAny(lower,
                        "weekly digest",
                        "daily digest",
                        "newsletter",
                        "recommended jobs",
                        "jobs you may be interested in",
                        "new jobs for you",
                        "job alert",
                        "similar jobs",
                        "linkedin news",
                        "career advice",
                        "learning course",
                        "webinar",
                        "event invitation",
                        "marketing",
                        "promotional",
                        "subscription",
                        "follow company",
                        "people viewed your profile",
                        "linkedin premium",
                        "apply now");

        return (positive || recruiterDomain) && !negative;
    }
    private boolean isRecommendationEmail(String subject) {

        String lower = subject.toLowerCase(Locale.ROOT);

        return containsAny(lower,
                "recommended jobs",
                "jobs you may be interested in",
                "job alert",
                "new jobs for you",
                "weekly jobs",
                "daily jobs",
                "similar jobs",
                "linkedin jobs",
                "career advice");
    }

    private Status inferStatus(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        if (containsAny(lower, "offer", "congratulations")) return Status.OFFER;
        if (containsAny(lower, "not selected", "unfortunately", "unable to proceed", "not moving forward", "we won't be moving forward")) return Status.REJECTED;
        if (containsAny(lower, "invitation","shortlisted")) return Status.OA;
        if (containsAny(lower, "new jobs similar to", "apply now to")) return Status.HIRING;
        if (containsAny(lower, "interview", "assessment", "coding challenge")) return Status.INTERVIEW;
        return Status.APPLIED;
    }

    private boolean isBlockedEmail(String subject, String from) {

        String lowerSubject = subject.toLowerCase(Locale.ROOT);
        String lowerFrom = from.toLowerCase(Locale.ROOT);

        return

                lowerSubject.contains("weekly digest")
                        || lowerSubject.contains("daily digest")
                        || lowerSubject.contains("newsletter")
                        || lowerSubject.contains("linkedin premium")
                        || lowerSubject.contains("career advice")
                        || lowerSubject.contains("people viewed your profile")
                        || lowerFrom.contains("marketing")
                        || lowerFrom.contains("newsletter")
                        || (lowerFrom.contains("leetcode.com")
                        && lowerSubject.contains("digest"));
    }

    private String inferCompany(String subject, String from, String snippet) {
        String text = subject + " " + snippet;
        List<Pattern> patterns = List.of(
                Pattern.compile("(?i)your application was sent to ([A-Z][A-Za-z0-9 .&-]{2,40})"),
                Pattern.compile("(?i)application was sent to ([A-Z][A-Za-z0-9 .&-]{2,40})"),
                Pattern.compile("(?i)thank you for applying to ([A-Z][A-Za-z0-9 .&-]{2,40})")
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
        return "Unknown";
    }

    private String inferTitle(String subject, String snippet) {
        String text = subject + " " + snippet;
        List<Pattern> patterns = List.of(
                Pattern.compile("(?i)(?:for|as)\\s+([A-Za-z0-9 /+-]{3,60}(?:engineer|developer|analyst|manager|designer))"),
                Pattern.compile("(?i)([A-Za-z0-9 /+-]{3,60}(?:engineer|developer))")
        );
        for (Pattern pattern : patterns) {
            var matcher = pattern.matcher(text);
            if (matcher.find()) return clean(matcher.group(1));
        }
        return "Job role";
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
        } catch (Exception ignored) {}
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

    private record EmailScan(boolean available, String error, List<InferredApplication> inferred, List<RawEmail> emails, List<Map<String, Object>> allEmails) {
        public EmailScan(boolean available, String error, List<InferredApplication> inferred, List<RawEmail> emails) {
            this(available, error, inferred, emails, new ArrayList<>());
        }
    }
    private record RawEmail(LocalDate date, String subject, String content) {}
    private record InferredApplication(String companyName, String jobTitle, Status status, Platform platform, LocalDate date,
                                       String subject, String from, String snippet, String content) {}
}