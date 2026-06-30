package com.aal.erp_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rejections")
@Data
public class Rejection {
    @Id
    private UUID id;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    private Integer quantity;
    private String reason;

    @Column(name = "rejection_date")
    private Instant rejectionDate;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @ManyToOne
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "warehouse_id", insertable = false, updatable = false)
    private Warehouse warehouse;
}