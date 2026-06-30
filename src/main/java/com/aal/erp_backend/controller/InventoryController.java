package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.entity.Inventory;
import com.aal.erp_backend.service.InventoryService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Inventory>>> getInventory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) UUID warehouse_id,
            @RequestParam(required = false) Boolean low_stock) {

        Page<Inventory> inventoryPage = inventoryService.getInventory(page, limit, warehouse_id, low_stock);
        ApiResponse.PaginationInfo pagination = new ApiResponse.PaginationInfo(
                page, limit, inventoryPage.getTotalElements(), inventoryPage.getTotalPages()
        );
        ApiResponse<Page<Inventory>> response = new ApiResponse<>(true, inventoryPage, pagination);
        return ResponseEntity.ok(response);
    }

    // ✅ No @PreAuthorize – handled by SecurityConfig
    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<Inventory>> adjustInventory(@RequestBody AdjustInventoryRequest request) {
        Inventory updated = inventoryService.adjustInventory(
                request.getProductId(),
                request.getWarehouseId(),
                request.getMovementType(),
                request.getQuantity(),
                request.getToWarehouseId(),
                request.getNotes()
        );
        return ResponseEntity.ok(new ApiResponse<>(true, updated));
    }

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<List<Inventory>>> getInventoryMovements(
            @RequestParam(required = false) UUID product_id,
            @RequestParam(required = false) UUID warehouse_id) {

        List<Inventory> movements = inventoryService.getInventoryMovements(product_id, warehouse_id);
        return ResponseEntity.ok(new ApiResponse<>(true, movements));
    }
}

// ========== DTO ==========
class AdjustInventoryRequest {
    private UUID productId;
    private UUID warehouseId;
    private String movementType;
    private int quantity;
    private UUID toWarehouseId;
    private String notes;

    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public UUID getWarehouseId() { return warehouseId; }
    public void setWarehouseId(UUID warehouseId) { this.warehouseId = warehouseId; }
    public String getMovementType() { return movementType; }
    public void setMovementType(String movementType) { this.movementType = movementType; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public UUID getToWarehouseId() { return toWarehouseId; }
    public void setToWarehouseId(UUID toWarehouseId) { this.toWarehouseId = toWarehouseId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}