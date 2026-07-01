package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    // ✅ Added for UserController – returns all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // (Optional) add other methods if needed
}