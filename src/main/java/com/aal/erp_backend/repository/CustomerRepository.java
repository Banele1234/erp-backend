package com.aal.erp_backend.repository;

import com.aal.erp_backend.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByUserId(UUID userId);
    Page<Customer> findByCompanyNameContainingIgnoreCaseOrCustomerCodeContainingIgnoreCase(String name, String code, Pageable pageable);
    Page<Customer> findByCustomerType(String type, Pageable pageable);
    Page<Customer> findByRating(String rating, Pageable pageable);
}