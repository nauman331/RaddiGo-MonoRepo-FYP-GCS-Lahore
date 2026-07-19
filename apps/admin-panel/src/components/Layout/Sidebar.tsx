import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard',    icon: '📊' },
  { path: '/users',     label: 'Users',         icon: '👥' },
  { path: '/wallets',   label: 'Wallets',       icon: '💰' },
  { path: '/pending',   label: 'Pending Txns',  icon: '⏳' },
  { path: '/categories',label: 'Categories',    icon: '🗂️' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition)',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '20px 14px' : '20px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 72,
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--accent), #00a850)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0,
            }}>
              ♻️
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1 }}>
                RaddiGo
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em' }}>
                ADMIN PANEL
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--accent), #00a850)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
          }}>
            ♻️
          </div>
        )}
        <button
          onClick={onToggle}
          className="btn-icon"
          style={{ flexShrink: 0, marginLeft: collapsed ? 0 : 4 }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '12px 0' : '12px 14px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all var(--transition)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              borderLeft: isActive && !collapsed ? '3px solid var(--accent)' : '3px solid transparent',
            })}
            title={collapsed ? item.label : undefined}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && user && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            marginBottom: 8,
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              {user.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 6, padding: '2px 8px',
              background: 'var(--accent-glow)', borderRadius: 99,
              fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              ✦ Admin
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            fontSize: '0.85rem',
          }}
          title={collapsed ? 'Logout' : undefined}
        >
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
