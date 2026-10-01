package com.hospital.config;

import com.hospital.entity.*;
import com.hospital.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private NurseRepository nurseRepository;

    @Autowired
    private ReceptionistRepository receptionistRepository;

    @Autowired
    private PharmacistRepository pharmacistRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private LabTestRepository labTestRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private LabTestResultRepository labTestResultRepository;

    @Autowired
    private AdmissionRepository admissionRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedDepartments();
        seedUsersAndProfiles();
        seedMedicines();
        seedRooms();
        seedLabTests();
        seedClinicalData();
    }

    private void seedDepartments() {
        if (departmentRepository.count() == 0) {
            departmentRepository.save(new Department("Cardiology", "Heart and Cardiovascular Care", "CARD", "Dr. Sarah Jenkins"));
            departmentRepository.save(new Department("Neurology", "Brain and Nervous System", "NEUR", "Dr. Michael Chen"));
            departmentRepository.save(new Department("Orthopedics", "Bone and Joint Care", "ORTH", "Dr. James Wilson"));
            departmentRepository.save(new Department("Pediatrics", "Children and Adolescent Health", "PED", "Dr. Emily Taylor"));
            departmentRepository.save(new Department("General Medicine", "Primary & Internal Healthcare", "GEN", "Dr. Robert Smith"));
        }
    }

    private void seedUsersAndProfiles() {
        String defaultPass = passwordEncoder.encode("Admin@123");

        // 1. Admin
        if (!userRepository.existsByEmail("admin@example.com")) {
            User adminUser = new User("admin@example.com", defaultPass, "System Administrator", "+1 555-0100", Role.ADMIN);
            userRepository.save(adminUser);
        }

        // 2. Doctor
        Doctor doctor = null;
        if (!userRepository.existsByEmail("doctor@example.com")) {
            User docUser = new User("doctor@example.com", defaultPass, "Dr. Robert Smith", "+1 555-0101", Role.DOCTOR);
            Department dept = departmentRepository.findByName("General Medicine").orElse(null);
            doctor = new Doctor(docUser, dept, "Cardiology & Internal Medicine", "MD, FACC", 12, 100.0, "Mon,Tue,Wed,Thu,Fri");
            doctorRepository.save(doctor);
        } else {
            doctor = doctorRepository.findByUserId(userRepository.findByEmail("doctor@example.com").get().getId()).orElse(null);
        }

        // 3. Nurse
        if (!userRepository.existsByEmail("nurse@example.com")) {
            User nurseUser = new User("nurse@example.com", defaultPass, "Nurse Clara Barton", "+1 555-0102", Role.NURSE);
            Department dept = departmentRepository.findByName("General Medicine").orElse(null);
            Nurse nurse = new Nurse(nurseUser, dept, "BSN, RN", "Day Shift (08:00 - 16:00)");
            nurseRepository.save(nurse);
        }

        // 4. Receptionist
        if (!userRepository.existsByEmail("receptionist@example.com")) {
            User recepUser = new User("receptionist@example.com", defaultPass, "Alice Johnson", "+1 555-0103", Role.RECEPTIONIST);
            Receptionist receptionist = new Receptionist(recepUser, "Desk 01 - Main Lobby");
            receptionistRepository.save(receptionist);
        }

        // 5. Patient
        Patient patient = null;
        if (!userRepository.existsByEmail("patient@example.com")) {
            User patientUser = new User("patient@example.com", defaultPass, "John Doe", "+1 555-0104", Role.PATIENT);
            patient = new Patient(patientUser, LocalDate.of(1990, 5, 15), "Male", "O+", "742 Evergreen Terrace, Springfield", "+1 555-9999");
            patientRepository.save(patient);
        } else {
            patient = patientRepository.findByUserId(userRepository.findByEmail("patient@example.com").get().getId()).orElse(null);
        }

        // 6. Pharmacist
        if (!userRepository.existsByEmail("pharmacist@example.com")) {
            User pharmUser = new User("pharmacist@example.com", defaultPass, "Mark Vance", "+1 555-0105", Role.PHARMACIST);
            Pharmacist pharmacist = new Pharmacist(pharmUser, "RPH-99201");
            pharmacistRepository.save(pharmacist);
        }
    }

    private void seedMedicines() {
        if (medicineRepository.count() == 0) {
            medicineRepository.save(new Medicine("Paracetamol 500mg", "Analgesic / Antipyretic", "PharmaCorp", 5.0, 150, "Tablet", LocalDate.now().plusYears(2)));
            medicineRepository.save(new Medicine("Amoxicillin 250mg", "Antibiotic", "MediHealth", 12.0, 100, "Capsule", LocalDate.now().plusYears(1)));
            medicineRepository.save(new Medicine("Ibuprofen 400mg", "NSAID", "BioPharma", 8.0, 80, "Tablet", LocalDate.now().plusYears(2)));
            medicineRepository.save(new Medicine("Metformin 500mg", "Antidiabetic", "LifeCare", 6.0, 200, "Tablet", LocalDate.now().plusYears(3)));
            medicineRepository.save(new Medicine("Atorvastatin 10mg", "Statin", "HeartCare", 15.0, 90, "Tablet", LocalDate.now().plusYears(2)));
        }
    }

    private void seedRooms() {
        if (roomRepository.count() == 0) {
            roomRepository.save(new Room("101", RoomType.GENERAL, 50.0, RoomStatus.AVAILABLE));
            roomRepository.save(new Room("102", RoomType.GENERAL, 50.0, RoomStatus.OCCUPIED));
            roomRepository.save(new Room("103", RoomType.SEMI_PRIVATE, 100.0, RoomStatus.AVAILABLE));
            roomRepository.save(new Room("201", RoomType.ICU, 300.0, RoomStatus.OCCUPIED));
            roomRepository.save(new Room("202", RoomType.PRIVATE, 200.0, RoomStatus.AVAILABLE));
        }
    }

    private void seedLabTests() {
        if (labTestRepository.count() == 0) {
            labTestRepository.save(new LabTest("Complete Blood Count (CBC)", "CBC-01", "Hematology", 25.0, "WBC: 4.5-11.0, RBC: 4.3-5.9", "Standard blood panel screening"));
            labTestRepository.save(new LabTest("Lipid Profile", "LIPID-01", "Biochemistry", 40.0, "Cholesterol < 200 mg/dL", "Evaluates blood fats and cholesterol"));
            labTestRepository.save(new LabTest("Fasting Blood Sugar (FBS)", "FBS-01", "Endocrinology", 15.0, "70-99 mg/dL", "Measures blood glucose fasting levels"));
            labTestRepository.save(new LabTest("Chest X-Ray", "CXR-01", "Radiology", 60.0, "Clear lung fields", "Imaging scan of thoracic cavity"));
        }
    }

    private void seedClinicalData() {
        if (appointmentRepository.count() == 0) {
            User patientUser = userRepository.findByEmail("patient@example.com").orElse(null);
            User docUser = userRepository.findByEmail("doctor@example.com").orElse(null);

            if (patientUser != null && docUser != null) {
                Patient patient = patientRepository.findByUserId(patientUser.getId()).orElse(null);
                Doctor doctor = doctorRepository.findByUserId(docUser.getId()).orElse(null);
                Department dept = departmentRepository.findByName("General Medicine").orElse(null);

                if (patient != null && doctor != null) {
                    // Appointment
                    Appointment appt = new Appointment(patient, doctor, dept, LocalDate.now().plusDays(1), LocalTime.of(10, 0), AppointmentStatus.CONFIRMED, "Routine health checkup and consultation", "Patient requested morning slot");
                    appointmentRepository.save(appt);

                    // Medical Record
                    MedicalRecord record = new MedicalRecord(patient, doctor, "Mild fever and sore throat for 2 days", "Acute Upper Respiratory Tract Infection", "Rest, hydration, and prescribed antibiotic course", "Follow up if symptoms persist after 5 days");
                    medicalRecordRepository.save(record);

                    // Prescription
                    Prescription prescription = new Prescription(record, patient, doctor, PrescriptionStatus.PENDING);
                    Medicine med1 = medicineRepository.findByName("Paracetamol 500mg").orElse(null);
                    Medicine med2 = medicineRepository.findByName("Amoxicillin 250mg").orElse(null);
                    if (med1 != null) {
                        prescription.addMedicine(new PrescriptionMedicine(med1, "500mg", "Thrice daily", "5 days", 15, "Take after food"));
                    }
                    if (med2 != null) {
                        prescription.addMedicine(new PrescriptionMedicine(med2, "250mg", "Twice daily", "5 days", 10, "Complete full course"));
                    }
                    prescriptionRepository.save(prescription);

                    // Lab Test Result
                    LabTest labTest = labTestRepository.findByCode("CBC-01").orElse(null);
                    if (labTest != null) {
                        LabTestResult ltr = new LabTestResult(patient, doctor, labTest, LabTestStatus.COMPLETED, "Slight elevation in WBC count consistent with mild infection");
                        ltr.setResultValue("WBC: 11.2 (Slightly High)");
                        ltr.setCompletedDate(LocalDateTime.now());
                        labTestResultRepository.save(ltr);
                    }

                    // Room & Admission
                    Room room = roomRepository.findByRoomNumber("102").orElse(null);
                    if (room != null) {
                        Admission admission = new Admission(patient, doctor, room, "Severe dehydration & high fever observation");
                        admissionRepository.save(admission);

                        // Bill & Payment
                        Bill bill = new Bill(patient, admission, 100.0, 37.0, 25.0, 100.0, 20.0, "Initial admission and treatment bill");
                        billRepository.save(bill);

                        Payment payment = new Payment(bill, patient, 100.0, PaymentMethod.CARD, "TXN-8849201", "Initial deposit payment");
                        bill.setPaidAmount(100.0);
                        billRepository.save(bill);
                        paymentRepository.save(payment);
                    }
                }
            }
        }
    }
}
