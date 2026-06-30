package com.aal.erp_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory")
@Data
public class Inventory {
    @Id
    private UUID id;
    @Column(name = "product_id")
    private UUID productId;
    @Column(name = "warehouse_id")
    private UUID warehouseId;
    private Integer quantity;
    @Column(name = "reserved_quantity")
    private Integer reservedQuantity;
    @Column(name = "available_quantity")
    private Integer availableQuantity;
    @Column(name = "last_updated")
    private Instant lastUpdated;
    @Column(name = "created_at")
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "warehouse_id", insertable = false, updatable = false)
    private Warehouse warehouse;
}