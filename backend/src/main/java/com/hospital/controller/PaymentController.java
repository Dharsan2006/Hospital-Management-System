package com.hospital.controller;

import com.hospital.dto.PaymentDto;
import com.hospital.entity.*;
import com.hospital.exception.BadRequestException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.*;
import com.hospital.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private PatientRepository patientRepository;

    @GetMapping
    public List<Payment> getAllPayments(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
                return paymentRepository.findByPatientId(patient.getId());
            }
        }
        return paymentRepository.findAll();
    }

    @GetMapping("/bill/{billId}")
    public List<Payment> getPaymentsByBill(@PathVariable Long billId, Authentication authentication) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));
        verifyPatientAccess(bill.getPatient().getId(), authentication);
        return paymentRepository.findByBillId(billId);
    }

    @PostMapping
    @Transactional
    public Payment processPayment(@Valid @RequestBody PaymentDto dto, Authentication authentication) {
        Bill bill = billRepository.findById(dto.getBillId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + dto.getBillId()));

        verifyPatientAccess(bill.getPatient().getId(), authentication);

        if (dto.getAmount() <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero.");
        }

        // Rule: Do not allow payment greater than remaining balance
        if (dto.getAmount() > bill.getRemainingAmount()) {
            throw new BadRequestException("Payment amount ($" + dto.getAmount() + ") cannot exceed remaining bill balance ($" + bill.getRemainingAmount() + ").");
        }

        String txnId = dto.getTransactionId() != null && !dto.getTransactionId().isBlank() ?
                dto.getTransactionId() : "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = new Payment(bill, bill.getPatient(), dto.getAmount(), dto.getPaymentMethod(), txnId, dto.getRemarks());

        // Update Bill Paid Amount
        bill.setPaidAmount(bill.getPaidAmount() + dto.getAmount());
        billRepository.save(bill);

        return paymentRepository.save(payment);
    }

    private void verifyPatientAccess(Long patientId, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new BadRequestException("Patient profile not found"));
                if (!patient.getId().equals(patientId)) {
                    throw new BadRequestException("Access denied: You can only process/view payments for your own bills.");
                }
            }
        }
    }
}
