package com.aal.erp_backend.service;

import com.aal.erp_backend.dto.LoginRequest;
import com.aal.erp_backend.dto.LoginResponse;
import com.aal.erp_backend.dto.RegisterRequest;
import com.aal.erp_backend.dto.ProfileUpdateRequest;
import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.repository.UserRepository;
import com.aal.erp_backend.repository.CustomerRepository;
import com.aal.erp_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    public AuthService(UserRepository userRepository,
                       CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.restTemplate = restTemplate;
    }

    // ==================== LOGIN ====================
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        Customer customer = customerRepository.findByUserId(user.getId()).orElse(null);

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUser(user);
        if (customer != null) {
            response.setCustomer(customer);
        }
        return response;
    }

    // ==================== REGISTER ====================
    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("customer");
        user.setIsActive(true);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        user = userRepository.save(user);

        // ---------- Customer with fallback for null values ----------
        String companyName = request.getCompanyName();
        if (companyName == null || companyName.trim().isEmpty()) {
            companyName = request.getFullName() + "'s Company";
        }

        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setUserId(user.getId());
        customer.setCustomerCode(generateCustomerCode(user));
        customer.setCompanyName(companyName);
        customer.setContactPerson(request.getFullName());
        customer.setEmail(request.getEmail());

        customer.setPhone(request.getPhone() != null ? request.getPhone() : "");
        customer.setAddress(request.getAddress() != null ? request.getAddress() : "");
        customer.setCity(request.getCity() != null ? request.getCity() : "");
        customer.setState(request.getState() != null ? request.getState() : "");
        customer.setPincode(request.getPincode() != null ? request.getPincode() : "");
        customer.setGstNumber(request.getGstNumber() != null ? request.getGstNumber() : "");

        customer.setCustomerType("Regular");
        customer.setRating("Standard");   // default rating for new customers
        customer.setCreditLimit(calculateCreditLimit(customer.getRating()));  // ✅ set credit limit
        customer.setIsActive(true);
        customer.setCreatedAt(Instant.now());
        customer.setUpdatedAt(Instant.now());

        customerRepository.save(customer);

        return user;
    }

    // ==================== UPDATE PROFILE ====================
    @Transactional
    public User updateProfile(ProfileUpdateRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName());
        }
        user.setUpdatedAt(Instant.now());
        user = userRepository.save(user);

        Customer customer = customerRepository.findByUserId(user.getId()).orElse(null);
        if (customer != null) {
            if (request.getCompanyName() != null) customer.setCompanyName(request.getCompanyName());
            if (request.getPhone() != null) customer.setPhone(request.getPhone());
            if (request.getAddress() != null) customer.setAddress(request.getAddress());
            if (request.getCity() != null) customer.setCity(request.getCity());
            if (request.getState() != null) customer.setState(request.getState());
            if (request.getPincode() != null) customer.setPincode(request.getPincode());
            if (request.getGstNumber() != null) customer.setGstNumber(request.getGstNumber());
            // Update rating and credit limit if rating is changed
            if (request.getRating() != null && !request.getRating().equals(customer.getRating())) {
                customer.setRating(request.getRating());
                customer.setCreditLimit(calculateCreditLimit(request.getRating()));
            }
            customer.setUpdatedAt(Instant.now());
            customerRepository.save(customer);
        }

        System.out.println("✅ Profile updated for user: " + email);
        return user;
    }

    // ---- helper: calculate credit limit based on rating ----
    private Double calculateCreditLimit(String rating) {
        if (rating == null) return 10000.0;
        switch (rating) {
            case "Premium":
                return 50000.0;   // high credit for premium customers
            case "Standard":
                return 15000.0;   // medium
            case "Basic":
                return 5000.0;    // low
            default:
                return 10000.0;   // fallback
        }
    }

    // ---- helper: generate customer code ----
    private String generateCustomerCode(User user) {
        return "CUST-" + user.getId().toString().substring(0, 8).toUpperCase();
    }
}