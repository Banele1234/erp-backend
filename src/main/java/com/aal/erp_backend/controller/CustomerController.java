package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.dto.CustomerCreateRequest;
import com.aal.erp_backend.dto.RatingUpdateRequest;
import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.entity.Order;
import com.aal.erp_backend.service.CustomerService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // ========== GET /customers ==========
    @GetMapping
    public ResponseEntity<ApiResponse<List<Customer>>> getCustomers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String rating) {

        Page<Customer> customerPage = customerService.getCustomers(page, limit, search, type, rating);
        ApiResponse.PaginationInfo pagination = new ApiResponse.PaginationInfo(
                page, limit, customerPage.getTotalElements(), customerPage.getTotalPages()
        );
        ApiResponse<List<Customer>> response = new ApiResponse<>(
                true, customerPage.getContent(), pagination
        );
        return ResponseEntity.ok(response);
    }

    // ========== GET /customers/{id} ==========
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getCustomer(@PathVariable UUID id) {
        Customer customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, customer));
    }

    // ========== POST /customers ==========
    @PostMapping
    public ResponseEntity<ApiResponse<Customer>> createCustomer(@RequestBody CustomerCreateRequest request) {
        Customer created = customerService.createCustomer(
                request.getEmail(),
                request.getCompanyName(),
                request.getContactPerson(),
                request.getPhone(),
                request.getAddress(),
                request.getCity(),
                request.getCustomerType(),
                request.getCreditLimit()
        );
        return ResponseEntity.ok(new ApiResponse<>(true, created));
    }

    // ========== PUT /customers/{id} ==========
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> updateCustomer(
            @PathVariable UUID id,
            @RequestBody Customer customer) {
        Customer updated = customerService.updateCustomer(id, customer);
        return ResponseEntity.ok(new ApiResponse<>(true, updated));
    }

    // ========== DELETE /customers/{id} ==========
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(new ApiResponse<>(true, null));
    }

    // ========== GET /customers/{id}/orders ==========
    @GetMapping("/{id}/orders")
    public ResponseEntity<ApiResponse<List<Order>>> getCustomerOrders(@PathVariable UUID id) {
        List<Order> orders = customerService.getCustomerOrders(id);
        return ResponseEntity.ok(new ApiResponse<>(true, orders));
    }

    // ========== PUT /customers/{id}/rating ==========
    @PutMapping("/{id}/rating")
    public ResponseEntity<ApiResponse<Customer>> updateRating(
            @PathVariable UUID id,
            @RequestBody RatingUpdateRequest request) {
        Customer updated = customerService.updateRating(id, request.getRating());
        return ResponseEntity.ok(new ApiResponse<>(true, updated));
    }
}