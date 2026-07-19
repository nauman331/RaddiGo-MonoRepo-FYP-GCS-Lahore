import React, { useEffect, useState, useCallback } from 'react';
import { getPendingTransactions, approveTransaction, rejectTransaction } from '../api/wallets';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import type { ITransaction } from '../types';
import { List, ArrowUpCircle, ArrowDownCircle, RefreshCw, CheckCircle, Check, X } from 'lucide-react';

const fmt = (v: string | number) =>
  `₨${parseFloat(String(v)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

const PendingTransactions: React.FC = () => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<ITransaction | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingTransactions();
      setTransactions(data);
    } catch {
      showToast('Failed to load pending transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (tx: ITransaction) => {
    setActionLoading(tx.id);
    try {
      await approveTransaction(tx.id);
      showToast(`✅ Approved ₨${parseFloat(String(tx.amount)).toLocaleString()} ${tx.type} for ${tx.username}`, 'success');
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Approval failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      await rejectTransaction(rejectTarget.id, rejectNote || undefined);
      showToast(`❌ Rejected ${rejectTarget.type} for ${rejectTarget.username}`, 'info');
      setTransactions((prev) => prev.filter((t) => t.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectNote('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Rejection failed';
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const displayed = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);
  const deposits = transactions.filter((t) => t.type === 'deposit').length;
  const withdrawals = transactions.filter((t) => t.type === 'withdrawal').length;
  const totalAmount = transactions.reduce((s, t) => s + parseFloat(String(t.amount)), 0);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pending Transactions</h2>
          <p className="page-subtitle">{transactions.length} requests awaiting review</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading} id="refresh-pending-btn">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'all',        label: `All (${transactions.length})`,    icon: <List size={18} /> },
          { key: 'deposit',    label: `Deposits (${deposits})`,          icon: <ArrowUpCircle size={18} /> },
          { key: 'withdrawal', label: `Withdrawals (${withdrawals})`,    icon: <ArrowDownCircle size={18} /> },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className="btn"
            style={{
              background: filter === f.key ? 'var(--accent)' : 'var(--bg-elevated)',
              color: filter === f.key ? '#080810' : 'var(--text-secondary)',
              border: `1px solid ${filter === f.key ? 'var(--accent)' : 'var(--border)'}`,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.83rem',
            }}
          >
            <span style={{ display: 'flex' }}>{f.icon}</span> {f.label}
          </button>
        ))}
        <div style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.83rem', color: 'var(--text-muted)',
          padding: '8px 16px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
        }}>
          Total Value: <strong style={{ color: 'var(--amber)', marginLeft: 4 }}>{fmt(totalAmount)}</strong>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /><span>Loading transactions…</span></div>
      ) : displayed.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CheckCircle size={48} opacity={0.4} />
            <h3 style={{ color: 'var(--text-primary)' }}>All Clear!</h3>
            <p>No pending transactions to review.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayed.map((tx) => (
            <div
              key={tx.id}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16,
                borderLeft: `3px solid ${tx.type === 'deposit' ? 'var(--accent)' : 'var(--red)'}`,
              }}
            >
              {/* Left: type + user */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: tx.type === 'deposit' ? 'var(--accent-glow)' : 'var(--red-glow)',
                  border: `1px solid ${tx.type === 'deposit' ? 'rgba(0,230,118,0.3)' : 'rgba(255,77,109,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', flexShrink: 0,
                }}>
                  {tx.type === 'deposit' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize', marginBottom: 2 }}>
                    {tx.type}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                      #{tx.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <strong>{tx.username}</strong> · {tx.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(tx.created_at).toLocaleString('en-PK')}
                  </div>
                </div>
              </div>

              {/* Center: amount */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.4rem', fontWeight: 800,
                  color: tx.type === 'deposit' ? 'var(--accent)' : 'var(--red)',
                }}>
                  {tx.type === 'deposit' ? '+' : '-'}{fmt(tx.amount)}
                </div>
                <div className="badge badge-warning" style={{ marginTop: 6 }}>pending</div>
              </div>

              {/* Right: actions */}
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button
                  id={`approve-btn-${tx.id}`}
                  className="btn btn-primary btn-sm"
                  disabled={actionLoading === tx.id}
                  onClick={() => handleApprove(tx)}
                  style={{ padding: '9px 18px' }}
                >
                  {actionLoading === tx.id ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Check size={16} />} Approve
                </button>
                <button
                  id={`reject-btn-${tx.id}`}
                  className="btn btn-danger btn-sm"
                  disabled={actionLoading === tx.id}
                  onClick={() => { setRejectTarget(tx); setRejectNote(''); }}
                  style={{ padding: '9px 18px' }}
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject confirmation modal */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Transaction"
        maxWidth={440}
      >
        {rejectTarget && (
          <div>
            <div style={{
              padding: 16, borderRadius: 10,
              background: 'rgba(255, 77, 109, 0.08)',
              border: '1px solid rgba(255, 77, 109, 0.3)',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>You are rejecting:</div>
              <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: '1.2rem' }}>{fmt(rejectTarget.amount)} {rejectTarget.type}</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                User: {rejectTarget.username} ({rejectTarget.email})
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="reject-note">Rejection Note (optional)</label>
              <textarea
                id="reject-note"
                className="input"
                rows={3}
                placeholder="Reason for rejection…"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                style={{ resize: 'vertical', minHeight: 80 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setRejectTarget(null)}>
                Cancel
              </button>
              <button
                id="confirm-reject-btn"
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleReject}
                disabled={actionLoading === rejectTarget.id}
              >
                {actionLoading === rejectTarget.id
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Rejecting…</>
                  : <><X size={16} /> Confirm Reject</>
                }
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingTransactions;
