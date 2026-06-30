package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.dto.PaymentResponseDTO;
import com.aal.erp_backend.entity.Payment;
import com.aal.erp_backend.service.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<PaymentResponseDTO>>> getPayments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) UUID customer_id) {

        try {
            int pageZero = Math.max(0, page - 1);
            Pageable pageable = PageRequest.of(pageZero, limit, Sort.by("createdAt").descending());
            Page<PaymentResponseDTO> paymentPage = paymentService.getPaymentsDTO(customer_id, pageable);

            ApiResponse.PaginationInfo pagination = new ApiResponse.PaginationInfo(
                    page, limit, paymentPage.getTotalElements(), paymentPage.getTotalPages()
            );
            return ResponseEntity.ok(new ApiResponse<>(true, paymentPage, pagination));
        } catch (Exception e) {
            System.err.println("❌ Error in getPayments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ApiResponse<>(false, Page.empty(), new ApiResponse.PaginationInfo(page, limit, 0, 0)));
        }
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Payment>> createPayment(@RequestBody PaymentRequest request) {
        try {
            Payment payment = paymentService.createPayment(
                    request.getInvoiceId(),
                    request.getCustomerId(),
                    request.getAmount(),
                    request.getPaymentMethod(),
                    request.getReferenceNumber(),
                    request.getBankName(),
                    request.getNotes()
            );
            return ResponseEntity.ok(new ApiResponse<>(true, payment));
        } catch (Exception e) {
            System.err.println("❌ Error creating payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ApiResponse<>(false, null));
        }
    }

    // ---------- Inner DTO for payment creation ----------
    static class PaymentRequest {
        private UUID invoiceId;
        private UUID customerId;
        private Double amount;
        private String paymentMethod;
        private String referenceNumber;
        private String bankName;
        private String notes;

        // Getters and setters
        public UUID getInvoiceId() { return invoiceId; }
        public void setInvoiceId(UUID invoiceId) { this.invoiceId = invoiceId; }
        public UUID getCustomerId() { return customerId; }
        public void setCustomerId(UUID customerId) { this.customerId = customerId; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public String getBankName() { return bankName; }
        public void setBankName(String bankName) { this.bankName = bankName; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}