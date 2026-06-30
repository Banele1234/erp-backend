package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Production;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

// ✅ Change the interface name from PaymentRepository to ProductionRepository
public interface ProductionRepository extends JpaRepository<Production, UUID> {
}