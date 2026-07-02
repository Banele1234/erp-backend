package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.entity.Production;
import com.aal.erp_backend.service.ProductionService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/production")
public class ProductionController {

    private final ProductionService productionService;

    public ProductionController(ProductionService productionService) {
        this.productionService = productionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Production>>> getProductions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID orderId) {
        try {
            Page<Production> productions = productionService.getProductions(page, limit, status, orderId);
            return ResponseEntity.ok(new ApiResponse<>(true, productions));
        } catch (Exception e) {
            ApiResponse<Page<Production>> error = new ApiResponse<>(false, null);
            error.setMessage(e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Production>> getProduction(@PathVariable UUID id) {
        try {
            Production production = productionService.getProductionById(id);
            return ResponseEntity.ok(new ApiResponse<>(true, production));
        } catch (Exception e) {
            ApiResponse<Production> error = new ApiResponse<>(false, null);
            error.setMessage(e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}