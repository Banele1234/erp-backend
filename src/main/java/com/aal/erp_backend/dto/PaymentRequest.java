package com.aal.erp_backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class PaymentRequest {
    private UUID invoiceId;
    private UUID customerId;
    private Double amount;
    private String paymentMethod;
    private String referenceNumber;
    private String bankName;
    private String notes;
}