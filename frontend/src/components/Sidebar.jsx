import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, UserCheck, Stethoscope, Building2, 
  Calendar, FileText, Pill, FlaskConical, BedDouble, 
  DoorOpen, Receipt, CreditCard 
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST'] },
    { label: 'User Management', path: '/users', icon: Users, roles: ['ADMIN'] },
    { label: 'Patients', path: '/patients', icon: UserCheck, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST'] },
    { label: 'Departments', path: '/departments', icon: Building2, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST'] },
    { label: 'Appointments', path: '/appointments', icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'] },
    { label: 'Medical Records', path: '/medical-records', icon: FileText, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    { label: 'Prescriptions', path: '/prescriptions', icon: Pill, roles: ['ADMIN', 'DOCTOR', 'PHARMACIST', 'PATIENT'] },
    { label: 'Pharmacy & Medicines', path: '/medicines', icon: Pill, roles: ['ADMIN', 'PHARMACIST', 'DOCTOR'] },
    { label: 'Lab Tests & Results', path: '/lab-tests', icon: FlaskConical, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    { label: 'Rooms & Beds', path: '/rooms', icon: BedDouble, roles: ['ADMIN', 'NURSE', 'RECEPTIONIST'] },
    { label: 'Admissions', path: '/admissions', icon: DoorOpen, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'] },
    { label: 'Billing', path: '/billing', icon: Receipt, roles: ['ADMIN', 'RECEPTIONIST', 'PATIENT'] },
    { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['ADMIN', 'RECEPTIONIST', 'PATIENT'] }
  ];

  return (
    <aside className="sidebar">
      {navItems
        .filter(item => item.roles.includes(role))
        .map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
    </aside>
  );
};
