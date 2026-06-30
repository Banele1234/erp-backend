package com.aal.erp_backend.dto;

import lombok.Data;

@Data
public class ProductSummaryDTO {
    private String id;
    private String name;
    private String productCode;
    private Double unitPrice;
    private Double gstPercentage;
}