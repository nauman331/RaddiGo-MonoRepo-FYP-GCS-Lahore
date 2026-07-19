import React, { useEffect, useState } from 'react';
import { getAllWallets, getUserWallet } from '../api/wallets';
import Modal from '../components/ui/Modal';
import type { IWallet, IWalletDetail, ITransaction } from '../types';

const fmt = (v: string | number) =>
  `₨${parseFloat(String(v)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

const Users: React.FC = () => {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [filtered, setFiltered] = useState<IWallet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [selected, setSelected] = useState<IWallet | null>(null);
  const [detail, setDetail] = useState<{ wallet: IWalletDetail; transactions: ITransaction[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getAllWallets()
      .then((data) => { setWallets(data); setFiltered(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      wallets.filter(
        (w) =>
          w.username?.toLowerCase().includes(q) ||
          w.email?.toLowerCase().includes(q) ||
          w.phone?.toLowerCase().includes(q)
      )
    );
  }, [search, wallets]);

  const openDetail = async (w: IWallet) => {
    setSelected(w);
    setDetailLoading(true);
    try {
      const d = await getUserWallet(w.user_id);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => { setSelected(null); setDetail(null); };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">{wallets.length} registered users on the platform</p>
        </div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            id="users-search"
            className="input"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /><span>Loading users…</span></div>
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
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    No users found
                  </td></tr>
                ) : (
                  filtered.map((w, i) => (
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
                        <span style={{
                          fontWeight: 700,
                          color: parseFloat(String(w.balance)) > 0 ? 'var(--accent)' : 'var(--text-muted)',
                        }}>
                          {fmt(w.balance)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(w.updated_at).toLocaleDateString('en-PK')}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openDetail(w)}
                          id={`view-user-${w.user_id}`}
                        >
                          View Wallet →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={closeModal} title={`${selected?.username}'s Wallet`} maxWidth={560}>
        {detailLoading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : detail ? (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 12, marginBottom: 24,
            }}>
              {[
                { label: 'User ID', value: detail.wallet.user_id },
                { label: 'Balance', value: fmt(detail.wallet.balance) },
                { label: 'Email', value: selected?.email },
                { label: 'Phone', value: selected?.phone },
              ].map((row) => (
                <div key={row.label} style={{
                  padding: 14, borderRadius: 10,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {row.label}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{String(row.value)}</div>
                </div>
              ))}
            </div>

            <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Recent Transactions ({detail.transactions.length})
            </h4>
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detail.transactions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 20 }}>No transactions yet</p>
              ) : detail.transactions.slice(0, 20).map((t) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.1rem' }}>{t.type === 'deposit' ? '⬆️' : '⬇️'}</span>
                    <div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, textTransform: 'capitalize' }}>{t.type}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(t.created_at).toLocaleString('en-PK')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: t.type === 'deposit' ? 'var(--accent)' : 'var(--red)' }}>
                      {t.type === 'deposit' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                    <span className={`badge badge-${t.status === 'approved' ? 'success' : t.status === 'rejected' ? 'danger' : 'warning'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Failed to load wallet details.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default Users;
