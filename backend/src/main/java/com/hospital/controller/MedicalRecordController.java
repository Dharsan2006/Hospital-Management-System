package com.hospital.controller;

import com.hospital.dto.MedicalRecordDto;
import com.hospital.entity.*;
import com.hospital.exception.BadRequestException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.MedicalRecordRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@CrossOrigin(origins = "*")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @GetMapping
    public List<MedicalRecord> getAllMedicalRecords(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
                return medicalRecordRepository.findByPatientId(patient.getId());
            } else if (userDetails.getRole() == Role.DOCTOR) {
                Doctor doctor = doctorRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
                return medicalRecordRepository.findByDoctorId(doctor.getId());
            }
        }
        return medicalRecordRepository.findAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<MedicalRecord> getMedicalRecordsByPatient(@PathVariable Long patientId, Authentication authentication) {
        verifyPatientAccess(patientId, authentication);
        return medicalRecordRepository.findByPatientId(patientId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public MedicalRecord createMedicalRecord(@Valid @RequestBody MedicalRecordDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));

        MedicalRecord record = new MedicalRecord(patient, doctor, dto.getSymptoms(), dto.getDiagnosis(), dto.getTreatment(), dto.getNotes());
        return medicalRecordRepository.save(record);
    }

    private void verifyPatientAccess(Long patientId, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new BadRequestException("Patient profile not found"));
                if (!patient.getId().equals(patientId)) {
                    throw new BadRequestException("Access denied: You can only view your own medical records.");
                }
            }
        }
    }
}
