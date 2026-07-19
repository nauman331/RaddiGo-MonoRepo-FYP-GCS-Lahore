import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'accent' | 'purple' | 'amber' | 'red' | 'blue';
  trend?: { value: number; label: string };
}

const colorMap = {
  accent:  { border: 'rgba(0,230,118,0.3)',  bg: 'rgba(0,230,118,0.08)',  text: '#00e676' },
  purple:  { border: 'rgba(124,92,252,0.3)', bg: 'rgba(124,92,252,0.08)', text: '#7c5cfc' },
  amber:   { border: 'rgba(255,179,0,0.3)',  bg: 'rgba(255,179,0,0.08)',  text: '#ffb300' },
  red:     { border: 'rgba(255,77,109,0.3)', bg: 'rgba(255,77,109,0.08)', text: '#ff4d6d' },
  blue:    { border: 'rgba(77,184,255,0.3)', bg: 'rgba(77,184,255,0.08)', text: '#4db8ff' },
};

const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon, color = 'accent', trend
}) => {
  const c = colorMap[color];
  return (
    <div
      className="card"
      style={{
        borderColor: c.border,
        background: `linear-gradient(135deg, var(--bg-card) 0%, ${c.bg} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100,
        background: c.text,
        opacity: 0.06,
        borderRadius: '50%',
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
        <div style={{
          width: 40, height: 40,
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          {icon}
        </div>
      </div>

      <div style={{ fontSize: '2rem', fontWeight: 800, color: c.text, lineHeight: 1.1, marginBottom: 4 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
      )}
      {trend && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginTop: 12, fontSize: '0.78rem', fontWeight: 600,
          color: trend.value >= 0 ? '#00e676' : '#ff4d6d',
        }}>
          <span>{trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
