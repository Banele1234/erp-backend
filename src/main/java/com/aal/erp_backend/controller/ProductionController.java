package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.dto.StatusUpdateRequest;   // ✅ Added import
import com.aal.erp_backend.entity.Production;
import com.aal.erp_backend.service.ProductionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/production")
public class ProductionController {

    private final ProductionService productionService;

    public ProductionController(ProductionService productionService) {
        this.productionService = productionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Production>>> getProduction() {
        List<Production> productions = productionService.getAllProduction();
        return ResponseEntity.ok(new ApiResponse<>(true, productions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Production>> getProductionById(@PathVariable UUID id) {
        Production production = productionService.getProductionById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, production));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Production>> createProduction(@RequestBody ProductionRequest request) {
        Production created = productionService.createProduction(
                request.getProductId(),
                request.getQuantityProduced(),
                request.getRawMaterialCost(),
                request.getLaborCost(),
                request.getStatus()
        );
        return ResponseEntity.ok(new ApiResponse<>(true, created));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Production>> updateProductionStatus(@PathVariable UUID id, @RequestBody StatusUpdateRequest request) {
        Production updated = productionService.updateProductionStatus(id, request.getStatus());
        return ResponseEntity.ok(new ApiResponse<>(true, updated));
    }
}

class ProductionRequest {
    private UUID productId;
    private Integer quantityProduced;
    private Double rawMaterialCost;
    private Double laborCost;
    private String status;
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public Integer getQuantityProduced() { return quantityProduced; }
    public void setQuantityProduced(Integer quantityProduced) { this.quantityProduced = quantityProduced; }
    public Double getRawMaterialCost() { return rawMaterialCost; }
    public void setRawMaterialCost(Double rawMaterialCost) { this.rawMaterialCost = rawMaterialCost; }
    public Double getLaborCost() { return laborCost; }
    public void setLaborCost(Double laborCost) { this.laborCost = laborCost; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}