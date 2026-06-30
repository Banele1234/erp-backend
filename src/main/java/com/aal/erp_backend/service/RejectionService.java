package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Rejection;
import com.aal.erp_backend.repository.RejectionRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RejectionService {

    private final RejectionRepository rejectionRepository;

    public RejectionService(RejectionRepository rejectionRepository) {
        this.rejectionRepository = rejectionRepository;
    }

    public List<Rejection> getAllRejections() {
        return rejectionRepository.findAll();
    }

    public Rejection getRejectionById(UUID id) {
        return rejectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rejection not found"));
    }

    public Rejection createRejection(UUID productId, UUID warehouseId, Integer quantity,
                                     String reason, UUID createdBy) {
        Rejection rejection = new Rejection();
        rejection.setId(UUID.randomUUID());
        rejection.setProductId(productId);
        rejection.setWarehouseId(warehouseId);
        rejection.setQuantity(quantity);
        rejection.setReason(reason);
        rejection.setRejectionDate(Instant.now());
        rejection.setCreatedBy(createdBy);
        rejection.setCreatedAt(Instant.now());
        return rejectionRepository.save(rejection);
    }

    public void deleteRejection(UUID id) {
        rejectionRepository.deleteById(id);
    }
}