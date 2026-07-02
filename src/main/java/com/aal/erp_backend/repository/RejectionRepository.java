package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Rejection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RejectionRepository extends JpaRepository<Rejection, UUID> {
    Page<Rejection> findByStatus(String status, Pageable pageable);
}