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
@Table(name = "products")
public class Product {

    @Id
    private UUID id;

    @Column(name = "product_code", unique = true)
    private String productCode;

    private String name;
    private String description;
    private String category;
    private String unit;

    @Column(name = "unit_price")
    private Double unitPrice;

    @Column(name = "cost_price")
    private Double costPrice;

    @Column(name = "gst_percentage")
    private Double gstPercentage;

    @Column(name = "reorder_level")
    private Integer reorderLevel;

    private Integer eoq;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}