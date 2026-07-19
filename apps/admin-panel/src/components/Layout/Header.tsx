import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':  { title: 'Dashboard',              subtitle: 'Platform overview & analytics' },
  '/users':      { title: 'User Management',         subtitle: 'Browse and manage all platform users' },
  '/wallets':    { title: 'Wallet Management',       subtitle: 'Monitor user balances and wallet activity' },
  '/pending':    { title: 'Pending Transactions',    subtitle: 'Review and action pending deposit/withdrawal requests' },
  '/categories': { title: 'Category Management',     subtitle: 'Manage scrap item categories' },
};

const Header: React.FC = () => {
  const location = useLocation();
  const info = pageTitles[location.pathname] || { title: 'RaddiGo Admin', subtitle: '' };
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header style={{
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(15, 15, 26, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {info.title}
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{info.subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Live clock */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          fontSize: '0.78rem', color: 'var(--text-muted)',
        }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{time}</span>
          <span>{date}</span>
        </div>

        {/* Status dot */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: 'rgba(0, 230, 118, 0.08)',
          border: '1px solid rgba(0, 230, 118, 0.25)',
          borderRadius: 99,
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--accent)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--accent)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          System Live
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
};

export default Header;
