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
@Table(name = "payments")
public class Payment {

    @Id
    private UUID id;

    @Column(name = "payment_number")
    private String paymentNumber;

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "customer_id")
    private UUID customerId;

    private Double amount;

    @Column(name = "payment_date")
    private Instant paymentDate;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "bank_name")
    private String bankName;

    private String notes;
    private String status;

    @Column(name = "received_by")
    private UUID receivedBy;

    @Column(name = "created_at")
    private Instant createdAt;

    // Relationships
    @ManyToOne
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "invoice_id", insertable = false, updatable = false)
    private Invoice invoice;
}