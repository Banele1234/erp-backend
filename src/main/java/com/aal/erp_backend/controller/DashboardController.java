package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.security.JwtUtil;
import com.aal.erp_backend.service.DashboardService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final JwtUtil jwtUtil;

    public DashboardController(DashboardService dashboardService, JwtUtil jwtUtil) {
        this.dashboardService = dashboardService;
        this.jwtUtil = jwtUtil;
    }

    private UUID getCurrentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("No valid token found");
        }
        String token = authHeader.substring(7);
        Claims claims = jwtUtil.validateToken(token);
        String userIdStr = claims.getSubject();
        return UUID.fromString(userIdStr);
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats(HttpServletRequest request) {
        try {
            Map<String, Object> data = dashboardService.getDashboardStats();
            return ResponseEntity.ok(new ApiResponse<>(true, data));
        } catch (Exception e) {
            e.printStackTrace();
            ApiResponse<Map<String, Object>> errorResponse = new ApiResponse<>(false, null);
            errorResponse.setMessage("Failed to fetch dashboard stats: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/customer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerDashboard(HttpServletRequest request) {
        try {
            UUID userId = getCurrentUserId(request);
            Map<String, Object> data = dashboardService.getCustomerDashboard(userId);
            return ResponseEntity.ok(new ApiResponse<>(true, data));
        } catch (Exception e) {
            e.printStackTrace();
            ApiResponse<Map<String, Object>> errorResponse = new ApiResponse<>(false, null);
            errorResponse.setMessage("Failed to fetch customer dashboard: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/sales-chart")
    public ResponseEntity<ApiResponse<?>> getSalesChartData(@RequestParam(defaultValue = "month") String period) {
        try {
            var data = dashboardService.getSalesChartData(period);
            return ResponseEntity.ok(new ApiResponse<>(true, data));
        } catch (Exception e) {
            e.printStackTrace();
            ApiResponse<Object> errorResponse = new ApiResponse<>(false, null);
            errorResponse.setMessage("Failed to fetch sales chart: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<?>> getTopProducts(@RequestParam(defaultValue = "10") int limit) {
        try {
            var data = dashboardService.getTopProducts(limit);
            return ResponseEntity.ok(new ApiResponse<>(true, data));
        } catch (Exception e) {
            e.printStackTrace();
            ApiResponse<Object> errorResponse = new ApiResponse<>(false, null);
            errorResponse.setMessage("Failed to fetch top products: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}