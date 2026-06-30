package com.aal.erp_backend.dto;

import lombok.Data;

@Data
public class SettingsUpdateRequest {
    private String key;
    private String value;
}
