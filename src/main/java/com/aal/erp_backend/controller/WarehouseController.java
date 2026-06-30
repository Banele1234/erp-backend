package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.entity.Warehouse;
import com.aal.erp_backend.service.WarehouseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Warehouse>>> getWarehouses() {
        List<Warehouse> warehouses = warehouseService.getAllWarehouses();
        return ResponseEntity.ok(new ApiResponse<>(true, warehouses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Warehouse>> getWarehouse(@PathVariable UUID id) {
        Warehouse warehouse = warehouseService.getWarehouseById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, warehouse));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Warehouse>> createWarehouse(@RequestBody Warehouse warehouse) {
        Warehouse created = warehouseService.createWarehouse(warehouse);
        return ResponseEntity.ok(new ApiResponse<>(true, created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Warehouse>> updateWarehouse(@PathVariable UUID id, @RequestBody Warehouse warehouse) {
        Warehouse updated = warehouseService.updateWarehouse(id, warehouse);
        return ResponseEntity.ok(new ApiResponse<>(true, updated));
    }

    @GetMapping("/{id}/inventory")
    public ResponseEntity<ApiResponse<?>> getWarehouseInventory(@PathVariable UUID id) {
        var inventory = warehouseService.getWarehouseInventory(id);
        return ResponseEntity.ok(new ApiResponse<>(true, inventory));
    }
}