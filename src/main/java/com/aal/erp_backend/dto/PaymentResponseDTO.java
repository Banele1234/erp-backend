package com.aal.erp_backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class PaymentResponseDTO {
    private UUID id;
    private String paymentNumber;
    private UUID invoiceId;
    private String invoiceNumber;   // ✅ field exists
    private UUID customerId;
    private Double amount;
    private Instant paymentDate;
    private String paymentMethod;
    private String referenceNumber;
    private String bankName;
    private String notes;
    private String status;
    private UUID receivedBy;
    private Instant createdAt;
    private CustomerSummaryDTO customer;
}