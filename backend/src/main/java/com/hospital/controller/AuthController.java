package com.hospital.controller;

import com.hospital.dto.AuthRequest;
import com.hospital.dto.AuthResponse;
import com.hospital.dto.MessageResponse;
import com.hospital.dto.RegisterRequest;
import com.hospital.entity.*;
import com.hospital.exception.BadRequestException;
import com.hospital.repository.*;
import com.hospital.security.JwtUtils;
import com.hospital.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private NurseRepository nurseRepository;

    @Autowired
    private ReceptionistRepository receptionistRepository;

    @Autowired
    private PharmacistRepository pharmacistRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        AuthResponse response = new AuthResponse(jwt, userDetails.getId(), userDetails.getEmail(),
                userDetails.getFullName(), userDetails.getRole());

        attachRoleProfileIds(response, userDetails.getId(), userDetails.getRole());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new BadRequestException("Error: Email is already taken!");
        }

        Role userRole = signUpRequest.getRole() != null ? signUpRequest.getRole() : Role.PATIENT;

        User user = new User(signUpRequest.getEmail(),
                encoder.encode(signUpRequest.getPassword()),
                signUpRequest.getFullName(),
                signUpRequest.getPhone(),
                userRole);

        userRepository.save(user);

        // Create role-specific entity profiles
        switch (userRole) {
            case PATIENT:
                Patient patient = new Patient(user, signUpRequest.getDob(), signUpRequest.getGender(),
                        signUpRequest.getBloodGroup(), signUpRequest.getAddress(), signUpRequest.getEmergencyContact());
                patientRepository.save(patient);
                break;
            case DOCTOR:
                Department dept = signUpRequest.getDepartmentId() != null ?
                        departmentRepository.findById(signUpRequest.getDepartmentId()).orElse(null) : null;
                Doctor doctor = new Doctor(user, dept, signUpRequest.getSpecialization(),
                        signUpRequest.getQualification(), signUpRequest.getExperienceYears(),
                        signUpRequest.getConsultationFee(), signUpRequest.getAvailableDays());
                doctorRepository.save(doctor);
                break;
            case NURSE:
                Department nDept = signUpRequest.getDepartmentId() != null ?
                        departmentRepository.findById(signUpRequest.getDepartmentId()).orElse(null) : null;
                Nurse nurse = new Nurse(user, nDept, signUpRequest.getQualification(), signUpRequest.getShift());
                nurseRepository.save(nurse);
                break;
            case RECEPTIONIST:
                Receptionist receptionist = new Receptionist(user, signUpRequest.getDeskNumber());
                receptionistRepository.save(receptionist);
                break;
            case PHARMACIST:
                Pharmacist pharmacist = new Pharmacist(user, signUpRequest.getLicenseNumber());
                pharmacistRepository.save(pharmacist);
                break;
            case ADMIN:
                break;
        }

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(new MessageResponse("Unauthorized"));
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        AuthResponse response = new AuthResponse(null, user.getId(), user.getEmail(), user.getFullName(), user.getRole());
        attachRoleProfileIds(response, user.getId(), user.getRole());
        return ResponseEntity.ok(response);
    }

    private void attachRoleProfileIds(AuthResponse response, Long userId, Role role) {
        if (role == Role.PATIENT) {
            patientRepository.findByUserId(userId).ifPresent(p -> response.setPatientId(p.getId()));
        } else if (role == Role.DOCTOR) {
            doctorRepository.findByUserId(userId).ifPresent(d -> response.setDoctorId(d.getId()));
        } else if (role == Role.NURSE) {
            nurseRepository.findByUserId(userId).ifPresent(n -> response.setNurseId(n.getId()));
        } else if (role == Role.RECEPTIONIST) {
            receptionistRepository.findByUserId(userId).ifPresent(r -> response.setReceptionistId(r.getId()));
        } else if (role == Role.PHARMACIST) {
            pharmacistRepository.findByUserId(userId).ifPresent(ph -> response.setPharmacistId(ph.getId()));
        }
    }
}
