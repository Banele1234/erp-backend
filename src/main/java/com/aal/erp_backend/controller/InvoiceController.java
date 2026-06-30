package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.dto.InvoiceResponseDTO;
import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.repository.CustomerRepository;
import com.aal.erp_backend.repository.UserRepository;
import com.aal.erp_backend.service.InvoiceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public InvoiceController(InvoiceService invoiceService,
                             UserRepository userRepository,
                             CustomerRepository customerRepository) {
        this.invoiceService = invoiceService;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<InvoiceResponseDTO>>> getInvoices(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String payment_status,
            @RequestParam(required = false) UUID customer_id) {

        System.out.println("📥 InvoiceController: user=" + (userDetails != null ? userDetails.getUsername() : "null"));
        System.out.println("📥 payment_status=" + payment_status + ", customer_id=" + customer_id);

        // Sanitize
        if (payment_status != null && ("undefined".equalsIgnoreCase(payment_status) || payment_status.isEmpty())) {
            payment_status = null;
        }

        UUID effectiveCustomerId = customer_id;

        if (userDetails != null) {
            try {
                User user = userRepository.findByEmail(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                if ("customer".equalsIgnoreCase(user.getRole())) {
                    Customer customer = customerRepository.findByUserId(user.getId())
                            .orElseThrow(() -> new RuntimeException("Customer not found for user"));
                    effectiveCustomerId = customer.getId();
                    System.out.println("📥 Customer user: using customerId=" + effectiveCustomerId);
                } else {
                    System.out.println("📥 Admin user: fetching all invoices");
                    effectiveCustomerId = null;
                }
            } catch (Exception e) {
                System.err.println("❌ Error resolving user: " + e.getMessage());
                e.printStackTrace();
                // fallback: keep effectiveCustomerId as given
            }
        }

        try {
            int pageZero = Math.max(0, page - 1);
            Pageable pageable = PageRequest.of(pageZero, limit, Sort.by("createdAt").descending());
            Page<InvoiceResponseDTO> invoicePage = invoiceService.getInvoicesDTO(effectiveCustomerId, payment_status, pageable);

            ApiResponse.PaginationInfo pagination = new ApiResponse.PaginationInfo(
                    page, limit, invoicePage.getTotalElements(), invoicePage.getTotalPages()
            );
            return ResponseEntity.ok(new ApiResponse<>(true, invoicePage, pagination));
        } catch (Exception e) {
            System.err.println("❌ ERROR in InvoiceController.getInvoices: " + e.getMessage());
            e.printStackTrace();
            // Always return 200 with an empty page and success=false
            return ResponseEntity.ok(new ApiResponse<>(false, Page.empty(), new ApiResponse.PaginationInfo(page, limit, 0, 0)));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<InvoiceResponseDTO>> getInvoice(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, invoiceService.getInvoiceDTO(id)));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, null));
        }
    }

    @PatchMapping("/{id}/pay")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<InvoiceResponseDTO>> payInvoice(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, invoiceService.payInvoiceAndReturnDTO(id)));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, null));
        }
    }
}