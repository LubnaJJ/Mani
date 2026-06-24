import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Category, ApiResponse } from '../../types';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { error?: string } } };
    return e.response?.data?.error ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  id: string;
  name: string;
  slug: string;
}

const CLOSED: ModalState = { open: false, mode: 'add', id: '', name: '', slug: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(CLOSED);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Category[]>>('/categories');
      setCategories(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setModal({ open: true, mode: 'add', id: '', name: '', slug: '' });
    setModalError('');
  }

  function openEdit(cat: Category) {
    setModal({ open: true, mode: 'edit', id: cat.id, name: cat.name, slug: cat.slug });
    setModalError('');
  }

  function closeModal() {
    setModal(CLOSED);
    setModalError('');
  }

  function handleNameChange(name: string) {
    setModal((prev) => ({
      ...prev,
      name,
      slug: prev.mode === 'add' ? toSlug(name) : prev.slug,
    }));
  }

  async function handleSave() {
    if (!modal.name.trim() || !modal.slug.trim()) {
      setModalError('Both fields are required.');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      if (modal.mode === 'add') {
        await api.post('/categories', { name: modal.name.trim(), slug: modal.slug.trim() });
      } else {
        await api.put(`/categories/${modal.id}`, {
          name: modal.name.trim(),
          slug: modal.slug.trim(),
        });
      }
      closeModal();
      await load();
    } catch (err) {
      setModalError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // deletion failed — row stays, user can retry
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="p-4 sm:p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8 sm:mb-12 border-b border-border pb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">Categories</h1>
        <button onClick={openAdd} className="btn-primary">
          + Add Category
        </button>
      </div>

      {/* Table */}
      <div className="border border-border overflow-x-auto">
        <div className="min-w-[400px]">
        {/* Table head */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-0 border-b border-border bg-surface">
          {['Name', 'Slug', 'Actions'].map((h) => (
            <div key={h} className="px-6 py-3">
              <span className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
                {h}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] border-b border-border last:border-0">
              <div className="px-6 py-4"><div className="h-4 w-32 bg-surface animate-pulse" /></div>
              <div className="px-6 py-4"><div className="h-4 w-24 bg-surface animate-pulse" /></div>
              <div className="px-6 py-4"><div className="h-4 w-20 bg-surface animate-pulse" /></div>
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-body text-sm text-ink-3">No categories yet.</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-[1fr_1fr_auto] border-b border-border last:border-0 hover:bg-surface transition-colors duration-150"
            >
              <div className="px-6 py-4 flex items-center">
                <span className="font-body text-sm text-ink">{cat.name}</span>
              </div>
              <div className="px-6 py-4 flex items-center">
                <span className="font-body text-sm text-ink-2">{cat.slug}</span>
              </div>
              <div className="px-6 py-4 flex items-center gap-4">
                {confirmDeleteId === cat.id ? (
                  <>
                    <span className="font-body text-[11px] text-ink-2">Delete?</span>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="font-body text-[11px] text-accent-dark hover:opacity-70 transition-opacity"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="font-body text-[11px] text-ink-3 hover:text-ink-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(cat)}
                      className="font-body text-[11px] tracking-[0.1em] text-ink-2 hover:text-ink transition-colors duration-150"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(cat.id)}
                      className="font-body text-[11px] tracking-[0.1em] text-ink-3 hover:text-accent-dark transition-colors duration-150"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full sm:max-w-md bg-bg border border-border">
            {/* Modal header */}
            <div className="px-8 py-5 border-b border-border flex items-center justify-between">
              <p className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
                {modal.mode === 'add' ? 'Add Category' : 'Edit Category'}
              </p>
              <button
                onClick={closeModal}
                className="font-body text-ink-3 hover:text-ink transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="px-8 py-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase">
                  Name
                </label>
                <input
                  type="text"
                  value={modal.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors duration-200"
                  placeholder="e.g. Rings"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase">
                  Slug
                </label>
                <input
                  type="text"
                  value={modal.slug}
                  onChange={(e) => setModal((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors duration-200"
                  placeholder="e.g. rings"
                />
                <p className="font-body text-[10px] text-ink-3">
                  Auto-generated from name. Lowercase letters, numbers, hyphens only.
                </p>
              </div>

              {modalError && (
                <p className="font-body text-xs text-accent-dark">{modalError}</p>
              )}

              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  onClick={closeModal}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
