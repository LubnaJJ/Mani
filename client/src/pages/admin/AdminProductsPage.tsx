import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import api from '../../services/api';
import { ApiResponse, Category, Product, ProductImage } from '../../types';
import { lkr } from '../../utils/format';

function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { error?: string } } };
    return e.response?.data?.error ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}

interface FormState {
  name: string;
  description: string;
  price: string;
  category_id: string;
  stock: string;
  is_visible: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  stock: '0',
  is_visible: true,
};

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  productId: string;
  form: FormState;
  images: ProductImage[];
}

const MODAL_CLOSED: ModalState = {
  open: false,
  mode: 'add',
  productId: '',
  form: EMPTY_FORM,
  images: [],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fix 1: selectedFile stored in state, not read from DOM ref at upload time
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories fetched independently so they always load regardless of products/admin result
  useEffect(() => {
    api
      .get<ApiResponse<Category[]>>('/categories')
      .then((res) => setCategories(res.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Product[]>>('/products/admin');
      setProducts(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function resetUploadState() {
    setSelectedFile(null);
    setUploadError('');
    setIsPrimary(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function openAdd() {
    setModal({
      open: true,
      mode: 'add',
      productId: '',
      form: { ...EMPTY_FORM, category_id: categories[0]?.id ?? '' },
      images: [],
    });
    setModalError('');
    resetUploadState();
  }

  function openEdit(product: Product) {
    setModal({
      open: true,
      mode: 'edit',
      productId: product.id,
      form: {
        name: product.name,
        description: product.description,
        price: String(product.price),
        category_id: product.category_id,
        stock: String(product.stock),
        is_visible: product.is_visible,
      },
      images: product.product_images ?? [],
    });
    setModalError('');
    resetUploadState();
  }

  function closeModal() {
    setModal(MODAL_CLOSED);
    setModalError('');
    resetUploadState();
  }

  function updateForm(field: keyof FormState, value: string | boolean) {
    setModal((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  }

  // Creates or updates the product and returns its id (or null on failure)
  async function saveProductDetails(): Promise<string | null> {
    const { form, mode, productId } = modal;
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);

    if (!form.name.trim()) { setModalError('Name is required.'); return null; }
    if (!form.description.trim()) { setModalError('Description is required.'); return null; }
    if (!form.category_id) { setModalError('Category is required.'); return null; }
    if (isNaN(price) || price <= 0) { setModalError('Enter a valid price.'); return null; }
    if (isNaN(stock) || stock < 0) { setModalError('Stock must be 0 or more.'); return null; }

    setSaving(true);
    setModalError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category_id: form.category_id,
        stock,
        is_visible: form.is_visible,
      };
      if (mode === 'add') {
        const res = await api.post<ApiResponse<Product>>('/products', payload);
        const created = res.data.data!;
        setModal((prev) => ({ ...prev, mode: 'edit', productId: created.id }));
        await load();
        return created.id;
      } else {
        await api.put(`/products/${productId}`, payload);
        await load();
        return productId;
      }
    } catch (err) {
      setModalError(getApiError(err));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDetails() {
    await saveProductDetails();
  }

  async function handleUpload() {
    // Fix 1: read from state, not from DOM ref — survives re-renders from auto-save
    const file = selectedFile;
    if (!file) return;

    let pid = modal.productId;
    if (!pid) {
      const savedId = await saveProductDetails();
      if (!savedId) return;
      pid = savedId;
    }

    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('product_id', pid);
    formData.append('is_primary', String(isPrimary));

    try {
      // Use raw axios (not the api instance) so the default Content-Type: application/json
      // header is not present — the browser then sets multipart/form-data with the correct boundary.
      const credentials = localStorage.getItem('admin_credentials');
      const res = await axios.post<ApiResponse<ProductImage>>(
        '/api/upload/product-image',
        formData,
        credentials ? { headers: { Authorization: `Basic ${credentials}` } } : undefined
      );
      const uploaded = res.data.data!;
      // Fix 2: append to images list (don't clear), demote others locally if primary
      setModal((prev) => ({
        ...prev,
        images: isPrimary
          ? [...prev.images.map((i) => ({ ...i, is_primary: false })), uploaded]
          : [...prev.images, uploaded],
      }));
      resetUploadState(); // only clears the file picker — thumbnails stay
      await load();
    } catch (err) {
      setUploadError(getApiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleSetPrimary(imageId: string) {
    try {
      await api.patch(`/products/images/${imageId}/primary`, {
        product_id: modal.productId,
      });
      setModal((prev) => ({
        ...prev,
        images: prev.images.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        })),
      }));
      await load();
    } catch {
      // silent — thumbnail state unchanged
    }
  }

  async function handleRemoveImage(imageId: string) {
    try {
      await api.delete(`/products/images/${imageId}`);
      setModal((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
      await load();
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // row stays
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const getPrimaryThumb = (product: Product) => {
    const imgs = product.product_images ?? [];
    return (imgs.find((i) => i.is_primary) ?? imgs[0])?.cloudinary_url ?? null;
  };

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? '—';

  const hasId = Boolean(modal.productId);

  return (
    <div className="p-12">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-12 border-b border-border pb-6">
        <h1 className="font-display text-3xl text-ink">Products</h1>
        <button onClick={openAdd} className="btn-primary">
          + Add Product
        </button>
      </div>

      {/* Table */}
      <div className="border border-border overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[2.5rem_2fr_1fr_6rem_4.5rem_4.5rem_auto] border-b border-border bg-surface">
            {['', 'Name', 'Category', 'Price', 'Stock', 'Visible', 'Actions'].map((h) => (
              <div key={h} className="px-4 py-3">
                <span className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
                  {h}
                </span>
              </div>
            ))}
          </div>

          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[2.5rem_2fr_1fr_6rem_4.5rem_4.5rem_auto] border-b border-border last:border-0"
              >
                <div className="px-2 py-3 flex items-center">
                  <div className="w-8 h-8 bg-surface animate-pulse" />
                </div>
                {[140, 80, 60, 30, 30, 80].map((w, j) => (
                  <div key={j} className="px-4 py-3 flex items-center">
                    <div className="h-4 bg-surface animate-pulse" style={{ width: w }} />
                  </div>
                ))}
              </div>
            ))}

          {!loading && products.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="font-body text-sm text-ink-3">No products yet.</p>
            </div>
          )}

          {!loading &&
            products.map((product) => {
              const thumb = getPrimaryThumb(product);
              return (
                <div
                  key={product.id}
                  className="grid grid-cols-[2.5rem_2fr_1fr_6rem_4.5rem_4.5rem_auto] border-b border-border last:border-0 hover:bg-surface transition-colors duration-150"
                >
                  <div className="px-2 py-3 flex items-center">
                    <div className="w-8 h-8 bg-surface overflow-hidden flex-shrink-0">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-[8px] text-border select-none">ま</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center min-w-0">
                    <span className="font-body text-sm text-ink truncate">{product.name}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span className="font-body text-sm text-ink-2">
                      {getCategoryName(product.category_id)}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span className="font-body text-sm text-ink tabular-nums">
                      {lkr(product.price)}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span
                      className={[
                        'font-body text-sm tabular-nums',
                        product.stock < 5 ? 'text-accent-dark' : 'text-ink',
                      ].join(' ')}
                    >
                      {product.stock}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span
                      className={[
                        'font-body text-[11px]',
                        product.is_visible ? 'text-sage' : 'text-ink-3',
                      ].join(' ')}
                    >
                      {product.is_visible ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-4">
                    {confirmDeleteId === product.id ? (
                      <>
                        <span className="font-body text-[11px] text-ink-2">Delete?</span>
                        <button
                          onClick={() => handleDelete(product.id)}
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
                          onClick={() => openEdit(product)}
                          className="font-body text-[11px] text-ink-2 hover:text-ink transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(product.id)}
                          className="font-body text-[11px] text-ink-3 hover:text-accent-dark transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 overflow-y-auto py-10 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-lg bg-bg border border-border">
            {/* Modal header */}
            <div className="px-8 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-bg z-10">
              <p className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
                {hasId ? 'Edit Product' : 'Add Product'}
              </p>
              <button
                onClick={closeModal}
                className="font-body text-ink-3 hover:text-ink transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-8 py-8 flex flex-col gap-5">
              {/* ── Details ──────────────────────────────────────── */}
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase">
                  Name
                </label>
                <input
                  type="text"
                  value={modal.form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  autoFocus
                  className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase">
                  Description
                </label>
                <textarea
                  value={modal.form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={3}
                  className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase">
                    Price (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={modal.form.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={modal.form.stock}
                    onChange={(e) => updateForm('stock', e.target.value)}
                    className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase">
                  Category
                </label>
                <select
                  value={modal.form.category_id}
                  onChange={(e) => updateForm('category_id', e.target.value)}
                  className="w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase">
                  Visible in shop
                </label>
                <button
                  type="button"
                  onClick={() => updateForm('is_visible', !modal.form.is_visible)}
                  className={[
                    'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                    modal.form.is_visible ? 'bg-ink' : 'bg-border',
                  ].join(' ')}
                  aria-label="Toggle visibility"
                >
                  <span
                    className={[
                      'absolute top-1 w-4 h-4 rounded-full bg-bg shadow transition-transform duration-200',
                      modal.form.is_visible ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>
              </div>

              {modalError && (
                <p className="font-body text-xs text-accent-dark">{modalError}</p>
              )}

              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="btn-primary w-full text-center disabled:opacity-40"
              >
                {saving ? 'Saving…' : hasId ? 'Save Changes' : 'Create Product'}
              </button>

              {/* ── Images ───────────────────────────────────────── */}
              <hr className="border-border my-2" />

              <p className="font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase">
                Images
              </p>

              {/* Fix 2: thumbnails with Set primary / × buttons */}
              {modal.images.length > 0 && (
                <div className="flex flex-col gap-2">
                  {modal.images.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-3 border border-border p-2"
                    >
                      <img
                        src={img.cloudinary_url}
                        alt=""
                        className="w-14 h-14 object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        {img.is_primary ? (
                          <span className="font-body text-[10px] tracking-[0.15em] text-ink-3 uppercase">
                            Primary
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(img.id)}
                            className="font-body text-[10px] tracking-[0.1em] text-ink-2 hover:text-ink transition-colors uppercase"
                          >
                            Set primary
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        aria-label="Remove image"
                        className="font-body text-ink-3 hover:text-accent-dark transition-colors text-lg leading-none flex-shrink-0 px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload box — persists after each upload so user can add more */}
              <div className="border border-border p-5 flex flex-col gap-4">
                {/* Fix 1: onChange stores File object in state */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setSelectedFile(f);
                    setUploadError('');
                  }}
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-outline"
                  >
                    Choose File
                  </button>
                  <span className="font-body text-[11px] text-ink-2 truncate max-w-[180px]">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </span>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="accent-ink"
                  />
                  <span className="font-body text-[11px] text-ink-2">
                    Set as primary image
                  </span>
                </label>

                {!hasId && selectedFile && (
                  <p className="font-body text-[10px] text-ink-3">
                    Product will be saved automatically before uploading.
                  </p>
                )}

                {uploadError && (
                  <p className="font-body text-xs text-accent-dark">{uploadError}</p>
                )}

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="btn-primary disabled:opacity-40"
                >
                  {uploading ? 'Uploading…' : 'Upload Image'}
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button onClick={closeModal} className="btn-outline mt-4">
                  {hasId ? 'Done' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
