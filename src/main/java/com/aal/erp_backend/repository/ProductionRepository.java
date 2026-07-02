package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Production;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductionRepository extends JpaRepository<Production, UUID> {
    List<Production> findByOrderId(UUID orderId);
    boolean existsByOrderId(UUID orderId);
    Page<Production> findByOrderId(UUID orderId, Pageable pageable); // ✅ added for pagination
}