package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Production;
import com.aal.erp_backend.repository.ProductionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProductionService {

    private final ProductionRepository productionRepository;

    public ProductionService(ProductionRepository productionRepository) {
        this.productionRepository = productionRepository;
    }

    // ✅ Added method (matches the controller call)
    public Page<Production> getProductions(int page, int limit, String status, UUID orderId) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        if (orderId != null) {
            return productionRepository.findByOrderId(orderId, pageable);
        }
        // If status is provided, you could add a filter – currently returns all
        return productionRepository.findAll(pageable);
    }

    public Production getProductionById(UUID id) {
        return productionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Production batch not found"));
    }

    public Production updateProduction(UUID id, Production updated) {
        Production existing = getProductionById(id);
        if (updated.getProducedQuantity() != null) existing.setProducedQuantity(updated.getProducedQuantity());
        if (updated.getRejectedQuantity() != null) existing.setRejectedQuantity(updated.getRejectedQuantity());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        return productionRepository.save(existing);
    }
}