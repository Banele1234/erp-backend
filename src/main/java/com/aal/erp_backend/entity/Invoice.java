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
@Table(name = "invoices")
public class Invoice {

    @Id
    private UUID id;

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "invoice_date")
    private Instant invoiceDate;

    @Column(name = "due_date")
    private Instant dueDate;

    private Double subtotal;

    @Column(name = "discount_amount")
    private Double discountAmount;

    @Column(name = "tax_amount")
    private Double taxAmount;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "amount_paid")
    private Double amountPaid;

    @Column(name = "payment_status")
    private String paymentStatus;

    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}