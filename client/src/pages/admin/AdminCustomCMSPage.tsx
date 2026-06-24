import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { BeadColor, Charm, ApiResponse } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { error?: string } } };
    return e.response?.data?.error ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}

const labelCls = 'font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase';
const inputCls =
  'w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors duration-150 placeholder:text-ink-3';

// ─── Default charms seeded when table is empty ────────────────────────────────

const DEFAULT_CHARMS: Array<{ name: string; icon_svg: string }> = [
  {
    name: 'Sakura',
    icon_svg:
      '<circle cx="13" cy="13" r="2" fill="currentColor" stroke="none"/><ellipse cx="13" cy="6" rx="2" ry="3.5" fill="currentColor" opacity="0.7"/><ellipse cx="13" cy="6" rx="2" ry="3.5" fill="currentColor" opacity="0.7" transform="rotate(72 13 13)"/><ellipse cx="13" cy="6" rx="2" ry="3.5" fill="currentColor" opacity="0.7" transform="rotate(144 13 13)"/><ellipse cx="13" cy="6" rx="2" ry="3.5" fill="currentColor" opacity="0.7" transform="rotate(216 13 13)"/><ellipse cx="13" cy="6" rx="2" ry="3.5" fill="currentColor" opacity="0.7" transform="rotate(288 13 13)"/>',
  },
  {
    name: 'Star',
    icon_svg:
      '<polygon points="13,2 15,9 22,9 16.5,13.5 18.5,21 13,16.5 7.5,21 9.5,13.5 4,9 11,9" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>',
  },
  {
    name: 'Heart',
    icon_svg:
      '<path d="M13 21S4 15 4 9c0-2.8 2.2-5 5-5 1.8 0 3.4 1 4 2.5C13.6 5 15.2 4 17 4c2.8 0 5 2.2 5 5 0 6-9 12-9 12Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    name: 'Moon',
    icon_svg:
      '<path d="M19 13c0 4.4-3.6 8-8 8-4.4 0-8-3.6-8-8 0-4.4 3.6-8 8-8-1.4 1.8-2.2 4-2.2 6.3 0 5.6 4.5 10 10 10 .7 0 1.4-.1 2.1-.3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  },
  {
    name: 'Butterfly',
    icon_svg:
      '<path d="M13 13C13 13 8 8 5 9.5S3 16 7 16s6-3 6-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 13C13 13 18 8 21 9.5s2 6.5-2 6.5-6-3-6-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 13C13 13 10 16 9.5 19s2 4 3.5 2.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 13C13 13 16 16 16.5 19s-2 4-3.5 2.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    name: 'Lotus',
    icon_svg:
      '<path d="M13 21c0 0-6-4-6-9 0-2.8 2.2-4 4-3 .9.5 1.7 1.8 2 3 .3-1.2 1.1-2.5 2-3 1.8-1 4 .2 4 3 0 5-6 9-6 9Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    name: 'Infinity',
    icon_svg:
      '<path d="M4 13c0-2.8 2.2-5 5-5s5 5 9 5 5-2.2 5-5-2.2-5-5-5-5 5-9 5-5 2.2-5 5Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  },
  {
    name: 'Initial Letter',
    icon_svg:
      '<rect x="5" y="5" width="16" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="9" y1="9" x2="9" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="17" y1="9" x2="17" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="13" x2="17" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  },
];

// ─── Bead Color Panel ─────────────────────────────────────────────────────────

interface BeadColorModalState {
  open: boolean;
  mode: 'add' | 'edit';
  id: string;
  name: string;
  hex_code: string;
  is_available: boolean;
}

const CLOSED_COLOR: BeadColorModalState = {
  open: false,
  mode: 'add',
  id: '',
  name: '',
  hex_code: '#',
  is_available: true,
};

function BeadColorPanel() {
  const [colors, setColors] = useState<BeadColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<BeadColorModalState>(CLOSED_COLOR);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<BeadColor[]>>('/bead-colors');
      setColors(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setModal({ open: true, mode: 'add', id: '', name: '', hex_code: '#', is_available: true });
    setModalError('');
  }

  function openEdit(c: BeadColor) {
    setModal({ open: true, mode: 'edit', id: c.id, name: c.name, hex_code: c.hex_code, is_available: c.is_available });
    setModalError('');
  }

  function closeModal() {
    setModal(CLOSED_COLOR);
    setModalError('');
  }

  async function handleSave() {
    if (!modal.name.trim()) { setModalError('Name is required.'); return; }
    if (!modal.hex_code.match(/^#[0-9A-Fa-f]{6}$/)) { setModalError('Enter a valid 6-digit hex code, e.g. #B5837A.'); return; }
    setSaving(true);
    setModalError('');
    try {
      const payload = { name: modal.name.trim(), hex_code: modal.hex_code, is_available: modal.is_available };
      if (modal.mode === 'add') {
        await api.post('/bead-colors', payload);
      } else {
        await api.put(`/bead-colors/${modal.id}`, payload);
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
      await api.delete(`/bead-colors/${id}`);
      setColors((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // deletion failed silently — item stays
    } finally {
      setConfirmDeleteId(null);
    }
  }

  async function handleToggleAvailable(color: BeadColor) {
    setTogglingId(color.id);
    try {
      const res = await api.put<ApiResponse<BeadColor>>(`/bead-colors/${color.id}`, {
        is_available: !color.is_available,
      });
      const updated = res.data.data!;
      setColors((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-baseline justify-between mb-6 pb-5 border-b border-border">
        <div>
          <h2 className="font-display text-2xl text-ink">Bead Colors</h2>
          <p className="font-body text-[11px] text-ink-3 mt-1">{colors.length} total</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-[11px]">
          + Add Color
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border p-4">
              <div className="w-10 h-10 rounded-full bg-surface animate-pulse mb-3" />
              <div className="h-3 w-20 bg-surface animate-pulse" />
            </div>
          ))}
        </div>
      ) : colors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-border border-dashed">
          <p className="font-body text-sm text-ink-3">No bead colors yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto">
          {colors.map((color) => (
            <div key={color.id} className="border border-border p-4 flex flex-col gap-3 hover:bg-surface transition-colors duration-150">
              {/* Swatch + name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: color.hex_code,
                    boxShadow:
                      color.hex_code.toLowerCase() === '#ede8e0'
                        ? 'inset 0 0 0 1px #d6d0c9'
                        : undefined,
                  }}
                />
                <div className="min-w-0">
                  <p className="font-body text-sm text-ink truncate">{color.name}</p>
                  <p className="font-body text-[11px] text-ink-3 tracking-[0.05em]">{color.hex_code}</p>
                </div>
              </div>

              {/* Available toggle */}
              <button
                type="button"
                onClick={() => handleToggleAvailable(color)}
                disabled={togglingId === color.id}
                className="flex items-center gap-2 disabled:opacity-40"
              >
                <div className={['relative w-9 h-5 transition-colors duration-200', color.is_available ? 'bg-ink' : 'bg-border'].join(' ')}>
                  <div
                    className={[
                      'absolute top-0.5 w-4 h-4 bg-bg shadow transition-all duration-200',
                      color.is_available ? 'left-[18px]' : 'left-0.5',
                    ].join(' ')}
                  />
                </div>
                <span className="font-body text-[10px] text-ink-3 tracking-[0.1em] uppercase">
                  {color.is_available ? 'Available' : 'Hidden'}
                </span>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1 border-t border-border">
                {confirmDeleteId === color.id ? (
                  <>
                    <span className="font-body text-[10px] text-ink-3">Delete?</span>
                    <button
                      onClick={() => handleDelete(color.id)}
                      className="font-body text-[10px] text-accent-dark hover:opacity-70 transition-opacity"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="font-body text-[10px] text-ink-3 hover:text-ink-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(color)}
                      className="font-body text-[10px] tracking-[0.1em] text-ink-2 hover:text-ink transition-colors duration-150"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(color.id)}
                      className="font-body text-[10px] tracking-[0.1em] text-ink-3 hover:text-accent-dark transition-colors duration-150"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-sm bg-bg border border-border">
            <div className="px-7 py-5 border-b border-border flex items-center justify-between">
              <p className={labelCls}>{modal.mode === 'add' ? 'Add Color' : 'Edit Color'}</p>
              <button onClick={closeModal} className="font-body text-ink-3 hover:text-ink transition-colors text-lg leading-none">
                ×
              </button>
            </div>

            <div className="px-7 py-7 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Name</label>
                <input
                  type="text"
                  autoFocus
                  value={modal.name}
                  onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. Rose Gold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Hex Code</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={modal.hex_code}
                    onChange={(e) => setModal((m) => ({ ...m, hex_code: e.target.value }))}
                    className={inputCls}
                    placeholder="#B5837A"
                    maxLength={7}
                  />
                  <div
                    className="w-10 h-10 flex-shrink-0 border border-border"
                    style={{
                      backgroundColor: modal.hex_code.match(/^#[0-9A-Fa-f]{6}$/)
                        ? modal.hex_code
                        : '#FAF8F5',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModal((m) => ({ ...m, is_available: !m.is_available }))}
                  className="flex items-center gap-2"
                >
                  <div className={['relative w-9 h-5 transition-colors duration-200', modal.is_available ? 'bg-ink' : 'bg-border'].join(' ')}>
                    <div
                      className={[
                        'absolute top-0.5 w-4 h-4 bg-bg shadow transition-all duration-200',
                        modal.is_available ? 'left-[18px]' : 'left-0.5',
                      ].join(' ')}
                    />
                  </div>
                </button>
                <span className={labelCls}>{modal.is_available ? 'Available' : 'Hidden'}</span>
              </div>

              {modalError && <p className="font-body text-xs text-accent-dark">{modalError}</p>}

              <div className="flex items-center justify-end gap-4 pt-2">
                <button onClick={closeModal} className="btn-outline">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-40">
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

// ─── Charm Panel ──────────────────────────────────────────────────────────────

interface CharmModalState {
  open: boolean;
  mode: 'add' | 'edit';
  id: string;
  name: string;
  icon_svg: string;
  is_available: boolean;
}

const CLOSED_CHARM: CharmModalState = {
  open: false,
  mode: 'add',
  id: '',
  name: '',
  icon_svg: '',
  is_available: true,
};

function CharmPanel() {
  const [charms, setCharms] = useState<Charm[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modal, setModal] = useState<CharmModalState>(CLOSED_CHARM);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Charm[]>>('/charms');
      const data = res.data.data ?? [];
      setCharms(data);
      if (data.length === 0 && !seededRef.current) {
        seededRef.current = true;
        await seed();
      }
    } finally {
      setLoading(false);
    }
  }

  async function seed() {
    setSeeding(true);
    try {
      await Promise.all(
        DEFAULT_CHARMS.map((c) =>
          api.post('/charms', { name: c.name, icon_svg: c.icon_svg, is_available: true })
        )
      );
      const res = await api.get<ApiResponse<Charm[]>>('/charms');
      setCharms(res.data.data ?? []);
    } finally {
      setSeeding(false);
    }
  }

  function openAdd() {
    setModal({ open: true, mode: 'add', id: '', name: '', icon_svg: '', is_available: true });
    setModalError('');
  }

  function openEdit(c: Charm) {
    setModal({ open: true, mode: 'edit', id: c.id, name: c.name, icon_svg: c.icon_svg, is_available: c.is_available });
    setModalError('');
  }

  function closeModal() {
    setModal(CLOSED_CHARM);
    setModalError('');
  }

  async function handleSave() {
    if (!modal.name.trim()) { setModalError('Name is required.'); return; }
    if (!modal.icon_svg.trim()) { setModalError('Icon SVG is required.'); return; }
    setSaving(true);
    setModalError('');
    try {
      const payload = { name: modal.name.trim(), icon_svg: modal.icon_svg.trim(), is_available: modal.is_available };
      if (modal.mode === 'add') {
        await api.post('/charms', payload);
      } else {
        await api.put(`/charms/${modal.id}`, payload);
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
      await api.delete(`/charms/${id}`);
      setCharms((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // deletion failed silently — item stays
    } finally {
      setConfirmDeleteId(null);
    }
  }

  async function handleToggleAvailable(charm: Charm) {
    setTogglingId(charm.id);
    try {
      const res = await api.put<ApiResponse<Charm>>(`/charms/${charm.id}`, {
        is_available: !charm.is_available,
      });
      const updated = res.data.data!;
      setCharms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } finally {
      setTogglingId(null);
    }
  }

  const isLoading = loading || seeding;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-baseline justify-between mb-6 pb-5 border-b border-border">
        <div>
          <h2 className="font-display text-2xl text-ink">Charms</h2>
          <p className="font-body text-[11px] text-ink-3 mt-1">{charms.length} total</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-[11px]">
          + Add Charm
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border p-4">
              <div className="w-10 h-10 bg-surface animate-pulse mb-3" />
              <div className="h-3 w-20 bg-surface animate-pulse" />
            </div>
          ))}
        </div>
      ) : charms.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-border border-dashed">
          <p className="font-body text-sm text-ink-3">No charms yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto">
          {charms.map((charm) => (
            <div key={charm.id} className="border border-border p-4 flex flex-col gap-3 hover:bg-surface transition-colors duration-150">
              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 26 26"
                  fill="none"
                  className="text-ink-2 flex-shrink-0"
                  dangerouslySetInnerHTML={{ __html: charm.icon_svg }}
                />
                <p className="font-body text-sm text-ink truncate">{charm.name}</p>
              </div>

              {/* Available toggle */}
              <button
                type="button"
                onClick={() => handleToggleAvailable(charm)}
                disabled={togglingId === charm.id}
                className="flex items-center gap-2 disabled:opacity-40"
              >
                <div className={['relative w-9 h-5 transition-colors duration-200', charm.is_available ? 'bg-ink' : 'bg-border'].join(' ')}>
                  <div
                    className={[
                      'absolute top-0.5 w-4 h-4 bg-bg shadow transition-all duration-200',
                      charm.is_available ? 'left-[18px]' : 'left-0.5',
                    ].join(' ')}
                  />
                </div>
                <span className="font-body text-[10px] text-ink-3 tracking-[0.1em] uppercase">
                  {charm.is_available ? 'Available' : 'Hidden'}
                </span>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1 border-t border-border">
                {confirmDeleteId === charm.id ? (
                  <>
                    <span className="font-body text-[10px] text-ink-3">Delete?</span>
                    <button
                      onClick={() => handleDelete(charm.id)}
                      className="font-body text-[10px] text-accent-dark hover:opacity-70 transition-opacity"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="font-body text-[10px] text-ink-3 hover:text-ink-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(charm)}
                      className="font-body text-[10px] tracking-[0.1em] text-ink-2 hover:text-ink transition-colors duration-150"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(charm.id)}
                      className="font-body text-[10px] tracking-[0.1em] text-ink-3 hover:text-accent-dark transition-colors duration-150"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md bg-bg border border-border">
            <div className="px-7 py-5 border-b border-border flex items-center justify-between">
              <p className={labelCls}>{modal.mode === 'add' ? 'Add Charm' : 'Edit Charm'}</p>
              <button onClick={closeModal} className="font-body text-ink-3 hover:text-ink transition-colors text-lg leading-none">
                ×
              </button>
            </div>

            <div className="px-7 py-7 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Name</label>
                <input
                  type="text"
                  autoFocus
                  value={modal.name}
                  onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. Sakura"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Icon SVG</label>
                <p className="font-body text-[10px] text-ink-3 leading-relaxed">
                  Find free icons at{' '}
                  <a
                    href="https://www.svgrepo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    svgrepo.com
                  </a>
                  {' '}— search for any charm, click Copy SVG, and paste the full SVG code here.
                </p>
                <textarea
                  rows={5}
                  value={modal.icon_svg}
                  onChange={(e) => setModal((m) => ({ ...m, icon_svg: e.target.value }))}
                  className={`${inputCls} resize-none font-mono text-xs`}
                  placeholder="Paste SVG path/shape elements here (the inner content, no <svg> wrapper)…"
                />
                {/* Live preview */}
                <div className="border border-border border-dashed p-4 flex items-center gap-4 bg-surface">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 26 26"
                    fill="none"
                    className="text-ink flex-shrink-0"
                    dangerouslySetInnerHTML={{ __html: modal.icon_svg || '' }}
                  />
                  <p className="font-body text-[10px] text-ink-3">Preview</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModal((m) => ({ ...m, is_available: !m.is_available }))}
                  className="flex items-center gap-2"
                >
                  <div className={['relative w-9 h-5 transition-colors duration-200', modal.is_available ? 'bg-ink' : 'bg-border'].join(' ')}>
                    <div
                      className={[
                        'absolute top-0.5 w-4 h-4 bg-bg shadow transition-all duration-200',
                        modal.is_available ? 'left-[18px]' : 'left-0.5',
                      ].join(' ')}
                    />
                  </div>
                </button>
                <span className={labelCls}>{modal.is_available ? 'Available' : 'Hidden'}</span>
              </div>

              {modalError && <p className="font-body text-xs text-accent-dark">{modalError}</p>}

              <div className="flex items-center justify-end gap-4 pt-2">
                <button onClick={closeModal} className="btn-outline">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-40">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCustomCMSPage() {
  return (
    <div className="p-12">
      {/* Page header */}
      <div className="mb-10 pb-6 border-b border-border">
        <h1 className="font-display text-3xl text-ink">Custom Order CMS</h1>
        <p className="font-body text-sm text-ink-3 mt-1">
          Manage the bead colors and charms available in the custom order form.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-16">
        <BeadColorPanel />
        <CharmPanel />
      </div>
    </div>
  );
}
