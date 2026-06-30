package com.aal.erp_backend.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class SettingsService {

    private final Map<String, Object> settings = new HashMap<>();

    public SettingsService() {
        settings.put("language", "en-US");
        settings.put("timezone", "Asia/Kolkata");
        settings.put("dateFormat", "DD/MM/YYYY");
        settings.put("emailAlerts", true);
        settings.put("smsAlerts", false);
        settings.put("inventoryWarnings", true);
        settings.put("twoFactor", false);
        settings.put("passwordPolicy", "strong");
        settings.put("sessionTimeout", 30);
    }

    public Map<String, Object> getSettings() {
        return settings;
    }

    public Map<String, Object> updateSettings(Map<String, Object> newSettings) {
        settings.putAll(newSettings);
        return settings;
    }
}