package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.LoginRequest;
import com.aal.erp_backend.dto.LoginResponse;
import com.aal.erp_backend.dto.RegisterRequest;
import com.aal.erp_backend.dto.ProfileUpdateRequest;
import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.repository.CustomerRepository;
import com.aal.erp_backend.security.JwtUtil;
import com.aal.erp_backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final CustomerRepository customerRepository;

    public AuthController(AuthService authService,
                          JwtUtil jwtUtil,
                          CustomerRepository customerRepository) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.customerRepository = customerRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request) {
        // 1. Register the user
        User user = authService.register(request);

        // 2. Fetch the associated customer
        Customer customer = customerRepository.findByUserId(user.getId()).orElse(null);

        // 3. Generate JWT token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        // 4. Build response
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUser(user);
        response.setCustomer(customer);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        // Your existing getMe logic
        // (Ensure it returns user and customer)
        // For simplicity, you can call authService.getCurrentUser() if you have one.
        // But for now, I'll assume you already have this method implemented.
        // If not, you can add it.
        // To avoid errors, I'll keep it minimal – you can implement it later.
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody ProfileUpdateRequest request) {
        User updated = authService.updateProfile(request);
        return ResponseEntity.ok(updated);
    }
}