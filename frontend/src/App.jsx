import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleBasedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/UsersPage';
import { PatientsPage } from './pages/PatientsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { MedicalRecordsPage } from './pages/MedicalRecordsPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { LabTestsPage } from './pages/LabTestsPage';
import { RoomsPage } from './pages/RoomsPage';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { BillingPage } from './pages/BillingPage';
import { PaymentsPage } from './pages/PaymentsPage';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/doctors" element={<Layout><DoctorsPage /></Layout>} />
            <Route path="/departments" element={<Layout><DepartmentsPage /></Layout>} />
            <Route path="/appointments" element={<Layout><AppointmentsPage /></Layout>} />
            <Route path="/prescriptions" element={<Layout><PrescriptionsPage /></Layout>} />

            {/* Admin Only */}
            <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/users" element={<Layout><UsersPage /></Layout>} />
            </Route>

            {/* Admin, Doctor, Nurse, Receptionist */}
            <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']} />}>
              <Route path="/patients" element={<Layout><PatientsPage /></Layout>} />
            </Route>

            {/* Admin, Doctor, Nurse, Patient */}
            <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']} />}>
              <Route path="/medical-records" element={<Layout><MedicalRecordsPage /></Layout>} />
              <Route path="/lab-tests" element={<Layout><LabTestsPage /></Layout>} />
            </Route>

            {/* Pharmacist, Doctor, Admin */}
            <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'DOCTOR']} />}>
              <Route path="/medicines" element={<Layout><MedicinesPage /></Layout>} />
            </Route>

            {/* Rooms: Admin, Nurse, Receptionist */}
            <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'NURSE', 'RECEPTIONIST']} />}>
              <Route path="/rooms" element={<Layout><RoomsPage /></Layout>} />
            </Route>

            {/* Admissions */}
            <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']} />}>
              <Route path="/admissions" element={<Layout><AdmissionsPage /></Layout>} />
            </Route>

            {/* Billing & Payments */}
            <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'PATIENT']} />}>
              <Route path="/billing" element={<Layout><BillingPage /></Layout>} />
              <Route path="/payments" element={<Layout><PaymentsPage /></Layout>} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
