package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.*;
import com.aal.erp_backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/orders", "/api/v1/orders"})
public class OrderController {

    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public Page<OrderResponseDTO> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) UUID customerId) {
        return orderService.getOrders(page, size, sort, customerId);
    }

    @GetMapping("/{id}")
    public OrderResponseDTO getOrder(@PathVariable UUID id) {
        return orderService.getOrder(id);
    }

    @PostMapping
    public OrderResponseDTO createOrder(@RequestBody OrderCreateRequest request) {
        // ✅ Convert DTO items to service's OrderItemRequest type
        List<OrderService.OrderItemRequest> serviceItems = request.getItems().stream()
                .map(dtoItem -> {
                    OrderService.OrderItemRequest serviceReq = new OrderService.OrderItemRequest();
                    serviceReq.setProductId(dtoItem.getProductId());
                    serviceReq.setQuantity(dtoItem.getQuantity());
                    return serviceReq;
                })
                .collect(Collectors.toList());

        return orderService.createOrder(
                UUID.fromString(request.getCustomerId()),
                UUID.fromString(request.getWarehouseId()),
                serviceItems,
                request.getRequiredDate().atStartOfDay().toInstant(ZoneOffset.UTC),
                request.getNotes()
        );
    }

    @PatchMapping("/{id}/status")
    public OrderResponseDTO updateStatus(@PathVariable UUID id, @RequestBody StatusUpdateRequest request) {
        return orderService.updateOrderStatus(id, request.getStatus());
    }

    @PatchMapping("/{id}/dispatch")
    public OrderResponseDTO updateDispatch(@PathVariable UUID id, @RequestBody DispatchRequest request) {
        return orderService.updateDispatch(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable UUID id) {
        orderService.deleteOrder(id);
    }

    // ---------- Inner DTOs ----------
    public static class DispatchRequest {
        private String trackingNumber;
        private String courier;
        private String estimatedDelivery; // yyyy-MM-dd
        private String notes;

        public String getTrackingNumber() { return trackingNumber; }
        public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
        public String getCourier() { return courier; }
        public void setCourier(String courier) { this.courier = courier; }
        public String getEstimatedDelivery() { return estimatedDelivery; }
        public void setEstimatedDelivery(String estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}