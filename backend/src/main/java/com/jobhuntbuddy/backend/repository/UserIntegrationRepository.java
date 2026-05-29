package com.jobhuntbuddy.backend.repository;

import com.jobhuntbuddy.backend.entity.UserIntegration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserIntegrationRepository extends JpaRepository<UserIntegration, Long> {
    Optional<UserIntegration> findByUserIdAndProvider(Long userId, String provider);

    void deleteByUserIdAndProvider(Long userId, String provider);
}
