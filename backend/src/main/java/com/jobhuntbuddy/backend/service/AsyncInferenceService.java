package com.jobhuntbuddy.backend.service;

import com.jobhuntbuddy.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

/**
 * Queue background inference for emails not processed in fast path.
 * These are processed asynchronously so the API returns immediately.
 */
@Service
@RequiredArgsConstructor
public class AsyncInferenceService {

    private final CacheService cacheService;

    /**
     * Queue raw email messages for background inference.
     * This runs asynchronously so the API response is fast.
     * Results cached for next request.
     */
    @Async("taskExecutor")
    public void inferInBackground(User user, List<Map<String, Object>> rawEmails) {
        // Simulate inference on queued emails
        // In a real app, you'd run the infer() logic here and update cache
        try {
            Thread.sleep(100); // Simulate processing
            // Update cache with newly inferred applications
            String cacheKey = "gmail_" + user.getId() + "_background";
            cacheService.set(cacheKey, rawEmails.size() + " emails queued", 60);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Async configuration bean to enable @Async
     * Add to any config class:
     *
     * @Bean
     * public TaskExecutor taskExecutor() {
     *     ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
     *     executor.setCorePoolSize(2);
     *     executor.setMaxPoolSize(5);
     *     executor.setQueueCapacity(100);
     *     executor.initialize();
     *     return executor;
     * }
     */
}