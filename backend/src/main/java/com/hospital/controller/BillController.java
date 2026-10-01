package com.hospital.controller;

import com.hospital.dto.BillDto;
import com.hospital.entity.*;
import com.hospital.exception.BadRequestException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.*;
import com.hospital.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AdmissionRepository admissionRepository;

    @GetMapping
    public List<Bill> getAllBills(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
                return billRepository.findByPatientId(patient.getId());
            }
        }
        return billRepository.findAll();
    }

    @GetMapping("/{id}")
    public Bill getBillById(@PathVariable Long id, Authentication authentication) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));
        verifyPatientAccess(bill.getPatient().getId(), authentication);
        return bill;
    }

    @GetMapping("/patient/{patientId}")
    public List<Bill> getBillsByPatient(@PathVariable Long patientId, Authentication authentication) {
        verifyPatientAccess(patientId, authentication);
        return billRepository.findByPatientId(patientId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public Bill generateBill(@Valid @RequestBody BillDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));

        Admission admission = null;
        if (dto.getAdmissionId() != null) {
            admission = admissionRepository.findById(dto.getAdmissionId()).orElse(null);
        }

        Bill bill = new Bill(patient, admission, dto.getConsultationFee(), dto.getMedicineFee(),
                dto.getLabFee(), dto.getRoomFee(), dto.getOtherCharges(), dto.getNotes());

        return billRepository.save(bill);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public Bill updateBill(@PathVariable Long id, @RequestBody BillDto dto) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));

        if (dto.getConsultationFee() != null) bill.setConsultationFee(dto.getConsultationFee());
        if (dto.getMedicineFee() != null) bill.setMedicineFee(dto.getMedicineFee());
        if (dto.getLabFee() != null) bill.setLabFee(dto.getLabFee());
        if (dto.getRoomFee() != null) bill.setRoomFee(dto.getRoomFee());
        if (dto.getOtherCharges() != null) bill.setOtherCharges(dto.getOtherCharges());
        if (dto.getNotes() != null) bill.setNotes(dto.getNotes());

        return billRepository.save(bill);
    }

    private void verifyPatientAccess(Long patientId, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new BadRequestException("Patient profile not found"));
                if (!patient.getId().equals(patientId)) {
                    throw new BadRequestException("Access denied: You can only view your own bills.");
                }
            }
        }
    }
}
