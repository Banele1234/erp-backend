package com.aal.erp_backend.service;

import com.aal.erp_backend.controller.OrderController;
import com.aal.erp_backend.dto.*;
import com.aal.erp_backend.entity.*;
import com.aal.erp_backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final WarehouseRepository warehouseRepository;
    private final InvoiceService invoiceService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        ProductRepository productRepository,
                        CustomerRepository customerRepository,
                        UserRepository userRepository,
                        NotificationRepository notificationRepository,
                        WarehouseRepository warehouseRepository,
                        InvoiceService invoiceService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.warehouseRepository = warehouseRepository;
        this.invoiceService = invoiceService;
    }

    // ========== CONVERT TO DTO ==========
    private OrderResponseDTO convertToDTO(Order order) {
        try {
            System.out.println("🔍 Converting order: " + order.getId() + " - " + order.getOrderNumber());

            Customer customer = customerRepository.findById(order.getCustomerId()).orElse(null);
            Warehouse warehouse = warehouseRepository.findById(order.getWarehouseId()).orElse(null);

            CustomerSummaryDTO custDTO = null;
            if (customer != null) {
                custDTO = new CustomerSummaryDTO();
                custDTO.setId(customer.getId());
                custDTO.setCompanyName(customer.getCompanyName());
                custDTO.setEmail(customer.getEmail());
            }

            WarehouseSummaryDTO whDTO = null;
            if (warehouse != null) {
                whDTO = new WarehouseSummaryDTO();
                whDTO.setId(warehouse.getId());
                whDTO.setName(warehouse.getName());
            }

            List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
            System.out.println("🔍 Found " + orderItems.size() + " order items");

            List<OrderItemDTO> itemDTOs = orderItems.stream().map(item -> {
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                ProductSummaryDTO productSummary = new ProductSummaryDTO();
                if (product != null) {
                    productSummary.setId(product.getId() != null ? product.getId().toString() : null);
                    productSummary.setName(product.getName() != null ? product.getName() : "Unknown");
                    productSummary.setProductCode(product.getProductCode() != null ? product.getProductCode() : "N/A");
                    productSummary.setUnitPrice(product.getUnitPrice() != null ? product.getUnitPrice() : 0.0);
                    productSummary.setGstPercentage(product.getGstPercentage() != null ? product.getGstPercentage() : 0.0);
                } else {
                    productSummary.setName("Unknown");
                }
                OrderItemDTO dto = new OrderItemDTO();
                dto.setId(item.getId());
                dto.setProductId(item.getProductId());
                dto.setProduct(productSummary);
                dto.setQuantity(item.getQuantity() != null ? item.getQuantity() : 0);
                dto.setUnitPrice(item.getUnitPrice() != null ? item.getUnitPrice() : 0.0);
                dto.setTaxPercentage(item.getTaxPercentage() != null ? item.getTaxPercentage() : 0.0);
                dto.setLineTotal(item.getLineTotal() != null ? item.getLineTotal() : 0.0);
                return dto;
            }).collect(Collectors.toList());

            int itemCount = itemDTOs.size();

            OrderResponseDTO dto = new OrderResponseDTO();
            dto.setId(order.getId());
            dto.setOrderNumber(order.getOrderNumber() != null ? order.getOrderNumber() : "N/A");
            dto.setStatus(order.getStatus() != null ? order.getStatus() : "unknown");
            dto.setPriority(order.getPriority() != null ? order.getPriority() : "normal");
            dto.setOrderDate(order.getOrderDate());
            dto.setRequiredDate(order.getRequiredDate());
            dto.setSubtotal(order.getSubtotal() != null ? order.getSubtotal() : 0.0);
            dto.setDiscountAmount(order.getDiscountAmount() != null ? order.getDiscountAmount() : 0.0);
            dto.setTaxAmount(order.getTaxAmount() != null ? order.getTaxAmount() : 0.0);
            dto.setTotalAmount(order.getTotalAmount() != null ? order.getTotalAmount() : 0.0);
            dto.setNotes(order.getNotes());
            dto.setItemCount(itemCount);
            dto.setCustomer(custDTO);
            dto.setWarehouse(whDTO);
            dto.setItems(itemDTOs);
            return dto;
        } catch (Exception e) {
            System.err.println("❌ Error converting order " + order.getId() + ": " + e.getMessage());
            e.printStackTrace();
            OrderResponseDTO fallback = new OrderResponseDTO();
            fallback.setId(order.getId());
            fallback.setOrderNumber(order.getOrderNumber() != null ? order.getOrderNumber() : "N/A");
            fallback.setStatus("error");
            fallback.setTotalAmount(0.0);
            fallback.setItems(List.of());
            return fallback;
        }
    }

    // ========== GET ORDERS ==========
    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> getOrders(int page, int size, String sort, UUID customerId) {
        try {
            Sort sortObj;
            if (sort.contains(",")) {
                String[] parts = sort.split(",");
                sortObj = Sort.by(parts[0]).descending();
            } else {
                sortObj = Sort.by(sort).ascending();
            }
            Pageable pageable = PageRequest.of(page, size, sortObj);

            Page<Order> orderPage;
            if (customerId == null) {
                orderPage = orderRepository.findAll(pageable);
            } else {
                orderPage = orderRepository.findByCustomerId(customerId, pageable);
            }

            List<OrderResponseDTO> dtoList = new ArrayList<>();
            for (Order order : orderPage.getContent()) {
                dtoList.add(convertToDTO(order));
            }
            return new PageImpl<>(dtoList, pageable, orderPage.getTotalElements());
        } catch (Exception e) {
            e.printStackTrace();
            return new PageImpl<>(new ArrayList<>(), PageRequest.of(0, 10), 0);
        }
    }

    // ========== GET SINGLE ORDER ==========
    public OrderResponseDTO getOrder(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return convertToDTO(order);
    }

    // ========== CREATE ORDER ==========
    @Transactional
    public OrderResponseDTO createOrder(UUID customerId, UUID warehouseId,
                                        List<OrderItemRequest> items,
                                        Instant requiredDate, String notes,
                                        String shippingAddress, String shippingCity,
                                        String shippingState, String shippingPincode) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setOrderNumber("ORD-" + Instant.now().getEpochSecond());
        order.setCustomerId(customerId);
        order.setWarehouseId(warehouseId);
        order.setOrderDate(Instant.now());
        order.setRequiredDate(requiredDate);
        order.setPriority("normal");
        order.setStatus("pending");
        order.setNotes(notes);
        order.setShippingAddress(shippingAddress);
        order.setShippingCity(shippingCity);
        order.setShippingState(shippingState);
        order.setShippingPincode(shippingPincode);
        order.setCreatedAt(Instant.now());
        order.setSubtotal(0.0);
        order.setDiscountAmount(0.0);
        order.setTaxAmount(0.0);
        order.setTotalAmount(0.0);
        order = orderRepository.save(order);

        double subtotal = 0.0;
        double taxAmount = 0.0;
        for (OrderItemRequest itemReq : items) {
            Product product = productRepository.findById(UUID.fromString(itemReq.getProductId()))
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            double lineTotal = product.getUnitPrice() * itemReq.getQuantity();
            double tax = lineTotal * (product.getGstPercentage() / 100);
            subtotal += lineTotal;
            taxAmount += tax;

            OrderItem item = new OrderItem();
            item.setId(UUID.randomUUID());
            item.setOrderId(order.getId());
            item.setProductId(product.getId());
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(product.getUnitPrice());
            item.setDiscountPercentage(0.0);
            item.setTaxPercentage(product.getGstPercentage());
            item.setLineTotal(lineTotal);
            item.setCreatedAt(Instant.now());
            orderItemRepository.save(item);
        }

        Double discountPercentage = customer.getDiscountPercentage();
        if (discountPercentage == null) discountPercentage = 0.0;
        double discount = subtotal * (discountPercentage / 100);
        double total = subtotal - discount + taxAmount;
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discount);
        order.setTaxAmount(taxAmount);
        order.setTotalAmount(total);
        order.setUpdatedAt(Instant.now());
        order = orderRepository.save(order);

        // Notify admins
        List<User> admins = userRepository.findByRoleIgnoreCase("admin");
        for (User admin : admins) {
            createNotification(
                    admin.getId(),
                    "New Order Placed",
                    "Order " + order.getOrderNumber() + " has been placed by " + customer.getCompanyName() + ".",
                    "order",
                    order.getId().toString()
            );
        }

        return convertToDTO(order);
    }

    // ========== UPDATE ORDER STATUS (FIXED – now sends invoice notification) ==========
    @Transactional
    public OrderResponseDTO updateOrderStatus(UUID orderId, String status) {
        System.out.println("🔵 updateOrderStatus called for order " + orderId + " to " + status);
        Order order = getOrderById(orderId);
        order.setStatus(status);
        order.setUpdatedAt(Instant.now());
        Order updated = orderRepository.save(order);
        System.out.println("✅ Order status updated to " + status);

        Customer customer = customerRepository.findById(order.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        User user = userRepository.findById(customer.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 🔔 Generate invoice and send notification when status is in_production
        if ("in_production".equals(status)) {
            try {
                Invoice invoice = invoiceService.createInvoiceFromOrder(order, user.getId());
                System.out.println("✅ Invoice created: " + invoice.getInvoiceNumber());

                // Send invoice notification to customer
                createNotification(
                        user.getId(),
                        "Invoice Ready for Payment",
                        "Invoice " + invoice.getInvoiceNumber() + " for order " + order.getOrderNumber() + " is ready. Please pay.",
                        "invoice",
                        invoice.getId().toString()
                );
            } catch (Exception e) {
                System.err.println("❌ Invoice creation failed: " + e.getMessage());
            }
        }

        // Notify when ready_for_dispatch
        if ("ready_for_dispatch".equals(status)) {
            // Notify admins
            List<User> admins = userRepository.findByRoleIgnoreCase("admin");
            for (User admin : admins) {
                createNotification(
                        admin.getId(),
                        "Order Ready for Dispatch",
                        "Order " + order.getOrderNumber() + " is ready for dispatch. Please enter delivery details.",
                        "order",
                        order.getId().toString()
                );
            }
            // Notify customer to confirm/update shipping address
            createNotification(
                    user.getId(),
                    "Order Ready for Dispatch – Confirm Address",
                    "Order " + order.getOrderNumber() + " is ready for dispatch. Please confirm your shipping address.",
                    "order",
                    order.getId().toString()
            );
        } else {
            // Normal status update for other statuses
            String title = "Order " + status.replace("_", " ").toLowerCase();
            String message = "Order " + order.getOrderNumber() + " has been updated to " + status + ".";
            createNotification(user.getId(), title, message, "order", order.getId().toString());
        }

        return convertToDTO(updated);
    }

    // ========== UPDATE SHIPPING ADDRESS ==========
    @Transactional
    public OrderResponseDTO updateShipping(UUID orderId, OrderController.ShippingRequest request) {
        Order order = getOrderById(orderId);
        if (request.getShippingAddress() != null) order.setShippingAddress(request.getShippingAddress());
        if (request.getShippingCity() != null) order.setShippingCity(request.getShippingCity());
        if (request.getShippingState() != null) order.setShippingState(request.getShippingState());
        if (request.getShippingPincode() != null) order.setShippingPincode(request.getShippingPincode());
        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);

        // Notify admins that address has been updated
        List<User> admins = userRepository.findByRoleIgnoreCase("admin");
        for (User admin : admins) {
            createNotification(
                    admin.getId(),
                    "Shipping Address Updated",
                    "Customer has updated the shipping address for order " + order.getOrderNumber() + ".",
                    "order",
                    order.getId().toString()
            );
        }
        return convertToDTO(order);
    }

    // ========== UPDATE DISPATCH ==========
    @Transactional
    public OrderResponseDTO updateDispatch(UUID orderId, OrderController.DispatchRequest request) {
        Order order = getOrderById(orderId);
        if (request.getTrackingNumber() != null) order.setDispatchTracking(request.getTrackingNumber());
        if (request.getCourier() != null) order.setDispatchCourier(request.getCourier());
        if (request.getEstimatedDelivery() != null && !request.getEstimatedDelivery().isEmpty()) {
            order.setDispatchEstimatedDelivery(LocalDate.parse(request.getEstimatedDelivery()));
        }
        if (request.getNotes() != null) order.setDispatchNotes(request.getNotes());
        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);

        // Notify customer that logistics details have been added
        Customer customer = customerRepository.findById(order.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        User user = userRepository.findById(customer.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        createNotification(
                user.getId(),
                "Order Dispatched",
                "Your order " + order.getOrderNumber() + " has been dispatched. Tracking: " + order.getDispatchTracking(),
                "order",
                order.getId().toString()
        );
        return convertToDTO(order);
    }

    // ========== DELETE ORDER ==========
    @Transactional
    public void deleteOrder(UUID orderId) {
        Order order = getOrderById(orderId);
        orderItemRepository.deleteByOrderId(orderId);
        orderRepository.delete(order);
    }

    // ========== UPDATE ORDER ==========
    @Transactional
    public OrderResponseDTO updateOrder(UUID orderId, Instant requiredDate, String notes) {
        Order order = getOrderById(orderId);
        if (requiredDate != null) order.setRequiredDate(requiredDate);
        if (notes != null) order.setNotes(notes);
        order.setUpdatedAt(Instant.now());
        return convertToDTO(orderRepository.save(order));
    }

    private Order getOrderById(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    private void createNotification(UUID userId, String title, String message, String type, String referenceId) {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        notification.setIsRead(false);
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    // ---------- Inner DTO for items ----------
    public static class OrderItemRequest {
        private String productId;
        private Integer quantity;

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}