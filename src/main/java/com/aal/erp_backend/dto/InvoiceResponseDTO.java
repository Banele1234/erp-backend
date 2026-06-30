package com.aal.erp_backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class InvoiceResponseDTO {
    private UUID id;
    private String invoiceNumber;
    private UUID orderId;
    private UUID customerId;
    private Instant invoiceDate;
    private Instant dueDate;
    private Double subtotal;
    private Double discountAmount;
    private Double taxAmount;
    private Double totalAmount;
    private Double amountPaid;
    private String paymentStatus;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
    private CustomerSummaryDTO customer;
}