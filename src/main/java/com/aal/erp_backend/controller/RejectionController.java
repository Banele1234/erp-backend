package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.entity.Rejection;
import com.aal.erp_backend.service.RejectionService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rejections")
public class RejectionController {

    private final RejectionService rejectionService;

    public RejectionController(RejectionService rejectionService) {
        this.rejectionService = rejectionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Rejection>>> getRejections(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status) {
        try {
            Page<Rejection> rejections = rejectionService.getRejections(page, limit, status);
            return ResponseEntity.ok(new ApiResponse<>(true, rejections));
        } catch (Exception e) {
            ApiResponse<Page<Rejection>> error = new ApiResponse<>(false, null);
            error.setMessage(e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Rejection>> createRejection(@RequestBody Rejection rejection) {
        try {
            Rejection created = rejectionService.createRejection(rejection);
            return ResponseEntity.ok(new ApiResponse<>(true, created));
        } catch (Exception e) {
            ApiResponse<Rejection> error = new ApiResponse<>(false, null);
            error.setMessage(e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Rejection>> updateRejection(@PathVariable UUID id, @RequestBody Rejection update) {
        try {
            Rejection updated = rejectionService.updateRejection(id, update);
            return ResponseEntity.ok(new ApiResponse<>(true, updated));
        } catch (Exception e) {
            ApiResponse<Rejection> error = new ApiResponse<>(false, null);
            error.setMessage(e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}