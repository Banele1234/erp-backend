package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Page<Invoice> findByCustomerId(UUID customerId, Pageable pageable);
    Page<Invoice> findByPaymentStatus(String paymentStatus, Pageable pageable);
    Page<Invoice> findByCustomerIdAndPaymentStatus(UUID customerId, String paymentStatus, Pageable pageable);
    List<Invoice> findByCustomerId(UUID customerId); // ✅ added for DashboardService
}