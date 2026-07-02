package com.aal.erp_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "production")
public class Production {

    @Id
    private UUID id;

    @Column(name = "batch_number", nullable = false, unique = true)
    private String batchNumber;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "planned_quantity")
    private Integer plannedQuantity;

    @Column(name = "produced_quantity")
    private Integer producedQuantity;      // ✅ Already exists, but ProductionService uses "quantityProduced"

    // ---- Additional fields for ProductionService ----
    @Column(name = "quantity_produced")
    private Integer quantityProduced;      // Added to match the service

    @Column(name = "production_date")
    private Instant productionDate;        // Added to match the service

    @Column(name = "raw_material_cost")
    private Double rawMaterialCost;        // Added to match the service

    @Column(name = "labor_cost")
    private Double laborCost;              // Added to match the service

    @Column(name = "rejected_quantity")
    private Integer rejectedQuantity;

    private String status; // planned, in_progress, completed, on_hold

    private String factory;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "created_at")
    private Instant createdAt;
}