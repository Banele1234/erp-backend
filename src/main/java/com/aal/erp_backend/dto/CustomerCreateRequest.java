package com.aal.erp_backend.dto;

import lombok.Data;

@Data
public class CustomerCreateRequest {
    private String email;
    private String companyName;
    private String contactPerson;
    private String phone;
    private String address;
    private String city;
    private String customerType;
    private Double creditLimit;
}