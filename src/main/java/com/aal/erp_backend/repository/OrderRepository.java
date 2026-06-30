package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByCustomerId(UUID customerId);
    List<Order> findAllByOrderByCreatedAtDesc();
    Page<Order> findByCustomerId(UUID customerId, Pageable pageable);
    Page<Order> findByStatus(String status, Pageable pageable);
}