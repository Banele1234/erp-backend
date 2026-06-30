package com.aal.erp_backend.service;

import com.aal.erp_backend.entity.Customer;
import com.aal.erp_backend.entity.Invoice;
import com.aal.erp_backend.entity.Order;
import com.aal.erp_backend.repository.InvoiceRepository;
import com.aal.erp_backend.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, CustomerRepository customerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
    }

    public Page<Invoice> getInvoices(int page, int limit, String paymentStatus, UUID customerId, UUID currentUserId, boolean isAdmin) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());

        if (!isAdmin) {
            Customer customer = customerRepository.findByUserId(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Customer not found for this user"));
            customerId = customer.getId();
        }

        if (customerId != null) {
            if (paymentStatus != null && !paymentStatus.isEmpty()) {
                return invoiceRepository.findByCustomerIdAndPaymentStatus(customerId, paymentStatus, pageable);
            }
            return invoiceRepository.findByCustomerId(customerId, pageable);
        }

        if (paymentStatus != null && !paymentStatus.isEmpty()) {
            return invoiceRepository.findByPaymentStatus(paymentStatus, pageable);
        }
        return invoiceRepository.findAll(pageable);
    }

    // ✅ Creates invoice from order
    public Invoice createInvoiceFromOrder(Order order, UUID userId) {
        Invoice invoice = new Invoice();
        invoice.setId(UUID.randomUUID());
        invoice.setOrderId(order.getId());
        invoice.setCustomerId(order.getCustomerId());
        invoice.setInvoiceNumber("INV-" + Instant.now().getEpochSecond());
        invoice.setInvoiceDate(Instant.now());        // ✅ correct field name
        invoice.setDueDate(Instant.now().plus(30, ChronoUnit.DAYS));
        invoice.setTotalAmount(order.getTotalAmount());
        invoice.setAmountPaid(0.0);
        invoice.setPaymentStatus("pending");
        invoice.setCreatedAt(Instant.now());
        return invoiceRepository.save(invoice);
    }
}