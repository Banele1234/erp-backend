package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    void deleteByOrderId(UUID orderId);
    int countByOrderId(UUID orderId);
    List<OrderItem> findByOrderId(UUID orderId);
}