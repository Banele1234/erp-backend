package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Warehouse;
import com.aal.erp_backend.repository.WarehouseRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseService(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    public Warehouse getWarehouseById(UUID id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
    }

    public Warehouse createWarehouse(Warehouse warehouse) {
        warehouse.setId(UUID.randomUUID());
        warehouse.setCreatedAt(Instant.now());
        return warehouseRepository.save(warehouse);
    }

    public Warehouse updateWarehouse(UUID id, Warehouse updated) {
        Warehouse existing = getWarehouseById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getLocation() != null) existing.setLocation(updated.getLocation());
        if (updated.getCity() != null) existing.setCity(updated.getCity());
        if (updated.getState() != null) existing.setState(updated.getState());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getManagerName() != null) existing.setManagerName(updated.getManagerName());
        if (updated.getCapacityUnits() != null) existing.setCapacityUnits(updated.getCapacityUnits());
        if (updated.getCurrentUtilization() != null) existing.setCurrentUtilization(updated.getCurrentUtilization());
        if (updated.getIsActive() != null) existing.setIsActive(updated.getIsActive());
        existing.setUpdatedAt(Instant.now());
        return warehouseRepository.save(existing);
    }

    public Object getWarehouseInventory(UUID id) {
        // Implement inventory lookup for the warehouse
        return null;
    }
}