package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdAndIsReadFalse(UUID userId);
    Page<Notification> findByUserIdAndIsReadFalse(UUID userId, Pageable pageable);   // ✅
    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable); // ✅
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndIsReadFalse(UUID userId);
}