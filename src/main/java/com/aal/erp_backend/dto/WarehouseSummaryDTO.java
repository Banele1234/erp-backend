package com.aal.erp_backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class WarehouseSummaryDTO {
    private UUID id;
    private String name;
}