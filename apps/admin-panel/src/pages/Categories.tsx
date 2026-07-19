import React, { useEffect, useState, useCallback } from 'react';
import { getCategories, createCategory, deleteCategory } from '../api/categories';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import type { ICategory } from '../types';
import { Search, FolderOpen, Trash2, Plus, Recycle } from 'lucide-react';

const Categories: React.FC = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newNameEng, setNewNameEng] = useState('');
  const [newNameUrdu, setNewNameUrdu] = useState('');
  const [newRate, setNewRate] = useState<number | ''>('');
  const [newLogo, setNewLogo] = useState('');
  const [creating, setCreating] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { categories: cats } = await getCategories(1, 100);
      setCategories(cats);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameEng.trim() || !newNameUrdu.trim() || newRate === '') { showToast('Name and Rate are required', 'error'); return; }
    setCreating(true);
    try {
      await createCategory(newNameEng.trim(), newNameUrdu.trim(), Number(newRate), newLogo.trim() || undefined);
      showToast(`Category "${newNameEng}" created successfully!`, 'success');
      setNewNameEng(''); setNewNameUrdu(''); setNewRate(''); setNewLogo(''); setShowCreate(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create category';
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      showToast(`Category "${deleteTarget.nameEng}" deleted`, 'info');
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete category';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter((c) => c.nameEng?.toLowerCase().includes(search.toLowerCase()));

  const categoryColors = [
    '#00e676', '#7c5cfc', '#4db8ff', '#ffb300', '#ff4d6d',
    '#00bcd4', '#ff6b35', '#a8d8a8', '#ffd93d', '#c678dd',
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Categories</h2>
          <p className="page-subtitle">{categories.length} scrap categories available</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ maxWidth: 260 }}>
            <span className="search-icon"><Search size={18} /></span>
            <input
              id="categories-search"
              className="input"
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            id="create-category-btn"
            className="btn btn-primary"
            onClick={() => { setShowCreate(true); setNewNameEng(''); setNewNameUrdu(''); setNewRate(''); setNewLogo(''); }}
          >
            <Plus size={16} style={{ marginRight: 6 }} /> New Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /><span>Loading categories…</span></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FolderOpen size={48} opacity={0.4} />
            <h3 style={{ color: 'var(--text-primary)' }}>{search ? 'No results found' : 'No Categories Yet'}</h3>
            <p>{search ? 'Try a different search term.' : 'Create the first scrap category to get started.'}</p>
            {!search && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 12 }}>
                <Plus size={16} style={{ marginRight: 6 }} /> Create Category
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {filtered.map((cat, i) => {
            const color = categoryColors[i % categoryColors.length];
            return (
              <div
                key={cat.id}
                className="card"
                style={{
                  padding: 20,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  textAlign: 'center', gap: 14, position: 'relative',
                  borderColor: `${color}30`,
                  transition: 'all 0.22s ease',
                  cursor: 'default',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = `${color}60`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 30px ${color}20`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = `${color}30`;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                {/* Logo or placeholder */}
                <div style={{
                  width: 64, height: 64,
                  borderRadius: 16,
                  background: `${color}18`,
                  border: `1.5px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem',
                  overflow: 'hidden',
                }}>
                  {cat.categoryLogo ? (
                    <img
                      src={cat.categoryLogo}
                      alt={cat.nameEng}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : <Recycle size={28} opacity={0.4} />}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                    {cat.nameEng}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {cat.id}</div>
                </div>

                <button
                  id={`delete-cat-${cat.id}`}
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', padding: '7px 0', marginTop: 4 }}
                  onClick={() => setDeleteTarget(cat)}
                >
                  <Trash2 size={16} style={{ marginRight: 6 }} /> Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Category">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cat-name-eng">Category Name (English) *</label>
            <input
              id="cat-name-eng"
              className="input"
              placeholder="e.g. Plastic Bottles"
              value={newNameEng}
              onChange={(e) => setNewNameEng(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cat-name-urdu">Category Name (Urdu) *</label>
            <input
              id="cat-name-urdu"
              className="input"
              placeholder="e.g. پلاسٹک کی بوتلیں"
              value={newNameUrdu}
              onChange={(e) => setNewNameUrdu(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cat-rate">Rate (Rs) *</label>
            <input
              id="cat-rate"
              type="number"
              className="input"
              placeholder="e.g. 50"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cat-logo">Logo URL (optional)</label>
            <input
              id="cat-logo"
              className="input"
              placeholder="https://example.com/icon.png"
              value={newLogo}
              onChange={(e) => setNewLogo(e.target.value)}
            />
            {newLogo && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={newLogo}
                  alt="preview"
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button
              id="confirm-create-category-btn"
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={creating}
            >
              {creating ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creating…</> : <><Plus size={16} style={{ marginRight: 6 }} /> Create Category</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category" maxWidth={400}>
        {deleteTarget && (
          <div>
            <div style={{
              padding: 16, borderRadius: 10,
              background: 'rgba(255, 77, 109, 0.08)',
              border: '1px solid rgba(255, 77, 109, 0.3)',
              marginBottom: 20, textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteTarget.nameEng}"</strong>?<br />
                This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                id="confirm-delete-category-btn"
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Deleting…</> : <><Trash2 size={16} style={{ marginRight: 6 }} /> Delete</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Categories;
