import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'DOCTOR': return 'badge-doctor';
      case 'NURSE': return 'badge-nurse';
      case 'RECEPTIONIST': return 'badge-receptionist';
      case 'PATIENT': return 'badge-patient';
      case 'PHARMACIST': return 'badge-pharmacist';
      default: return 'badge-info';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Activity size={28} color="#06b6d4" />
        <span>AURA HOSPITAL HMS</span>
      </div>

      {user && (
        <div className="user-profile">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.fullName}</div>
            <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={logout} title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};
