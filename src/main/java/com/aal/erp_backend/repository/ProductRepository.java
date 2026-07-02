package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    // ✅ Added method for product search
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);
}