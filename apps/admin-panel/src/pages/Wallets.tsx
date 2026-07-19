import React, { useEffect, useState } from 'react';
import { getAllWallets } from '../api/wallets';
import type { IWallet } from '../types';

const fmt = (v: string | number) =>
  `₨${parseFloat(String(v)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

const Wallets: React.FC = () => {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [filtered, setFiltered] = useState<IWallet[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'balance_asc' | 'date_desc'>('balance_desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllWallets()
      .then((d) => { setWallets(d); setFiltered(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let list = wallets.filter(
      (w) =>
        w.username?.toLowerCase().includes(q) ||
        w.email?.toLowerCase().includes(q)
    );
    if (sortBy === 'balance_desc') list = [...list].sort((a, b) => parseFloat(String(b.balance)) - parseFloat(String(a.balance)));
    if (sortBy === 'balance_asc') list = [...list].sort((a, b) => parseFloat(String(a.balance)) - parseFloat(String(b.balance)));
    if (sortBy === 'date_desc') list = [...list].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    setFiltered(list);
  }, [search, wallets, sortBy]);

  const totalBalance = wallets.reduce((s, w) => s + parseFloat(String(w.balance) || '0'), 0);
  const avgBalance = wallets.length ? totalBalance / wallets.length : 0;
  const maxBalance = wallets.length ? Math.max(...wallets.map((w) => parseFloat(String(w.balance)))) : 0;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Wallets</h2>
          <p className="page-subtitle">{wallets.length} active wallets · Total: {fmt(totalBalance)}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Balance', value: fmt(totalBalance), icon: '💎', color: 'var(--accent)' },
          { label: 'Average Balance', value: fmt(avgBalance), icon: '📊', color: 'var(--blue)' },
          { label: 'Highest Balance', value: fmt(maxBalance), icon: '🏆', color: 'var(--amber)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input
            id="wallets-search"
            className="input"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="wallets-sort"
          className="input"
          style={{ width: 200 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
        >
          <option value="balance_desc">Highest Balance First</option>
          <option value="balance_asc">Lowest Balance First</option>
          <option value="date_desc">Recently Updated</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /><span>Loading wallets…</span></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Balance</th>
                  <th>Balance Bar</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No wallets found</td></tr>
                ) : (
                  filtered.map((w, i) => {
                    const bal = parseFloat(String(w.balance));
                    const pct = maxBalance > 0 ? (bal / maxBalance) * 100 : 0;
                    return (
                      <tr key={w.user_id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: `hsl(${(w.user_id * 47) % 360}, 55%, 40%)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.85rem', color: '#fff', flexShrink: 0,
                            }}>
                              {w.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span style={{ fontWeight: 600 }}>{w.username}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{w.email}</td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{w.phone}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: bal > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {fmt(bal)}
                          </span>
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <div style={{
                            height: 6, borderRadius: 99, background: 'var(--bg-elevated)',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', width: `${pct}%`, borderRadius: 99,
                              background: 'linear-gradient(90deg, var(--accent), var(--accent-dim))',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {new Date(w.updated_at).toLocaleDateString('en-PK')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallets;
