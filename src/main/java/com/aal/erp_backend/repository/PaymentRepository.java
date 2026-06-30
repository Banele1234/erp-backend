package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByCustomerId(UUID customerId);
    Page<Payment> findByCustomerId(UUID customerId, Pageable pageable);
}