import React, { useEffect, useState } from 'react';
import { getUsers, updateUser, toggleUserStatus, deleteUser } from '../api/users';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import type { IUser } from '../types';
import { Search, Edit, Trash2, ShieldBan, ShieldCheck } from 'lucide-react';

const Users: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<IUser[]>([]);
  const [filtered, setFiltered] = useState<IUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editUser, setEditUser] = useState<IUser | null>(null);
  const [editForm, setEditForm] = useState({ username: '', phone: '', role: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<IUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  const handleToggleStatus = async (user: IUser) => {
    try {
      await toggleUserStatus(user.id, !user.isActive);
      showToast(`User ${user.username} has been ${!user.isActive ? 'activated' : 'deactivated'}`, 'success');
      loadUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to toggle status', 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSaving(true);
    try {
      await updateUser(editUser.id, editForm);
      showToast('User updated successfully', 'success');
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      showToast('User deleted successfully', 'success');
      setDeleteTarget(null);
      loadUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">{users.length} registered users on the platform</p>
        </div>
        <div className="search-bar">
          <span className="search-icon"><Search size={18} /></span>
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
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    No users found
                  </td></tr>
                ) : (
                  filtered.map((u, i) => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: `hsl(${(u.id * 47) % 360}, 55%, 40%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.85rem', color: '#fff', flexShrink: 0,
                          }}>
                            {u.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, display: 'block' }}>{u.username}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span className="badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${u.isActive ? 'success' : 'danger'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                        {!u.isVerified && (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Unverified Email
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-PK') : 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px' }}
                            title="Edit"
                            onClick={() => {
                              setEditUser(u);
                              setEditForm({ username: u.username, phone: u.phone, role: u.role });
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px', color: u.isActive ? 'var(--warning)' : 'var(--success)' }}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.isActive ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px', color: 'var(--red)' }}
                            title="Delete"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <form onSubmit={handleSaveEdit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Username</label>
            <input
              className="input"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Phone</label>
            <input
              className="input"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Role</label>
            <select
              className="input"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              required
            >
              <option value="customer">Customer</option>
              <option value="collector">Collector</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
            Are you sure you want to delete <strong>{deleteTarget?.username}</strong>?
          </p>
          <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>
            This action cannot be undone. Users with existing wallets or orders cannot be deleted.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: 'var(--red)', color: '#fff' }}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete User'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
