package com.hospital.controller;

import com.hospital.dto.PrescriptionDto;
import com.hospital.dto.PrescriptionItemDto;
import com.hospital.entity.*;
import com.hospital.exception.BadRequestException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.*;
import com.hospital.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @GetMapping
    public List<Prescription> getAllPrescriptions(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
                return prescriptionRepository.findByPatientId(patient.getId());
            } else if (userDetails.getRole() == Role.DOCTOR) {
                Doctor doctor = doctorRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
                return prescriptionRepository.findByDoctorId(doctor.getId());
            }
        }
        return prescriptionRepository.findAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Prescription> getPrescriptionsByPatient(@PathVariable Long patientId, Authentication authentication) {
        verifyPatientAccess(patientId, authentication);
        return prescriptionRepository.findByPatientId(patientId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Transactional
    public Prescription createPrescription(@Valid @RequestBody PrescriptionDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));

        MedicalRecord record = null;
        if (dto.getMedicalRecordId() != null) {
            record = medicalRecordRepository.findById(dto.getMedicalRecordId()).orElse(null);
        }

        Prescription prescription = new Prescription(record, patient, doctor, PrescriptionStatus.PENDING);

        if (dto.getMedicines() != null) {
            for (PrescriptionItemDto item : dto.getMedicines()) {
                Medicine medicine = medicineRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + item.getMedicineId()));
                PrescriptionMedicine pm = new PrescriptionMedicine(medicine, item.getDosage(), item.getFrequency(), item.getDuration(), item.getQuantity(), item.getInstructions());
                prescription.addMedicine(pm);
            }
        }

        return prescriptionRepository.save(prescription);
    }

    @PutMapping("/{id}/dispense")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    @Transactional
    public Prescription dispensePrescription(@PathVariable Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        if (prescription.getStatus() == PrescriptionStatus.DISPENSED) {
            throw new BadRequestException("Prescription is already dispensed.");
        }

        // Validate stock and deduct
        for (PrescriptionMedicine pm : prescription.getMedicines()) {
            Medicine med = pm.getMedicine();
            int requiredQty = pm.getQuantity() != null ? pm.getQuantity() : 1;
            if (med.getStockQuantity() < requiredQty) {
                throw new BadRequestException("Insufficient stock for medicine '" + med.getName() + "'. Available: " + med.getStockQuantity() + ", Required: " + requiredQty);
            }
            med.setStockQuantity(med.getStockQuantity() - requiredQty);
            medicineRepository.save(med);
        }

        prescription.setStatus(PrescriptionStatus.DISPENSED);
        return prescriptionRepository.save(prescription);
    }

    private void verifyPatientAccess(Long patientId, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new BadRequestException("Patient profile not found"));
                if (!patient.getId().equals(patientId)) {
                    throw new BadRequestException("Access denied: You can only view your own prescriptions.");
                }
            }
        }
    }
}
