package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.entity.Invoice;
import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.service.InvoiceService;
import com.aal.erp_backend.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final UserService userService;

    public InvoiceController(InvoiceService invoiceService, UserService userService) {
        this.invoiceService = invoiceService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Invoice>>> getInvoices(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) UUID customerId,
            Authentication authentication) {

        try {
            String email = authentication.getName();
            User currentUser = userService.findByEmail(email);
            if (currentUser == null) {
                ApiResponse<Page<Invoice>> errorResponse = new ApiResponse<>(false, null);
                errorResponse.setMessage("User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole())
                    || "management".equalsIgnoreCase(currentUser.getRole());

            // If user is not admin, they can only see their own invoices
            if (!isAdmin) {
                customerId = null; // service will derive from userId
            }

            Page<Invoice> invoices = invoiceService.getInvoices(page, limit, paymentStatus, customerId, currentUser.getId(), isAdmin);
            return ResponseEntity.ok(new ApiResponse<>(true, invoices));

        } catch (Exception e) {
            e.printStackTrace();
            ApiResponse<Page<Invoice>> errorResponse = new ApiResponse<>(false, null);
            errorResponse.setMessage("Failed to fetch invoices: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}