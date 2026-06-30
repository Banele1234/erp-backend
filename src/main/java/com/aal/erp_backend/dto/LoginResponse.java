package com.aal.erp_backend.dto;

import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.entity.Customer;
import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private User user;
    private Customer customer;
}