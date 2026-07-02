// src/main/java/com/aal/erp_backend/dto/OrderCreateRequest.java
package com.aal.erp_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class OrderCreateRequest {

    @NotNull
    @JsonProperty("customerId")
    private String customerId;

    @NotNull
    @JsonProperty("warehouseId")
    private String warehouseId;

    @JsonProperty("orderDate")
    private LocalDate orderDate;

    @JsonProperty("requiredDate")
    private LocalDate requiredDate;

    private String notes;

    @JsonProperty("items")
    private List<OrderItemRequest> items;

    // ===== NEW: Shipping fields =====
    @JsonProperty("shippingAddress")
    private String shippingAddress;

    @JsonProperty("shippingCity")
    private String shippingCity;

    @JsonProperty("shippingState")
    private String shippingState;

    @JsonProperty("shippingPincode")
    private String shippingPincode;

    // ----- Getters and Setters -----
    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(String warehouseId) {
        this.warehouseId = warehouseId;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDate getRequiredDate() {
        return requiredDate;
    }

    public void setRequiredDate(LocalDate requiredDate) {
        this.requiredDate = requiredDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    // ----- NEW: Shipping getters and setters -----
    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getShippingCity() {
        return shippingCity;
    }

    public void setShippingCity(String shippingCity) {
        this.shippingCity = shippingCity;
    }

    public String getShippingState() {
        return shippingState;
    }

    public void setShippingState(String shippingState) {
        this.shippingState = shippingState;
    }

    public String getShippingPincode() {
        return shippingPincode;
    }

    public void setShippingPincode(String shippingPincode) {
        this.shippingPincode = shippingPincode;
    }
}