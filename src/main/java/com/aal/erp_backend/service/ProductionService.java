package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Production;
import com.aal.erp_backend.repository.ProductionRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProductionService {

    private final ProductionRepository productionRepository;

    public ProductionService(ProductionRepository productionRepository) {
        this.productionRepository = productionRepository;
    }

    public List<Production> getAllProduction() {
        return productionRepository.findAll();
    }

    public Production getProductionById(UUID id) {
        return productionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Production record not found"));
    }

    public Production createProduction(UUID productId, Integer quantityProduced,
                                       Double rawMaterialCost, Double laborCost, String status) {
        Production production = new Production();
        production.setId(UUID.randomUUID());
        production.setProductId(productId);
        production.setQuantityProduced(quantityProduced);
        production.setProductionDate(Instant.now());
        production.setRawMaterialCost(rawMaterialCost);
        production.setLaborCost(laborCost);
        production.setStatus(status != null ? status : "planned");
        production.setCreatedAt(Instant.now());
        return productionRepository.save(production);
    }

    public Production updateProductionStatus(UUID id, String status) {
        Production production = getProductionById(id);
        production.setStatus(status);
        return productionRepository.save(production);
    }
}