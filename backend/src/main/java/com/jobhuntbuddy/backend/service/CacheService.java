package com.jobhuntbuddy.backend.service;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fast in-memory cache with TTL (5 minutes default).
 * For production, swap with Redis/Spring Cache.
 */
@Service
public class CacheService {
    private static class CacheEntry<T> {
        T value;
        long expiresAt;

        CacheEntry(T value, long ttlSeconds) {
            this.value = value;
            this.expiresAt = System.currentTimeMillis() + (ttlSeconds * 1000);
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    private final ConcurrentHashMap<String, CacheEntry<?>> cache = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        CacheEntry<?> entry = cache.get(key);
        if (entry == null) return null;
        if (entry.isExpired()) {
            cache.remove(key);
            return null;
        }
        return (T) entry.value;
    }

    public <T> void set(String key, T value, long ttlSeconds) {
        cache.put(key, new CacheEntry<>(value, ttlSeconds));
    }

    public void invalidate(String keyPrefix) {
        cache.keySet().removeIf(key -> key.startsWith(keyPrefix));
    }

    public void clear() {
        cache.clear();
    }

    // Cleanup expired entries every 60 seconds
    public void cleanupExpired() {
        cache.entrySet().removeIf(e -> e.getValue().isExpired());
    }
}