import React from 'react';

export const DashboardCard = ({ title, value, subtitle, icon: Icon, color = '#2563eb' }) => {
  return (
    <div className="glass-panel metric-card">
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>{value}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>}
      </div>

      <div className="metric-icon" style={{ background: `${color}20`, color: color, border: `1px solid ${color}40` }}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );
};
