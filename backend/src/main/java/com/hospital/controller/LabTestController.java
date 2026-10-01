package com.hospital.controller;

import com.hospital.dto.LabTestResultDto;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/lab-tests")
@CrossOrigin(origins = "*")
public class LabTestController {

    @Autowired
    private LabTestRepository labTestRepository;

    @Autowired
    private LabTestResultRepository labTestResultRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    // --- Lab Test Catalog ---

    @GetMapping
    public List<LabTest> getAllLabTests() {
        return labTestRepository.findAll();
    }

    @GetMapping("/{id}")
    public LabTest getLabTestById(@PathVariable Long id) {
        return labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public LabTest createLabTest(@Valid @RequestBody LabTest labTest) {
        return labTestRepository.save(labTest);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public LabTest updateLabTest(@PathVariable Long id, @Valid @RequestBody LabTest details) {
        LabTest lt = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + id));
        lt.setName(details.getName());
        lt.setCode(details.getCode());
        lt.setCategory(details.getCategory());
        lt.setPrice(details.getPrice());
        lt.setNormalRange(details.getNormalRange());
        lt.setDescription(details.getDescription());
        return labTestRepository.save(lt);
    }

    // --- Lab Test Requests & Results ---

    @GetMapping("/results")
    public List<LabTestResult> getAllLabTestResults(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
                return labTestResultRepository.findByPatientId(patient.getId());
            } else if (userDetails.getRole() == Role.DOCTOR) {
                Doctor doctor = doctorRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
                return labTestResultRepository.findByDoctorId(doctor.getId());
            }
        }
        return labTestResultRepository.findAll();
    }

    @GetMapping("/results/patient/{patientId}")
    public List<LabTestResult> getLabTestResultsByPatient(@PathVariable Long patientId, Authentication authentication) {
        verifyPatientAccess(patientId, authentication);
        return labTestResultRepository.findByPatientId(patientId);
    }

    @PostMapping("/results")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public LabTestResult requestLabTest(@Valid @RequestBody LabTestResultDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));
        LabTest labTest = labTestRepository.findById(dto.getLabTestId())
                .orElseThrow(() -> new ResourceNotFoundException("Lab test not found with id: " + dto.getLabTestId()));

        LabTestResult result = new LabTestResult(patient, doctor, labTest, LabTestStatus.REQUESTED, dto.getRemarks());
        return labTestResultRepository.save(result);
    }

    @PutMapping("/results/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public LabTestResult updateLabTestResult(@PathVariable Long id, @RequestBody LabTestResultDto dto) {
        LabTestResult result = labTestResultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab test result not found with id: " + id));

        if (dto.getStatus() != null) {
            result.setStatus(dto.getStatus());
            if (dto.getStatus() == LabTestStatus.COMPLETED && result.getCompletedDate() == null) {
                result.setCompletedDate(LocalDateTime.now());
            }
        }
        if (dto.getResultValue() != null) {
            result.setResultValue(dto.getResultValue());
        }
        if (dto.getNormalRange() != null) {
            result.setNormalRange(dto.getNormalRange());
        }
        if (dto.getRemarks() != null) {
            result.setRemarks(dto.getRemarks());
        }

        return labTestResultRepository.save(result);
    }

    private void verifyPatientAccess(Long patientId, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new BadRequestException("Patient profile not found"));
                if (!patient.getId().equals(patientId)) {
                    throw new BadRequestException("Access denied: You can only view your own lab test results.");
                }
            }
        }
    }
}
