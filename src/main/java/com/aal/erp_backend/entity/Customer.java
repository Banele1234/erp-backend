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
@Table(name = "customers")
public class Customer {

    @Id
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "customer_code")
    private String customerCode;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "contact_person")
    private String contactPerson;

    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pincode;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "customer_type")
    private String customerType;

    private String rating;

    @Column(name = "credit_limit")
    private Double creditLimit;

    @Column(name = "current_outstanding")
    private Double currentOutstanding;

    @Column(name = "total_purchases")
    private Double totalPurchases;

    @Column(name = "discount_percentage")
    private Double discountPercentage;

    private String country;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // No need to write getters/setters – Lombok generates them
}