package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Product;
import com.aal.erp_backend.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Page<Product> getProducts(int page, int limit, String search, String category, Boolean active) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        if (search != null && !search.isEmpty()) {
            return productRepository.findByNameContainingIgnoreCase(search, pageable);
        }
        // Add category and active filters if needed
        return productRepository.findAll(pageable);
    }

    public Product getProductById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product createProduct(Product product) {
        product.setId(UUID.randomUUID());
        product.setCreatedAt(Instant.now());
        return productRepository.save(product);
    }

    public Product updateProduct(UUID id, Product updated) {
        Product existing = getProductById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getUnit() != null) existing.setUnit(updated.getUnit());
        if (updated.getUnitPrice() != null) existing.setUnitPrice(updated.getUnitPrice());
        if (updated.getCostPrice() != null) existing.setCostPrice(updated.getCostPrice());
        if (updated.getGstPercentage() != null) existing.setGstPercentage(updated.getGstPercentage());
        if (updated.getReorderLevel() != null) existing.setReorderLevel(updated.getReorderLevel());
        if (updated.getEoq() != null) existing.setEoq(updated.getEoq());
        if (updated.getWeightKg() != null) existing.setWeightKg(updated.getWeightKg());
        if (updated.getIsActive() != null) existing.setIsActive(updated.getIsActive());
        existing.setUpdatedAt(Instant.now());
        return productRepository.save(existing);
    }

    public void deleteProduct(UUID id) {
        Product product = getProductById(id);
        product.setIsActive(false);
        product.setUpdatedAt(Instant.now());
        productRepository.save(product);
    }

    public Object getProductInventory(UUID id) {
        // You can implement inventory lookup here
        return null;
    }
}