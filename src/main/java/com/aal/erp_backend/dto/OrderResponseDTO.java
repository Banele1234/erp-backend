package com.aal.erp_backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class OrderResponseDTO {
    private UUID id;
    private String orderNumber;
    private String status;
    private String priority;
    private Instant orderDate;
    private Instant requiredDate;
    private Double subtotal;
    private Double discountAmount;
    private Double taxAmount;
    private Double totalAmount;
    private String notes;
    private Integer itemCount;
    private CustomerSummaryDTO customer;
    private WarehouseSummaryDTO warehouse;
    private List<OrderItemDTO> items;
}