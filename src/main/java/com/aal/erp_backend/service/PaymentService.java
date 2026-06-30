package com.aal.erp_backend.service;

import com.aal.erp_backend.dto.CustomerSummaryDTO;
import com.aal.erp_backend.dto.PaymentResponseDTO;
import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.entity.Invoice;
import com.aal.erp_backend.entity.Payment;
import com.aal.erp_backend.entity.User;
import com.aal.erp_backend.repository.CustomerRepository;
import com.aal.erp_backend.repository.InvoiceRepository;
import com.aal.erp_backend.repository.PaymentRepository;
import com.aal.erp_backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository,
                          InvoiceRepository invoiceRepository,
                          CustomerRepository customerRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ---------- SAFE DTO CONVERSION ----------
    private PaymentResponseDTO convertToDTO(Payment payment) {
        try {
            PaymentResponseDTO dto = new PaymentResponseDTO();
            dto.setId(payment.getId());
            dto.setPaymentNumber(payment.getPaymentNumber() != null ? payment.getPaymentNumber() : "N/A");
            dto.setInvoiceId(payment.getInvoiceId());
            dto.setCustomerId(payment.getCustomerId());
            dto.setAmount(payment.getAmount() != null ? payment.getAmount() : 0.0);
            dto.setPaymentDate(payment.getPaymentDate());
            dto.setPaymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "N/A");
            dto.setReferenceNumber(payment.getReferenceNumber());
            dto.setBankName(payment.getBankName());
            dto.setNotes(payment.getNotes());
            dto.setStatus(payment.getStatus() != null ? payment.getStatus() : "unknown");
            dto.setReceivedBy(payment.getReceivedBy());
            dto.setCreatedAt(payment.getCreatedAt());

            // Invoice number
            if (payment.getInvoiceId() != null) {
                try {
                    Invoice invoice = invoiceRepository.findById(payment.getInvoiceId()).orElse(null);
                    if (invoice != null) {
                        dto.setInvoiceNumber(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "N/A");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to fetch invoice for payment " + payment.getId() + ": " + e.getMessage());
                }
            }

            // Customer details
            if (payment.getCustomerId() != null) {
                try {
                    Customer customer = customerRepository.findById(payment.getCustomerId()).orElse(null);
                    if (customer != null) {
                        CustomerSummaryDTO customerDTO = new CustomerSummaryDTO();
                        customerDTO.setId(customer.getId());
                        customerDTO.setCompanyName(customer.getCompanyName() != null ? customer.getCompanyName() : "N/A");
                        customerDTO.setEmail(customer.getEmail());
                        dto.setCustomer(customerDTO);
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to fetch customer for payment " + payment.getId() + ": " + e.getMessage());
                }
            }

            return dto;
        } catch (Exception e) {
            System.err.println("❌ Critical error converting payment " + payment.getId() + ": " + e.getMessage());
            e.printStackTrace();
            PaymentResponseDTO fallback = new PaymentResponseDTO();
            fallback.setId(payment.getId());
            fallback.setPaymentNumber("ERROR");
            fallback.setAmount(0.0);
            fallback.setStatus("error");
            return fallback;
        }
    }

    // ---------- GET PAYMENTS (entity) ----------
    public Page<Payment> getPayments(UUID customerId, Pageable pageable) {
        try {
            if (customerId != null) {
                return paymentRepository.findByCustomerId(customerId, pageable);
            }
            return paymentRepository.findAll(pageable);
        } catch (Exception e) {
            System.err.println("❌ Error fetching payments: " + e.getMessage());
            e.printStackTrace();
            return Page.empty(pageable);
        }
    }

    // ---------- GET PAYMENTS (DTO) ----------
    public Page<PaymentResponseDTO> getPaymentsDTO(UUID customerId, Pageable pageable) {
        try {
            Page<Payment> paymentPage = getPayments(customerId, pageable);
            List<PaymentResponseDTO> dtoList = new ArrayList<>();
            for (Payment payment : paymentPage.getContent()) {
                try {
                    dtoList.add(convertToDTO(payment));
                } catch (Exception e) {
                    System.err.println("⚠️ Skipping payment " + payment.getId() + ": " + e.getMessage());
                    PaymentResponseDTO fallback = new PaymentResponseDTO();
                    fallback.setId(payment.getId());
                    fallback.setPaymentNumber("ERROR");
                    fallback.setAmount(0.0);
                    fallback.setStatus("error");
                    dtoList.add(fallback);
                }
            }
            return new PageImpl<>(dtoList, pageable, paymentPage.getTotalElements());
        } catch (Exception e) {
            System.err.println("❌ Fatal error in getPaymentsDTO: " + e.getMessage());
            e.printStackTrace();
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }
    }

    // ---------- CREATE PAYMENT ----------
    @Transactional
    public Payment createPayment(UUID invoiceId, UUID customerId, Double amount,
                                 String paymentMethod, String referenceNumber,
                                 String bankName, String notes) {

        if (customerId == null) {
            throw new IllegalArgumentException("Customer ID is required");
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setPaymentNumber("PAY-" + Instant.now().getEpochSecond());
        payment.setInvoiceId(invoiceId);
        payment.setCustomerId(customerId);
        payment.setAmount(amount);
        payment.setPaymentDate(Instant.now());
        payment.setPaymentMethod(paymentMethod != null ? paymentMethod : "bank_transfer");
        payment.setReferenceNumber(referenceNumber);
        payment.setBankName(bankName);
        payment.setNotes(notes);
        payment.setStatus("completed");
        payment.setReceivedBy(customer.getUserId());
        payment.setCreatedAt(Instant.now());

        payment = paymentRepository.save(payment);

        // Update invoice payment status
        if (invoiceId != null) {
            Invoice invoice = invoiceRepository.findById(invoiceId)
                    .orElseThrow(() -> new RuntimeException("Invoice not found"));
            double newPaid = (invoice.getAmountPaid() != null ? invoice.getAmountPaid() : 0) + amount;
            invoice.setAmountPaid(newPaid);
            if (newPaid >= (invoice.getTotalAmount() != null ? invoice.getTotalAmount() : 0)) {
                invoice.setPaymentStatus("paid");
            } else if (newPaid > 0) {
                invoice.setPaymentStatus("partial");
            }
            invoice.setUpdatedAt(Instant.now());
            invoiceRepository.save(invoice);
        }

        // Update customer outstanding
        double currentOutstanding = customer.getCurrentOutstanding() != null ? customer.getCurrentOutstanding() : 0;
        customer.setCurrentOutstanding(Math.max(0, currentOutstanding - amount));
        customer.setUpdatedAt(Instant.now());
        customerRepository.save(customer);

        // Notify admins
        try {
            List<User> admins = userRepository.findByRole("admin");
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        "New Payment Received",
                        "Payment " + payment.getPaymentNumber() + " of " + amount + " from " + customer.getCompanyName() + " has been received.",
                        "payment",
                        payment.getId().toString()
                );
            }
            System.out.println("📧 Payment notifications sent to admins.");
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send admin notifications: " + e.getMessage());
            e.printStackTrace();
        }

        // ✅ Return the created payment
        return payment;
    }
}