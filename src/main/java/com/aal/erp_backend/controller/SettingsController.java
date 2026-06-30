package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettings() {
        return ResponseEntity.ok(new ApiResponse<>(true, settingsService.getSettings()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(@RequestBody Map<String, Object> settings) {
        Map<String, Object> updated = settingsService.updateSettings(settings);
        return ResponseEntity.ok(new ApiResponse<>(true, updated));
    }
}