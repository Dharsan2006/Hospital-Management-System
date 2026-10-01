# Complete Hospital Management System (HMS)

A full-stack, enterprise-grade **Hospital Management System (HMS)** engineered with **React.js**, **Spring Boot**, **Spring Data JPA**, **Spring Security (JWT)**, and **PostgreSQL**.

---

## 🏗 System Architecture

```text
React (Vite)  ──[ Axios REST APIs ]──>  Spring Boot 3.2 (Java 21)  ──[ Spring Data JPA ]──>  PostgreSQL Database
```

---

## 🚀 Key Modules & Business Logic

1. **Authentication & Authorization**: Role-based access control (RBAC) with BCrypt password hashing and JWT Bearer Tokens.
2. **Patient Management**: Complete demographic, emergency contact, and clinical history tracking. Patient role enforces strict self-data isolation (**Patients access ONLY their own data**).
3. **Doctor Management**: Specializations, experience years, consultation fees, department mapping, and weekly available days.
4. **Department Management**: Hospital divisions (Cardiology, Neurology, Orthopedics, Pediatrics, General Medicine).
5. **Appointment Management**: Booking engine with duplicate slot prevention (`existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot`). Status transitions: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`.
6. **Medical Records**: Doctor-recorded symptoms, diagnosis, treatment plan, and clinical notes.
7. **Prescription Management**: Multi-item drug prescriptions (Dosage, Frequency, Duration, Quantity, Instructions). Pharmacist dispensing with **automatic inventory reduction & negative stock prevention**.
8. **Medicine & Pharmacy**: Inventory tracking with real-time low-stock alerts.
9. **Lab Tests & Results**: Diagnostic requisitions & result tracking with normal range comparisons. Statuses: `REQUESTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
10. **Patient Admission & Discharge**: Inpatient room allocation, discharge summary recording, and **automatic room status updates** (`AVAILABLE` <-> `OCCUPIED`).
11. **Rooms & Beds**: Inpatient capacity management across `GENERAL`, `PRIVATE`, `ICU`, and `SEMI_PRIVATE` room types.
12. **Billing & Payments**: Automated total calculation:
    $$\text{Total} = \text{Consultation Fee} + \text{Medicine Fee} + \text{Lab Fee} + \text{Room Fee} + \text{Other Charges}$$
    Tracks paid vs remaining balances. Prevents payment greater than remaining balance. Payment methods: `CASH`, `CARD`, `UPI`.
13. **Role-Based Dashboards**: Customized metric cards, quick shortcuts, recent appointments, and operational summary views for all 6 roles (`ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PATIENT`, `PHARMACIST`).

---

## 🔑 Demo Accounts

All demo accounts are seeded automatically on first startup via `DataSeeder.java`.

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `Admin@123` | Full administrative control across all entities & user management |
| **DOCTOR** | `doctor@example.com` | `Admin@123` | Appointments, patients, diagnoses, prescriptions, lab requests |
| **NURSE** | `nurse@example.com` | `Admin@123` | Patient vitals, room management, admissions & discharge assistance |
| **RECEPTIONIST** | `receptionist@example.com` | `Admin@123` | Patient registration, appointments, room booking & invoice generation |
| **PATIENT** | `patient@example.com` | `Admin@123` | Personal profile, book appointments, medical history, bills & payments |
| **PHARMACIST** | `pharmacist@example.com` | `Admin@123` | Pharmacy inventory, low-stock alerts & prescription dispensing |

---

## 🛠 Database & Environment Setup

### 1. PostgreSQL Database Setup
Ensure PostgreSQL is installed and running on port `5432`. Create the target database:

```sql
CREATE DATABASE hospital_management;
```

### 2. Environment Variables (`.env` / `application.properties`)
```properties
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_management
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

---

## ⚡ How to Run

### Step 1: Start Backend (Spring Boot)

```bash
cd backend
mvn clean install
mvn spring-boot:run
```
*Backend API server will start on `http://localhost:8080`.*

### Step 2: Start Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
*Frontend application will launch on `http://localhost:5173`.*

---

## 📡 REST API Summary

- `POST /api/auth/login` - User Login (JWT)
- `POST /api/auth/register` - User Registration
- `GET /api/users` - User Account List (Admin)
- `GET /api/patients` - Patients Directory
- `GET /api/doctors` - Doctors Directory
- `GET /api/departments` - Departments List
- `GET /api/appointments` - Bookings List & Scheduling
- `POST /api/appointments` - Book Appointment
- `GET /api/medical-records` - Diagnostic Records
- `POST /api/prescriptions` - Issue Doctor Prescription
- `PUT /api/prescriptions/{id}/dispense` - Dispense Drug & Deduct Inventory
- `GET /api/medicines` - Pharmacy Inventory
- `GET /api/lab-tests/results` - Diagnostic Test Results
- `POST /api/admissions` - Admit Inpatient
- `PUT /api/admissions/{id}/discharge` - Discharge Inpatient
- `GET /api/bills` - Invoices & Billing
- `POST /api/payments` - Process Bill Payment
