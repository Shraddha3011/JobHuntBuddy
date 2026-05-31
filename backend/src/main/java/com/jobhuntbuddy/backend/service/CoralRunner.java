package com.jobhuntbuddy.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class CoralRunner {
    @Value("${coral.gmail.source.file:}")
    private String gmailSourceFile;

    @Value("${coral.google-drive.source.file:}")
    private String googleDriveSourceFile;

    @Value("${coral.jobhuntbuddy.source.file:}")
    private String jobHuntBuddySourceFile;

    public CoralCommandResult run(List<String> args, Map<String, String> env, long timeoutSeconds) {
        try {
            List<String> command = new ArrayList<>();
            command.add("coral");
            command.addAll(args);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            if (env != null && !env.isEmpty()) {
                pb.environment().putAll(env);
            }

            Process proc = pb.start();
            boolean finished = proc.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            String output = new String(proc.getInputStream().readAllBytes());
            if (!finished) {
                proc.destroyForcibly();
                return new CoralCommandResult(false, "Coral command timed out.", -1);
            }
            return new CoralCommandResult(proc.exitValue() == 0, output, proc.exitValue());
        } catch (IOException e) {
            return new CoralCommandResult(false, "Coral CLI is not available on PATH.", -1);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new CoralCommandResult(false, "Coral command was interrupted.", -1);
        }
    }

    public CoralCommandResult runSqlJson(String sql, Map<String, String> env) {
        CoralCommandResult result = run(List.of("sql", "--format", "json", sql), env, 20);
        boolean jsonArray = result.success() && result.output().trim().startsWith("[");
        return new CoralCommandResult(jsonArray, result.output(), result.exitCode());
    }

    public CoralCommandResult runSqlTable(String sql, Map<String, String> env) {
        return run(List.of("sql", "--format", "table", sql), env, 20);
    }

    public CoralCommandResult version() {
        return run(List.of("--version"), null, 8);
    }

    public CoralCommandResult listSources() {
        return run(List.of("source", "list"), null, 10);
    }

    public CoralCommandResult discoverSources() {
        return run(List.of("source", "discover"), null, 12);
    }

    public CoralCommandResult sourceInfo(String name) {
        return run(List.of("source", "info", name), null, 10);
    }

    public CoralCommandResult removeGmailSource() {
        return removeSource("gmail");
    }

    public CoralCommandResult addGmailSource(Map<String, String> env) {
        return addSource("gmail", resolveGmailSourcePath(), env);
    }

    public CoralCommandResult testGmailSource(Map<String, String> env) {
        return testSource("gmail", env);
    }

    public CoralCommandResult removeGoogleDriveSource() {
        return removeSource("google_drive");
    }

    public CoralCommandResult addGoogleDriveSource(Map<String, String> env) {
        return addSource("google_drive", resolveGoogleDriveSourcePath(), env);
    }

    public CoralCommandResult testGoogleDriveSource(Map<String, String> env) {
        return testSource("google_drive", env);
    }

    public CoralCommandResult removeJobHuntBuddySource() {
        return removeSource("jobhuntbuddy");
    }

    public CoralCommandResult addJobHuntBuddySource(Map<String, String> env) {
        return addSource("jobhuntbuddy", resolveJobHuntBuddySourcePath(), env);
    }

    public CoralCommandResult testJobHuntBuddySource(Map<String, String> env) {
        return testSource("jobhuntbuddy", env);
    }

    private CoralCommandResult removeSource(String name) {
        return run(List.of("source", "remove", name), null, 15);
    }

    private CoralCommandResult addSource(String name, Path sourcePath, Map<String, String> env) {
        if (!Files.isRegularFile(sourcePath)) {
            return new CoralCommandResult(
                    false,
                    name + " Coral source file not found at " + sourcePath.toAbsolutePath(),
                    -1
            );
        }
        // Refresh keychain secret so a new token replaces any stale one.
        removeSource(name);
        return run(List.of("source", "add", "--file", sourcePath.toString()), env, 30);
    }

    private CoralCommandResult testSource(String name, Map<String, String> env) {
        return run(List.of("source", "test", name), env, 20);
    }

    public Path resolveGmailSourcePath() {
        return resolveSourcePath(gmailSourceFile, "gmail.yaml");
    }

    public Path resolveGoogleDriveSourcePath() {
        return resolveSourcePath(googleDriveSourceFile, "google_drive.yaml");
    }

    public Path resolveJobHuntBuddySourcePath() {
        return resolveSourcePath(jobHuntBuddySourceFile, "jobhuntbuddy.yaml");
    }

    private Path resolveSourcePath(String configuredPath, String fileName) {
        Path cwd = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        List<Path> candidates = new ArrayList<>();
        if (configuredPath != null && !configuredPath.isBlank()) {
            candidates.add(Path.of(configuredPath));
        }
        candidates.add(cwd.resolve("coral-sources").resolve(fileName));
        candidates.add(cwd.resolve("..").resolve("coral-sources").resolve(fileName));
        if (cwd.getParent() != null) {
            candidates.add(cwd.getParent().resolve("coral-sources").resolve(fileName));
        }
        for (Path candidate : candidates) {
            Path resolved = candidate.toAbsolutePath().normalize();
            if (Files.isRegularFile(resolved)) {
                return resolved;
            }
        }
        return candidates.get(0).toAbsolutePath().normalize();
    }

    public record CoralCommandResult(boolean success, String output, int exitCode) {}
}
