package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(new ApiResponse<>(true, users));
        } catch (Exception e) {
            ApiResponse<List<User>> errorResponse = new ApiResponse<>(false, null);
            errorResponse.setMessage("Failed to fetch users: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}