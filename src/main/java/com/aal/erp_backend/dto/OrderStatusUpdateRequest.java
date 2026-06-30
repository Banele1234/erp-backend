package com.aal.erp_backend.dto;

import lombok.Data;

@Data
public class OrderStatusUpdateRequest {
    private Long orderId;
    private String status;
}
