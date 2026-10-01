package com.hospital.controller;

import com.hospital.dto.AppointmentDto;
import com.hospital.entity.*;
import com.hospital.exception.BadRequestException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.*;
import com.hospital.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @GetMapping
    public List<Appointment> getAllAppointments(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
                return appointmentRepository.findByPatientId(patient.getId());
            } else if (userDetails.getRole() == Role.DOCTOR) {
                Doctor doctor = doctorRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
                return appointmentRepository.findByDoctorId(doctor.getId());
            }
        }
        return appointmentRepository.findAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> getAppointmentsByPatient(@PathVariable Long patientId, Authentication authentication) {
        verifyPatientAccess(patientId, authentication);
        return appointmentRepository.findByPatientId(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    @PostMapping
    public Appointment bookAppointment(@Valid @RequestBody AppointmentDto dto, Authentication authentication) {
        verifyPatientAccess(dto.getPatientId(), authentication);

        // Check duplicate booking rule
        boolean isConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                dto.getDoctorId(), dto.getAppointmentDate(), dto.getAppointmentTime(), AppointmentStatus.CANCELLED);

        if (isConflict) {
            throw new BadRequestException("The selected doctor already has an active appointment at this date and time. Please choose another time slot.");
        }

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));

        Department department = dto.getDepartmentId() != null ?
                departmentRepository.findById(dto.getDepartmentId()).orElse(doctor.getDepartment()) : doctor.getDepartment();

        Appointment appt = new Appointment();
        appt.setPatient(patient);
        appt.setDoctor(doctor);
        appt.setDepartment(department);
        appt.setAppointmentDate(dto.getAppointmentDate());
        appt.setAppointmentTime(dto.getAppointmentTime());
        appt.setReason(dto.getReason());
        appt.setNotes(dto.getNotes());
        appt.setStatus(dto.getStatus() != null ? dto.getStatus() : AppointmentStatus.PENDING);

        return appointmentRepository.save(appt);
    }

    @PutMapping("/{id}/status")
    public Appointment updateAppointmentStatus(@PathVariable Long id, @RequestParam AppointmentStatus status) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        appt.setStatus(status);
        return appointmentRepository.save(appt);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, Authentication authentication) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        verifyPatientAccess(appt.getPatient().getId(), authentication);
        appt.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appt);
        return ResponseEntity.ok().build();
    }

    private void verifyPatientAccess(Long patientId, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            if (userDetails.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(userDetails.getId())
                        .orElseThrow(() -> new BadRequestException("Patient profile not found"));
                if (!patient.getId().equals(patientId)) {
                    throw new BadRequestException("Access denied: You can only access your own appointments.");
                }
            }
        }
    }
}
