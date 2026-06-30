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

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "quantity_produced")
    private Integer quantityProduced;

    @Column(name = "production_date")
    private Instant productionDate;

    @Column(name = "raw_material_cost")
    private Double rawMaterialCost;

    @Column(name = "labor_cost")
    private Double laborCost;

    private String status; // planned, in_progress, completed, cancelled

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt; // added for consistency

    @ManyToOne
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
}