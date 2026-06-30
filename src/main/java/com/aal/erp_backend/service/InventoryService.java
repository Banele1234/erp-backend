package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Inventory;
import com.aal.erp_backend.entity.Product;
import com.aal.erp_backend.entity.Warehouse;
import com.aal.erp_backend.repository.InventoryRepository;
import com.aal.erp_backend.repository.ProductRepository;
import com.aal.erp_backend.repository.WarehouseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public InventoryService(InventoryRepository inventoryRepository,
                            ProductRepository productRepository,
                            WarehouseRepository warehouseRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
    }

    public Page<Inventory> getInventory(int page, int limit, UUID warehouseId, Boolean lowStock) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        if (warehouseId != null && lowStock != null && lowStock) {
            return inventoryRepository.findByWarehouseIdAndAvailableQuantityLessThanReorderLevel(warehouseId, pageable);
        }
        if (warehouseId != null) {
            return inventoryRepository.findByWarehouseId(warehouseId, pageable);
        }
        if (lowStock != null && lowStock) {
            return inventoryRepository.findByAvailableQuantityLessThanReorderLevel(pageable);
        }
        return inventoryRepository.findAll(pageable);
    }

    @Transactional
    public Inventory adjustInventory(UUID productId, UUID warehouseId, String movementType,
                                     int quantity, UUID toWarehouseId, String notes) {
        // ✅ fetch product and warehouse – both use UUID
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        // ✅ fetch or create inventory entry
        Inventory inventory = inventoryRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElseGet(() -> {
                    Inventory newInv = new Inventory();
                    newInv.setId(UUID.randomUUID());
                    newInv.setProductId(productId);
                    newInv.setWarehouseId(warehouseId);
                    newInv.setQuantity(0);
                    newInv.setReservedQuantity(0);
                    newInv.setAvailableQuantity(0);
                    newInv.setCreatedAt(Instant.now());
                    return newInv;
                });

        switch (movementType) {
            case "in":
                inventory.setQuantity(inventory.getQuantity() + quantity);
                inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);
                break;
            case "out":
                if (inventory.getAvailableQuantity() < quantity) {
                    throw new RuntimeException("Insufficient stock");
                }
                inventory.setQuantity(inventory.getQuantity() - quantity);
                inventory.setAvailableQuantity(inventory.getAvailableQuantity() - quantity);
                break;
            case "transfer":
                if (toWarehouseId == null) {
                    throw new RuntimeException("Destination warehouse required for transfer");
                }
                if (inventory.getAvailableQuantity() < quantity) {
                    throw new RuntimeException("Insufficient stock for transfer");
                }
                Warehouse toWarehouse = warehouseRepository.findById(toWarehouseId)
                        .orElseThrow(() -> new RuntimeException("Destination warehouse not found"));
                // Deduct from source
                inventory.setQuantity(inventory.getQuantity() - quantity);
                inventory.setAvailableQuantity(inventory.getAvailableQuantity() - quantity);
                // Add to destination
                Inventory destInventory = inventoryRepository.findByProductIdAndWarehouseId(productId, toWarehouseId)
                        .orElseGet(() -> {
                            Inventory newInv = new Inventory();
                            newInv.setId(UUID.randomUUID());
                            newInv.setProductId(productId);
                            newInv.setWarehouseId(toWarehouseId);
                            newInv.setQuantity(0);
                            newInv.setReservedQuantity(0);
                            newInv.setAvailableQuantity(0);
                            newInv.setCreatedAt(Instant.now());
                            return newInv;
                        });
                destInventory.setQuantity(destInventory.getQuantity() + quantity);
                destInventory.setAvailableQuantity(destInventory.getAvailableQuantity() + quantity);
                destInventory.setLastUpdated(Instant.now());
                inventoryRepository.save(destInventory);
                break;
            default:
                throw new RuntimeException("Invalid movement type");
        }

        inventory.setLastUpdated(Instant.now());
        return inventoryRepository.save(inventory);
    }

    public List<Inventory> getInventoryMovements(UUID productId, UUID warehouseId) {
        if (productId != null && warehouseId != null) {
            return inventoryRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                    .map(List::of)
                    .orElse(List.of());
        }
        if (productId != null) {
            return inventoryRepository.findByProductId(productId);
        }
        if (warehouseId != null) {
            return inventoryRepository.findByWarehouseId(warehouseId);
        }
        return inventoryRepository.findAll();
    }
}