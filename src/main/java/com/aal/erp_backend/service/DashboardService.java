package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.entity.Invoice;
import com.aal.erp_backend.entity.Order;
import com.aal.erp_backend.entity.OrderItem;
import com.aal.erp_backend.entity.Warehouse;
import com.aal.erp_backend.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final WarehouseRepository warehouseRepository;

    public DashboardService(OrderRepository orderRepository,
                            CustomerRepository customerRepository,
                            InvoiceRepository invoiceRepository,
                            InventoryRepository inventoryRepository,
                            ProductRepository productRepository,
                            OrderItemRepository orderItemRepository,
                            WarehouseRepository warehouseRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.warehouseRepository = warehouseRepository;
    }

    // ========== ADMIN DASHBOARD ==========
    public Map<String, Object> getDashboardStats() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        long totalOrders = orders.size();
        long pendingOrders = orders.stream().filter(o -> "pending".equals(o.getStatus())).count();

        double totalRevenue = orders.stream().mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0).sum();

        List<Invoice> invoices = invoiceRepository.findAll();
        double outstanding = invoices.stream()
                .filter(i -> !"paid".equals(i.getPaymentStatus()))
                .mapToDouble(i -> i.getTotalAmount() - i.getAmountPaid())
                .sum();

        long totalCustomers = customerRepository.count();
        long lowStockProducts = inventoryRepository.countByAvailableQuantityLessThanReorderLevel();

        // ✅ Map recent orders using repository lookups (no direct relationships)
        List<Map<String, Object>> recentOrders = orders.stream().limit(5)
                .map(this::orderToSafeMap)
                .collect(Collectors.toList());

        // Sales chart mock
        List<Map<String, Object>> salesChart = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
        for (String month : months) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", month);
            point.put("sales", Math.random() * 50000 + 30000);
            point.put("orders", (int)(Math.random() * 30 + 40));
            salesChart.add(point);
        }

        List<Map<String, Object>> categoryData = Arrays.asList(
                Map.of("name", "Fast Moving", "value", 35),
                Map.of("name", "Regular", "value", 40),
                Map.of("name", "Seasonal", "value", 15),
                Map.of("name", "Slow Moving", "value", 10)
        );

        Map<String, Object> result = new HashMap<>();
        result.put("totalOrders", totalOrders);
        result.put("pendingOrders", pendingOrders);
        result.put("totalRevenue", totalRevenue);
        result.put("outstandingPayments", outstanding);
        result.put("totalCustomers", totalCustomers);
        result.put("lowStockProducts", lowStockProducts);
        result.put("monthlyGrowth", 12.5);
        result.put("recentOrders", recentOrders);
        result.put("topProducts", Collections.emptyList());
        result.put("salesChart", salesChart);
        result.put("categoryData", categoryData);
        return result;
    }

    // ========== CUSTOMER DASHBOARD ==========
    public Map<String, Object> getCustomerDashboard(UUID userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Customer not found for user: " + userId));

        UUID customerId = customer.getId();

        List<Order> orders = orderRepository.findByCustomerId(customerId);
        int totalOrders = orders.size();
        long pendingOrders = orders.stream()
                .filter(o -> "pending".equals(o.getStatus()) || "confirmed".equals(o.getStatus()))
                .count();

        double totalSpent = orders.stream()
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum();

        List<Invoice> invoices = invoiceRepository.findByCustomerId(customerId);
        double outstanding = invoices.stream()
                .filter(i -> !"paid".equals(i.getPaymentStatus()))
                .mapToDouble(i -> i.getTotalAmount() - i.getAmountPaid())
                .sum();

        // ✅ Map recent orders using repository lookups
        List<Map<String, Object>> recentOrders = orders.stream().limit(5)
                .map(this::orderToSafeMap)
                .collect(Collectors.toList());

        // ✅ Map customer to safe map
        Map<String, Object> customerMap = new HashMap<>();
        customerMap.put("id", customer.getId());
        customerMap.put("companyName", customer.getCompanyName());
        customerMap.put("email", customer.getEmail());
        customerMap.put("phone", customer.getPhone());

        Map<String, Object> result = new HashMap<>();
        result.put("totalOrders", totalOrders);
        result.put("pendingOrders", pendingOrders);
        result.put("totalRevenue", totalSpent);
        result.put("outstandingPayments", outstanding);
        result.put("totalCustomers", 1);
        result.put("lowStockProducts", 0);
        result.put("monthlyGrowth", 0);
        result.put("recentOrders", recentOrders);
        result.put("topProducts", Collections.emptyList());
        result.put("customer", customerMap);
        return result;
    }

    // ---------- Helper: Convert Order to safe Map (no relationships) ----------
    private Map<String, Object> orderToSafeMap(Order order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("orderNumber", order.getOrderNumber());
        map.put("status", order.getStatus());
        map.put("totalAmount", order.getTotalAmount());
        map.put("orderDate", order.getOrderDate());
        map.put("requiredDate", order.getRequiredDate());
        map.put("priority", order.getPriority());
        map.put("notes", order.getNotes());

        // Fetch customer via repository
        if (order.getCustomerId() != null) {
            Customer customer = customerRepository.findById(order.getCustomerId()).orElse(null);
            if (customer != null) {
                Map<String, Object> customerInfo = new HashMap<>();
                customerInfo.put("id", customer.getId());
                customerInfo.put("companyName", customer.getCompanyName());
                customerInfo.put("email", customer.getEmail());
                map.put("customer", customerInfo);
            }
        }

        // Fetch warehouse via repository
        if (order.getWarehouseId() != null) {
            Warehouse warehouse = warehouseRepository.findById(order.getWarehouseId()).orElse(null);
            if (warehouse != null) {
                Map<String, Object> warehouseInfo = new HashMap<>();
                warehouseInfo.put("id", warehouse.getId());
                warehouseInfo.put("name", warehouse.getName());
                map.put("warehouse", warehouseInfo);
            }
        }

        // Fetch order items count via repository
        if (order.getId() != null) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            map.put("itemCount", items.size());
        }

        return map;
    }

    // ---------- Existing chart & product methods ----------
    public List<Map<String, Object>> getSalesChartData(String period) {
        List<Map<String, Object>> chart = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
        for (String month : months) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", month);
            point.put("sales", Math.random() * 50000 + 30000);
            point.put("orders", (int)(Math.random() * 30 + 40));
            chart.add(point);
        }
        return chart;
    }

    public List<Map<String, Object>> getTopProducts(int limit) {
        return Arrays.asList(
                Map.of("name", "Battery Cell A", "sold", 128, "revenue", 28400),
                Map.of("name", "Brake Pad Set", "sold", 96, "revenue", 19200),
                Map.of("name", "Oil Filter X", "sold", 84, "revenue", 16800),
                Map.of("name", "Spark Plug Pro", "sold", 72, "revenue", 14400)
        );
    }
}