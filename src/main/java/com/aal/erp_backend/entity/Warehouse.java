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
@Table(name = "warehouses")
public class Warehouse {

    @Id
    private UUID id;

    @Column(name = "warehouse_code", unique = true)
    private String warehouseCode;

    private String name;
    private String location;
    private String address;
    private String city;
    private String state;
    private String phone;

    @Column(name = "manager_name")
    private String managerName;

    @Column(name = "capacity_units")
    private Integer capacityUnits;

    @Column(name = "current_utilization")
    private Integer currentUtilization;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}