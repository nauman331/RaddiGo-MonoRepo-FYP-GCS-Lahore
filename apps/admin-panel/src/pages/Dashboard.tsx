import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/ui/StatCard';
import { getAllWallets } from '../api/wallets';
import { getPendingTransactions } from '../api/wallets';
import { getCategories } from '../api/categories';
import type { IWallet, ITransaction, ICategory } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [pending, setPending] = useState<ITransaction[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllWallets().catch(() => []),
      getPendingTransactions().catch(() => []),
      getCategories(1, 100).then((r) => r.categories).catch(() => []),
    ]).then(([w, p, c]) => {
      setWallets(w as IWallet[]);
      setPending(p as ITransaction[]);
      setCategories(c as ICategory[]);
      setLoading(false);
    });
  }, []);

  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(String(w.balance) || '0'), 0);
  const pendingDeposits = pending.filter((t) => t.type === 'deposit').length;
  const pendingWithdrawals = pending.filter((t) => t.type === 'withdrawal').length;

  // Mock chart data — replace with real data when analytics endpoint available
  const balanceData = [
    { day: 'Mon', balance: 12000 },
    { day: 'Tue', balance: 13500 },
    { day: 'Wed', balance: 11800 },
    { day: 'Thu', balance: 15200 },
    { day: 'Fri', balance: 14000 },
    { day: 'Sat', balance: 17800 },
    { day: 'Sun', balance: totalBalance || 16500 },
  ];

  const txnData = [
    { name: 'Deposits', value: pendingDeposits || 5 },
    { name: 'Withdrawals', value: pendingWithdrawals || 3 },
    { name: 'Approved', value: 18 },
    { name: 'Rejected', value: 2 },
  ];

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Welcome back 👋</h2>
          <p className="page-subtitle">Here's what's happening on RaddiGo today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={wallets.length}
          subtitle="Registered wallet holders"
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Total Balance"
          value={`₨${totalBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Combined platform balance"
          icon="💰"
          color="accent"
        />
        <StatCard
          title="Pending Transactions"
          value={pending.length}
          subtitle={`${pendingDeposits} deposits · ${pendingWithdrawals} withdrawals`}
          icon="⏳"
          color="amber"
        />
        <StatCard
          title="Categories"
          value={categories.length}
          subtitle="Active scrap categories"
          icon="🗂️"
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 28 }}>
        {/* Area chart */}
        <div className="card">
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Platform Balance Trend</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Last 7 days</p>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 99,
              background: 'var(--accent-glow)', color: 'var(--accent)',
              fontSize: '0.75rem', fontWeight: 700,
            }}>
              ₨ PKR
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={balanceData}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e676" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#555875', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555875', fontSize: 11 }} axisLine={false} tickLine={false} width={60}
                tickFormatter={(v: number) => `₨${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8eaf6' }}
                formatter={(v: number) => [`₨${v.toLocaleString()}`, 'Balance']}
              />
              <Area type="monotone" dataKey="balance" stroke="#00e676" strokeWidth={2} fill="url(#balanceGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Transaction Summary</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Current status</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={txnData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#555875', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555875', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8eaf6' }}
              />
              <Bar dataKey="value" fill="#7c5cfc" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions + recent wallets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Quick actions */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '⏳', label: 'Review Pending Transactions', count: pending.length, path: '/pending', color: 'var(--amber)' },
              { icon: '👥', label: 'View All Users', count: wallets.length, path: '/users', color: 'var(--blue)' },
              { icon: '🗂️', label: 'Manage Categories', count: categories.length, path: '/categories', color: 'var(--purple)' },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.2rem' }}>{action.icon}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</span>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 99,
                  background: 'var(--bg-card)',
                  fontSize: '0.78rem', fontWeight: 700,
                  color: action.color,
                }}>
                  {action.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent wallets */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Top Wallets</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/wallets')}>View All →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...wallets]
              .sort((a, b) => parseFloat(String(b.balance)) - parseFloat(String(a.balance)))
              .slice(0, 5)
              .map((w, i) => (
                <div key={w.user_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `hsl(${(w.user_id * 47) % 360}, 60%, 45%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                    }}>
                      {w.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{w.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.email}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)' }}>
                    ₨{parseFloat(String(w.balance)).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            {wallets.length === 0 && (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <span className="empty-icon">💰</span>
                <span>No wallet data available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
