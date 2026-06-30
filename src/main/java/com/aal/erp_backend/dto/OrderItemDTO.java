package com.aal.erp_backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class OrderItemDTO {
    private UUID id;
    private UUID productId;
    private ProductSummaryDTO product;
    private Integer quantity;
    private Double unitPrice;
    private Double taxPercentage;
    private Double lineTotal;
}