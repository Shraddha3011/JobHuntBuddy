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

    public CoralCommandResult removeGmailSource() {
        return run(List.of("source", "remove", "gmail"), null, 15);
    }

    public CoralCommandResult addGmailSource(Map<String, String> env) {
        Path sourcePath = resolveGmailSourcePath();
        if (!Files.isRegularFile(sourcePath)) {
            return new CoralCommandResult(
                    false,
                    "Gmail Coral source file not found at " + sourcePath.toAbsolutePath(),
                    -1
            );
        }
        // Refresh keychain secret so a new token replaces any stale one.
        removeGmailSource();
        return run(List.of("source", "add", "--file", sourcePath.toString()), env, 30);
    }

    public CoralCommandResult testGmailSource(Map<String, String> env) {
        return run(List.of("source", "test", "gmail"), env, 20);
    }

    public Path resolveGmailSourcePath() {
        Path cwd = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        List<Path> candidates = new ArrayList<>();
        if (gmailSourceFile != null && !gmailSourceFile.isBlank()) {
            candidates.add(Path.of(gmailSourceFile));
        }
        candidates.add(cwd.resolve("coral-sources").resolve("gmail.yaml"));
        candidates.add(cwd.resolve("..").resolve("coral-sources").resolve("gmail.yaml"));
        if (cwd.getParent() != null) {
            candidates.add(cwd.getParent().resolve("coral-sources").resolve("gmail.yaml"));
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
