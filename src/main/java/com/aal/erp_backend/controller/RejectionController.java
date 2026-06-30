package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.entity.Rejection;
import com.aal.erp_backend.service.RejectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rejections")
public class RejectionController {

    private final RejectionService rejectionService;

    public RejectionController(RejectionService rejectionService) {
        this.rejectionService = rejectionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Rejection>>> getRejections() {
        List<Rejection> rejections = rejectionService.getAllRejections();
        return ResponseEntity.ok(new ApiResponse<>(true, rejections));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Rejection>> getRejection(@PathVariable UUID id) {
        Rejection rejection = rejectionService.getRejectionById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, rejection));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Rejection>> createRejection(@RequestBody RejectionRequest request) {
        Rejection created = rejectionService.createRejection(
                request.getProductId(),
                request.getWarehouseId(),
                request.getQuantity(),
                request.getReason(),
                request.getCreatedBy()
        );
        return ResponseEntity.ok(new ApiResponse<>(true, created));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRejection(@PathVariable UUID id) {
        rejectionService.deleteRejection(id);
        return ResponseEntity.ok(new ApiResponse<>(true, null));
    }
}

class RejectionRequest {
    private UUID productId;
    private UUID warehouseId;
    private Integer quantity;
    private String reason;
    private UUID createdBy;
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public UUID getWarehouseId() { return warehouseId; }
    public void setWarehouseId(UUID warehouseId) { this.warehouseId = warehouseId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
}