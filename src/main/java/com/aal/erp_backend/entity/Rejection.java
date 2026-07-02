package com.aal.erp_backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rejections")
public class Rejection {

    @Id
    private UUID id;

    @Column(name = "rejection_number", unique = true)
    private String rejectionNumber;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "order_id")
    private UUID orderId;

    private Integer quantity;

    private String reason;

    @Column(name = "rejection_date")
    private Instant rejectionDate;

    @Column(name = "credit_issued")
    private Double creditIssued;

    private String status; // pending, in_review, resolved

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getRejectionNumber() { return rejectionNumber; }
    public void setRejectionNumber(String rejectionNumber) { this.rejectionNumber = rejectionNumber; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }

    public UUID getWarehouseId() { return warehouseId; }
    public void setWarehouseId(UUID warehouseId) { this.warehouseId = warehouseId; }

    public UUID getOrderId() { return orderId; }
    public void setOrderId(UUID orderId) { this.orderId = orderId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Instant getRejectionDate() { return rejectionDate; }
    public void setRejectionDate(Instant rejectionDate) { this.rejectionDate = rejectionDate; }

    public Double getCreditIssued() { return creditIssued; }
    public void setCreditIssued(Double creditIssued) { this.creditIssued = creditIssued; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}