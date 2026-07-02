package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Rejection;
import com.aal.erp_backend.repository.RejectionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class RejectionService {

    private final RejectionRepository rejectionRepository;

    public RejectionService(RejectionRepository rejectionRepository) {
        this.rejectionRepository = rejectionRepository;
    }

    public Page<Rejection> getRejections(int page, int limit, String status) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());

        // ✅ Ignore null, empty, and the literal string "undefined"
        if (status != null && !status.isEmpty() && !"undefined".equalsIgnoreCase(status)) {
            return rejectionRepository.findByStatus(status, pageable);
        }
        return rejectionRepository.findAll(pageable);
    }

    public Rejection createRejection(Rejection rejection) {
        rejection.setId(UUID.randomUUID());
        rejection.setRejectionNumber("REJ-" + Instant.now().getEpochSecond());
        rejection.setCreatedAt(Instant.now());
        rejection.setUpdatedAt(Instant.now());
        return rejectionRepository.save(rejection);
    }

    public Rejection updateRejection(UUID id, Rejection update) {
        Rejection existing = rejectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rejection not found"));
        if (update.getStatus() != null) existing.setStatus(update.getStatus());
        if (update.getCreditIssued() != null) existing.setCreditIssued(update.getCreditIssued());
        if (update.getReason() != null) existing.setReason(update.getReason());
        existing.setUpdatedAt(Instant.now());
        return rejectionRepository.save(existing);
    }
}