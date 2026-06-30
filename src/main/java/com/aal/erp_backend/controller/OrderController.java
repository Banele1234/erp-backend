package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.*;
import com.aal.erp_backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneOffset;
import java.util.UUID;

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
        return orderService.createOrder(
                UUID.fromString(request.getCustomerId()),
                UUID.fromString(request.getWarehouseId()),
                request.getItems(),
                request.getRequiredDate().atStartOfDay().toInstant(ZoneOffset.UTC),
                request.getNotes()
        );
    }

    @PatchMapping("/{id}/status")
    public OrderResponseDTO updateStatus(@PathVariable UUID id, @RequestBody StatusUpdateRequest request) {
        return orderService.updateOrderStatus(id, request.getStatus());
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable UUID id) {
        orderService.deleteOrder(id);
    }
}