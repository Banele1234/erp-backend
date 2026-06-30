package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    // ✅ All methods use UUID
    Optional<Inventory> findByProductIdAndWarehouseId(UUID productId, UUID warehouseId);
    List<Inventory> findByProductId(UUID productId);
    List<Inventory> findByWarehouseId(UUID warehouseId);
    Page<Inventory> findByWarehouseId(UUID warehouseId, Pageable pageable);

    @Query("SELECT i FROM Inventory i WHERE i.availableQuantity < (SELECT p.reorderLevel FROM Product p WHERE p.id = i.productId)")
    Page<Inventory> findByAvailableQuantityLessThanReorderLevel(Pageable pageable);

    @Query("SELECT i FROM Inventory i WHERE i.warehouseId = :warehouseId AND i.availableQuantity < (SELECT p.reorderLevel FROM Product p WHERE p.id = i.productId)")
    Page<Inventory> findByWarehouseIdAndAvailableQuantityLessThanReorderLevel(@Param("warehouseId") UUID warehouseId, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.availableQuantity < (SELECT p.reorderLevel FROM Product p WHERE p.id = i.productId)")
    long countByAvailableQuantityLessThanReorderLevel();
}