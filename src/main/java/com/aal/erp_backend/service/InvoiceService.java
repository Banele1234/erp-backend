package com.aal.erp_backend.service;

import com.aal.erp_backend.dto.CustomerSummaryDTO;
import com.aal.erp_backend.dto.InvoiceResponseDTO;
import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.entity.Invoice;
import com.aal.erp_backend.entity.Order;
import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.repository.CustomerRepository;
import com.aal.erp_backend.repository.InvoiceRepository;
import com.aal.erp_backend.repository.OrderRepository;
import com.aal.erp_backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          OrderRepository orderRepository,
                          UserRepository userRepository,
                          CustomerRepository customerRepository,
                          NotificationService notificationService) {
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.notificationService = notificationService;
    }

    // ---------- SAFE DTO CONVERSION ----------
    private InvoiceResponseDTO convertToDTO(Invoice invoice) {
        try {
            InvoiceResponseDTO dto = new InvoiceResponseDTO();
            dto.setId(invoice.getId());
            dto.setInvoiceNumber(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "N/A");
            dto.setOrderId(invoice.getOrderId());
            dto.setCustomerId(invoice.getCustomerId());
            dto.setInvoiceDate(invoice.getInvoiceDate());
            dto.setDueDate(invoice.getDueDate());
            dto.setSubtotal(invoice.getSubtotal() != null ? invoice.getSubtotal() : 0.0);
            dto.setDiscountAmount(invoice.getDiscountAmount() != null ? invoice.getDiscountAmount() : 0.0);
            dto.setTaxAmount(invoice.getTaxAmount() != null ? invoice.getTaxAmount() : 0.0);
            dto.setTotalAmount(invoice.getTotalAmount() != null ? invoice.getTotalAmount() : 0.0);
            dto.setAmountPaid(invoice.getAmountPaid() != null ? invoice.getAmountPaid() : 0.0);
            dto.setPaymentStatus(invoice.getPaymentStatus() != null ? invoice.getPaymentStatus() : "pending");
            dto.setNotes(invoice.getNotes());
            dto.setCreatedAt(invoice.getCreatedAt());
            dto.setUpdatedAt(invoice.getUpdatedAt());

            if (invoice.getCustomerId() != null) {
                Customer customer = customerRepository.findById(invoice.getCustomerId()).orElse(null);
                if (customer != null) {
                    CustomerSummaryDTO customerDTO = new CustomerSummaryDTO();
                    customerDTO.setId(customer.getId());
                    customerDTO.setCompanyName(customer.getCompanyName() != null ? customer.getCompanyName() : "N/A");
                    customerDTO.setEmail(customer.getEmail());
                    dto.setCustomer(customerDTO);
                }
            }
            return dto;
        } catch (Exception e) {
            System.err.println("❌ Failed to convert invoice " + invoice.getId() + ": " + e.getMessage());
            e.printStackTrace();
            InvoiceResponseDTO fallback = new InvoiceResponseDTO();
            fallback.setId(invoice.getId());
            fallback.setInvoiceNumber("ERROR");
            fallback.setTotalAmount(0.0);
            fallback.setPaymentStatus("error");
            return fallback;
        }
    }

    // ---------- GET INVOICES ----------
    public Page<Invoice> getInvoices(UUID customerId, String paymentStatus, Pageable pageable) {
        // Sanitize
        if (paymentStatus != null && ("undefined".equalsIgnoreCase(paymentStatus) || paymentStatus.isEmpty())) {
            paymentStatus = null;
        }
        System.out.println("🔍 InvoiceService.getInvoices: customerId=" + customerId + ", paymentStatus=" + paymentStatus);

        try {
            Page<Invoice> result;
            if (customerId != null && paymentStatus != null) {
                result = invoiceRepository.findByCustomerIdAndPaymentStatus(customerId, paymentStatus, pageable);
            } else if (customerId != null) {
                result = invoiceRepository.findByCustomerId(customerId, pageable);
            } else if (paymentStatus != null) {
                result = invoiceRepository.findByPaymentStatus(paymentStatus, pageable);
            } else {
                System.out.println("📊 Admin: fetching all invoices");
                result = invoiceRepository.findAll(pageable);
                System.out.println("📊 Found " + result.getTotalElements() + " total invoices");
            }
            return result;
        } catch (Exception e) {
            System.err.println("❌ Error in getInvoices: " + e.getMessage());
            e.printStackTrace();
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }
    }

    // ---------- GET INVOICES (DTO) – fully defensive ----------
    public Page<InvoiceResponseDTO> getInvoicesDTO(UUID customerId, String paymentStatus, Pageable pageable) {
        try {
            Page<Invoice> invoicePage = getInvoices(customerId, paymentStatus, pageable);
            List<InvoiceResponseDTO> dtoList = new ArrayList<>();
            for (Invoice invoice : invoicePage.getContent()) {
                try {
                    dtoList.add(convertToDTO(invoice));
                } catch (Exception e) {
                    System.err.println("⚠️ Skipping invoice " + invoice.getId() + " – using fallback: " + e.getMessage());
                    e.printStackTrace();
                    InvoiceResponseDTO fallback = new InvoiceResponseDTO();
                    fallback.setId(invoice.getId());
                    fallback.setInvoiceNumber("ERROR");
                    fallback.setTotalAmount(0.0);
                    fallback.setPaymentStatus("error");
                    dtoList.add(fallback);
                }
            }
            return new PageImpl<>(dtoList, pageable, invoicePage.getTotalElements());
        } catch (Exception e) {
            System.err.println("❌ Fatal error in getInvoicesDTO: " + e.getMessage());
            e.printStackTrace();
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }
    }

    // ---------- GET SINGLE INVOICE ----------
    public Invoice getInvoice(UUID id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
    }

    public InvoiceResponseDTO getInvoiceDTO(UUID id) {
        return convertToDTO(getInvoice(id));
    }

    // ---------- CREATE INVOICE ----------
    @Transactional
    public Invoice createInvoiceFromOrder(Order order, UUID userId) {
        return createInvoiceFromOrder(order, null, userId);
    }

    private Invoice createInvoiceFromOrder(Order order, Instant dueDate, UUID userId) {
        UUID orderId = order.getId();
        if (invoiceRepository.findByOrderId(orderId).isPresent()) {
            return invoiceRepository.findByOrderId(orderId).get();
        }

        String invoiceNumber = "INV-" + Instant.now().getEpochSecond();
        if (dueDate == null) {
            dueDate = Instant.now().plus(30, ChronoUnit.DAYS);
        }

        Invoice invoice = new Invoice();
        invoice.setId(UUID.randomUUID());
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setOrderId(orderId);
        invoice.setCustomerId(order.getCustomerId());
        invoice.setInvoiceDate(Instant.now());
        invoice.setDueDate(dueDate);
        invoice.setSubtotal(order.getSubtotal() != null ? order.getSubtotal() : 0.0);
        invoice.setDiscountAmount(order.getDiscountAmount() != null ? order.getDiscountAmount() : 0.0);
        invoice.setTaxAmount(order.getTaxAmount() != null ? order.getTaxAmount() : 0.0);
        invoice.setTotalAmount(order.getTotalAmount() != null ? order.getTotalAmount() : 0.0);
        invoice.setAmountPaid(0.0);
        invoice.setPaymentStatus("pending");
        invoice.setCreatedAt(Instant.now());
        invoice.setUpdatedAt(Instant.now());

        Invoice saved = invoiceRepository.save(invoice);
        System.out.println("✅ Invoice created: " + saved.getInvoiceNumber());

        if (userId != null) {
            try {
                notificationService.createNotification(
                        userId,
                        "Invoice Ready for Payment",
                        "Invoice " + invoice.getInvoiceNumber() + " for order " + order.getOrderNumber() + " is ready. Please pay.",
                        "invoice",
                        invoice.getId().toString()
                );
            } catch (Exception ignored) {}
        }
        return saved;
    }

    // ---------- MARK AS PAID ----------
    @Transactional
    public Invoice markAsPaid(UUID invoiceId) {
        Invoice invoice = getInvoice(invoiceId);
        if ("paid".equals(invoice.getPaymentStatus())) {
            throw new RuntimeException("Already paid");
        }
        invoice.setAmountPaid(invoice.getTotalAmount());
        invoice.setPaymentStatus("paid");
        invoice.setUpdatedAt(Instant.now());
        Invoice saved = invoiceRepository.save(invoice);

        try {
            List<User> admins = userRepository.findByRole("admin");
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        "Payment Received",
                        "Invoice " + invoice.getInvoiceNumber() + " for order " + invoice.getOrderId() + " has been paid.",
                        "payment",
                        invoice.getId().toString()
                );
            }
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send admin notifications: " + e.getMessage());
            e.printStackTrace();
        }
        return saved;
    }

    @Transactional
    public InvoiceResponseDTO payInvoiceAndReturnDTO(UUID invoiceId) {
        return convertToDTO(markAsPaid(invoiceId));
    }

    @Transactional
    public Invoice updatePaymentStatus(UUID invoiceId, double amountPaid) {
        Invoice invoice = getInvoice(invoiceId);
        double newTotalPaid = invoice.getAmountPaid() + amountPaid;
        invoice.setAmountPaid(newTotalPaid);
        if (newTotalPaid >= invoice.getTotalAmount()) {
            invoice.setPaymentStatus("paid");
            List<User> admins = userRepository.findByRole("admin");
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        "Payment Received",
                        "Invoice " + invoice.getInvoiceNumber() + " for order " + invoice.getOrderId() + " has been fully paid.",
                        "payment",
                        invoice.getId().toString()
                );
            }
        } else if (newTotalPaid > 0) {
            invoice.setPaymentStatus("partial");
        } else {
            invoice.setPaymentStatus("pending");
        }
        invoice.setUpdatedAt(Instant.now());
        return invoiceRepository.save(invoice);
    }
}