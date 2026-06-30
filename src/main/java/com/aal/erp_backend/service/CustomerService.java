package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.entity.Order;
import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.repository.CustomerRepository;
import com.aal.erp_backend.repository.OrderRepository;
import com.aal.erp_backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(CustomerRepository customerRepository,
                           UserRepository userRepository,
                           OrderRepository orderRepository,
                           PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Page<Customer> getCustomers(int page, int limit, String search, String type, String rating) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        if (search != null && !search.isEmpty()) {
            return customerRepository.findByCompanyNameContainingIgnoreCaseOrCustomerCodeContainingIgnoreCase(
                    search, search, pageable);
        }
        if (type != null && !type.isEmpty()) {
            return customerRepository.findByCustomerType(type, pageable);
        }
        if (rating != null && !rating.isEmpty()) {
            return customerRepository.findByRating(rating, pageable);
        }
        return customerRepository.findAll(pageable);
    }

    public Customer getCustomerById(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    @Transactional
    public Customer createCustomer(String email, String companyName, String contactPerson,
                                   String phone, String address, String city, String customerType,
                                   Double creditLimit) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        UUID userId = UUID.randomUUID();
        user.setId(userId);
        user.setEmail(email);
        user.setFullName(contactPerson);
        user.setRole("customer");
        user.setIsActive(true);   // ✅ fixed
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setCreatedAt(Instant.now());
        userRepository.save(user);

        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setUserId(userId);
        customer.setCustomerCode("CUS-" + Instant.now().getEpochSecond());
        customer.setCompanyName(companyName);
        customer.setContactPerson(contactPerson);
        customer.setEmail(email);
        customer.setPhone(phone);
        customer.setAddress(address);
        customer.setCity(city);
        customer.setCustomerType(customerType != null ? customerType : "regular_dealer");
        customer.setRating("bronze");
        customer.setCreditLimit(creditLimit != null ? creditLimit : 100000.0);
        customer.setCurrentOutstanding(0.0);
        customer.setTotalPurchases(0.0);
        customer.setDiscountPercentage(0.0);
        customer.setCountry("India");
        customer.setIsActive(true);
        customer.setCreatedAt(Instant.now());
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(UUID id, Customer updated) {
        Customer existing = getCustomerById(id);
        if (updated.getCompanyName() != null) existing.setCompanyName(updated.getCompanyName());
        if (updated.getContactPerson() != null) existing.setContactPerson(updated.getContactPerson());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getAddress() != null) existing.setAddress(updated.getAddress());
        if (updated.getCity() != null) existing.setCity(updated.getCity());
        if (updated.getState() != null) existing.setState(updated.getState());
        if (updated.getPincode() != null) existing.setPincode(updated.getPincode());
        if (updated.getGstNumber() != null) existing.setGstNumber(updated.getGstNumber());
        if (updated.getCustomerType() != null) existing.setCustomerType(updated.getCustomerType());
        if (updated.getCreditLimit() != null) existing.setCreditLimit(updated.getCreditLimit());
        if (updated.getCountry() != null) existing.setCountry(updated.getCountry());
        if (updated.getIsActive() != null) existing.setIsActive(updated.getIsActive());
        existing.setUpdatedAt(Instant.now());
        return customerRepository.save(existing);
    }

    @Transactional
    public void deleteCustomer(UUID id) {
        Customer customer = getCustomerById(id);
        customer.setIsActive(false);
        customerRepository.save(customer);
        userRepository.findById(customer.getUserId()).ifPresent(u -> u.setIsActive(false));
    }

    public List<Order> getCustomerOrders(UUID customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Customer updateRating(UUID id, String rating) {
        Customer customer = getCustomerById(id);
        customer.setRating(rating);
        double discount = switch (rating) {
            case "gold" -> 20.0;
            case "silver" -> 10.0;
            default -> 5.0;
        };
        customer.setDiscountPercentage(discount);
        customer.setUpdatedAt(Instant.now());
        return customerRepository.save(customer);
    }
}