package com.aal.erp_backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CustomerSummaryDTO {
    private UUID id;
    private String companyName;
    private String email;
}