import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../../services/api';
import { ApiResponse, BeadColor, Charm, Order } from '../../types';
import { lkr } from '../../utils/format';
import Nav from '../../components/layout/Nav';
import Footer from '../../components/layout/Footer';

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_PRICE = 2500;
const CHARM_PRICE = 200;
const COLOR_PRICE = 300;
const MAX_CHARMS = 5;

const BEAD_COUNTS = [16, 18, 20, 22, 24];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { error?: string } } };
    return e.response?.data?.error ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

function isLightColor(hex: string): boolean {
  if (!hex.match(/^#[0-9A-Fa-f]{6}$/)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

function isInitialCharm(charm: Charm): boolean {
  return charm.name.toLowerCase().includes('initial');
}

function shortId(id: string) { return id.slice(0, 8).toUpperCase(); }

const labelClass = 'font-body text-[10px] tracking-[0.2em] text-ink-2 uppercase';
const inputClass = 'w-full border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-ink transition-colors duration-150 placeholder:text-ink-3';
const sectionHead = 'font-body text-[10px] tracking-[0.25em] text-ink-2 uppercase mb-4';

// ─── Form state ──────────────────────────────────────────────────────────────

interface CustomForm {
  beadColors: string[];
  charms: string[];
  beadCount: number;
  wristSize: string;
  initialLetter: string;
  customerName: string;
  phone: string;
  address: string;
  specialInstructions: string;
  preferredDeliveryDate: string;
  paymentMethod: 'cod' | 'bank_transfer';
  slipFile: File | null;
}

const INITIAL_FORM: CustomForm = {
  beadColors: [],
  charms: [],
  beadCount: 18,
  wristSize: '',
  initialLetter: 'A',
  customerName: '',
  phone: '',
  address: '',
  specialInstructions: '',
  preferredDeliveryDate: '',
  paymentMethod: 'cod',
  slipFile: null,
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CustomOrderPage() {
  const [beadColors, setBeadColors] = useState<BeadColor[]>([]);
  const [charms, setCharms] = useState<Charm[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CustomForm>(INITIAL_FORM);
  const [stepError, setStepError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Order | null>(null);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<BeadColor[]>>('/bead-colors?available=true'),
      api.get<ApiResponse<Charm[]>>('/charms?available=true'),
    ])
      .then(([colorsRes, charmsRes]) => {
        setBeadColors(colorsRes.data.data ?? []);
        setCharms(charmsRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, []);

  const total = BASE_PRICE + form.charms.length * CHARM_PRICE + form.beadColors.length * COLOR_PRICE;

  const selectedInitialCharm = form.charms
    .map(id => charms.find(c => c.id === id))
    .find(c => c && isInitialCharm(c));

  function set<K extends keyof CustomForm>(key: K, val: CustomForm[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function toggleColor(id: string) {
    set('beadColors', form.beadColors.includes(id)
      ? form.beadColors.filter(c => c !== id)
      : [...form.beadColors, id]);
  }

  function toggleCharm(id: string) {
    if (form.charms.includes(id)) {
      set('charms', form.charms.filter(c => c !== id));
    } else if (form.charms.length < MAX_CHARMS) {
      set('charms', [...form.charms, id]);
    }
  }

  function goNext() {
    setStepError('');
    if (step === 1) {
      if (form.beadColors.length === 0) { setStepError('Please select at least one bead color.'); return; }
      if (!form.wristSize.trim()) { setStepError('Please enter your wrist size.'); return; }
    }
    if (step === 2) {
      if (!form.customerName.trim()) { setStepError('Full name is required.'); return; }
      if (!form.phone.trim()) { setStepError('Phone number is required.'); return; }
      if (!form.address.trim()) { setStepError('Delivery address is required.'); return; }
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setStepError('');
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post<ApiResponse<Order>>('/orders/custom', {
        customer_name: form.customerName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        payment_method: form.paymentMethod,
        custom_spec: {
          bead_colors: form.beadColors,
          charms: form.charms,
          bead_count: form.beadCount,
          wrist_size: form.wristSize.trim(),
          special_instructions: form.specialInstructions.trim() || undefined,
          preferred_delivery_date: form.preferredDeliveryDate || undefined,
          initial_letter: selectedInitialCharm ? form.initialLetter : undefined,
        },
      });
      const order = res.data.data!;
      if (form.paymentMethod === 'bank_transfer' && form.slipFile) {
        const fd = new FormData();
        fd.append('order_id', order.id);
        fd.append('image', form.slipFile);
        await axios.post('/api/upload/payment-slip', fd);
      }
      setConfirmed(order);
    } catch (err) {
      setSubmitError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Helpers for display ───────────────────────────────────────────────────

  function charmLabel(id: string): string {
    const c = charms.find(ch => ch.id === id);
    if (!c) return id;
    return isInitialCharm(c) ? `Initial ${form.initialLetter}` : c.name;
  }

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="min-h-screen bg-bg">
        <Nav />
        <main className="pt-[72px]">
          <div className="px-8 md:px-16 lg:px-24 py-24 max-w-2xl">
            <p className="font-body text-[10px] tracking-[0.35em] text-accent uppercase mb-6">
              — Order Confirmed —
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-ink leading-[1.1] mb-4">
              Your order<br/>is placed.
            </h1>
            <p className="font-body text-sm text-ink-2 font-light mb-12">
              Reference <span className="text-ink font-normal">#{shortId(confirmed.id)}</span>
            </p>

            <div className="border border-border p-8 mb-8 flex flex-col gap-5">
              <p className={sectionHead}>Your Bracelet</p>

              <div className="flex items-center gap-3 flex-wrap">
                {form.beadColors.map(id => {
                  const c = beadColors.find(b => b.id === id);
                  return c ? (
                    <span
                      key={id}
                      title={c.name}
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: c.hex_code,
                        boxShadow: isLightColor(c.hex_code) ? 'inset 0 0 0 1px #E2DDD8' : undefined,
                      }}
                    />
                  ) : null;
                })}
                <span className="font-body text-sm text-ink-2">
                  {form.beadColors.map(id => beadColors.find(b => b.id === id)?.name).filter(Boolean).join(', ')}
                </span>
              </div>

              {form.charms.length > 0 && (
                <div>
                  <span className="font-body text-[11px] text-ink-3">Charms — </span>
                  <span className="font-body text-sm text-ink-2">
                    {form.charms.map(id => charmLabel(id)).join(', ')}
                  </span>
                </div>
              )}

              <div className="flex gap-8">
                <div>
                  <p className="font-body text-[10px] text-ink-3 mb-0.5">Bead count</p>
                  <p className="font-body text-sm text-ink">{form.beadCount} beads</p>
                </div>
                <div>
                  <p className="font-body text-[10px] text-ink-3 mb-0.5">Wrist size</p>
                  <p className="font-body text-sm text-ink">{form.wristSize} cm</p>
                </div>
              </div>

              <hr className="border-border"/>

              <div className="flex justify-between">
                <span className="font-display text-base text-ink">Total</span>
                <span className="font-display text-lg text-ink tabular-nums">{lkr(total)}</span>
              </div>
            </div>

            {form.paymentMethod === 'bank_transfer' && (
              <div className="border border-border p-8 mb-8">
                <p className={sectionHead}>Bank Transfer Details</p>
                {[
                  ['Bank', 'Commercial Bank of Ceylon'],
                  ['Account Name', 'Mani Jewellery'],
                  ['Account Number', '1234567890'],
                  ['Branch', 'Colombo'],
                  ['Amount', lkr(total)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-baseline gap-4 mb-2.5">
                    <span className="font-body text-[11px] text-ink-3">{label}</span>
                    <span className="font-body text-sm text-ink text-right">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-border p-8 mb-12">
              <p className="font-body text-sm text-ink-2 font-light leading-relaxed">
                We'll contact you within <span className="text-ink">24 hours on WhatsApp</span> to confirm your custom order and arrange delivery.
              </p>
            </div>

            <Link to="/shop" className="font-body text-[11px] tracking-[0.18em] uppercase text-ink-3 hover:text-ink-2 transition-colors duration-200">
              ← Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Multi-step form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="pt-[72px]">
        {/* Page header */}
        <div className="px-8 md:px-16 lg:px-24 py-12 border-b border-border">
          <p className="font-body text-[10px] tracking-[0.35em] text-accent uppercase mb-3">
            — Bespoke —
          </p>
          <h1 className="font-display text-4xl text-ink">Custom Order</h1>
        </div>

        {/* Step indicator */}
        <div className="px-8 md:px-16 lg:px-24 py-8 border-b border-border">
          <div className="flex items-center gap-0 max-w-sm">
            {[1, 2, 3].map((n, i) => (
              <div key={n} className="flex items-center">
                <div className={[
                  'w-7 h-7 flex items-center justify-center border transition-colors duration-300',
                  step === n ? 'border-ink bg-ink' : step > n ? 'border-ink bg-bg' : 'border-border bg-bg',
                ].join(' ')}>
                  <span className={[
                    'font-body text-[10px] tracking-[0.1em]',
                    step === n ? 'text-bg' : step > n ? 'text-ink' : 'text-ink-3',
                  ].join(' ')}>
                    {n}
                  </span>
                </div>
                {i < 2 && (
                  <div className={['h-px w-16 transition-colors duration-300', step > n ? 'bg-ink' : 'bg-border'].join(' ')} />
                )}
              </div>
            ))}
            <div className="ml-8 flex gap-8">
              {['Build', 'Details', 'Review'].map((label, i) => (
                <span key={label} className={[
                  'font-body text-[10px] tracking-[0.18em] uppercase transition-colors duration-300',
                  step === i + 1 ? 'text-ink' : 'text-ink-3',
                ].join(' ')}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div
          key={step}
          style={{ animation: 'step-fade-in 0.35s ease-out both' }}
          className="px-8 md:px-16 lg:px-24 py-14 max-w-3xl"
        >

          {/* ── STEP 1: Build Your Bracelet ── */}
          {step === 1 && (
            <div className="flex flex-col gap-12">
              {/* Bead colors */}
              <div>
                <p className={sectionHead}>Bead Colors <span className="normal-case tracking-normal text-ink-3">(select all that apply)</span></p>
                {catalogLoading ? (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 mt-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-surface animate-pulse" />
                        <div className="h-2 w-12 bg-surface animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 mt-6">
                    {beadColors.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => toggleColor(color.id)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div
                          className="w-10 h-10 rounded-full transition-all duration-150 flex-shrink-0"
                          style={{
                            backgroundColor: color.hex_code,
                            outline: form.beadColors.includes(color.id) ? '2.5px solid #D4A5A5' : '2.5px solid transparent',
                            outlineOffset: '3px',
                            boxShadow: isLightColor(color.hex_code) ? 'inset 0 0 0 1px #ccc' : undefined,
                          }}
                        />
                        <span className="font-body text-[9px] text-ink-3 tracking-[0.06em] text-center leading-tight">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Charms */}
              <div>
                <p className={sectionHead}>
                  Charms <span className="normal-case tracking-normal text-ink-3">(up to {MAX_CHARMS} — {form.charms.length} selected)</span>
                </p>
                {catalogLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="border border-border p-4 flex flex-col items-center gap-2.5">
                        <div className="w-7 h-7 bg-surface animate-pulse" />
                        <div className="h-2 w-14 bg-surface animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {charms.map(charm => {
                      const selected = form.charms.includes(charm.id);
                      const maxed = !selected && form.charms.length >= MAX_CHARMS;
                      return (
                        <button
                          key={charm.id}
                          type="button"
                          onClick={() => toggleCharm(charm.id)}
                          disabled={maxed}
                          className={[
                            'p-4 border flex flex-col items-center gap-2.5 transition-colors duration-150 disabled:opacity-35',
                            selected ? 'border-accent bg-surface' : 'border-border hover:border-ink-2',
                          ].join(' ')}
                        >
                            <svg
                              width="26"
                              height="26"
                              viewBox="0 0 26 26"
                              fill="none"
                              style={{ filter: 'brightness(0)' }}
                              dangerouslySetInnerHTML={{ __html: charm.icon_svg }}
                            />
                          <span className="font-body text-[11px] text-ink-2 tracking-[0.06em]">
                            {charm.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Initial letter picker */}
                {selectedInitialCharm && (
                  <div className="mt-4 flex items-center gap-4">
                    <span className="font-body text-[11px] text-ink-2">Choose your initial:</span>
                    <select
                      value={form.initialLetter}
                      onChange={e => set('initialLetter', e.target.value)}
                      className="border border-border bg-bg px-3 py-2 font-body text-sm text-ink outline-none focus:border-ink"
                    >
                      {ALPHABET.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Bead count */}
              <div>
                <p className={sectionHead}>Number of Beads</p>
                <div className="flex gap-2 flex-wrap mt-4">
                  {BEAD_COUNTS.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set('beadCount', n)}
                      className={[
                        'px-5 py-2 border font-body text-sm transition-colors duration-150',
                        form.beadCount === n ? 'bg-ink text-bg border-ink' : 'bg-bg text-ink-2 border-border hover:border-ink-2',
                      ].join(' ')}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="font-body text-[10px] text-ink-3 mt-2">
                  Standard bracelet is 18–20 beads for most wrist sizes.
                </p>
              </div>

              {/* Wrist size */}
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <label className={labelClass}>Wrist Size</label>
                  <span className="font-body text-[10px] text-ink-3">in cm</span>
                </div>
                <div className="flex items-center gap-3 max-w-xs">
                  <input
                    type="number"
                    min="12"
                    max="22"
                    step="0.5"
                    placeholder="e.g. 16"
                    value={form.wristSize}
                    onChange={e => set('wristSize', e.target.value)}
                    className={inputClass}
                  />
                  <span className="font-body text-sm text-ink-2 flex-shrink-0">cm</span>
                </div>
                <p className="font-body text-[10px] text-ink-3 mt-2 leading-relaxed">
                  Wrap a soft tape measure around your wrist where you'd wear the bracelet. Add 1 cm for a relaxed fit.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Your Details ── */}
          {step === 2 && (
            <div className="flex flex-col gap-6 max-w-lg">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Full Name</label>
                <input type="text" placeholder="Your full name" value={form.customerName} onChange={e => set('customerName', e.target.value)} className={inputClass} autoFocus/>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Phone Number</label>
                <input type="tel" placeholder="+94 77 000 0000" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputClass}/>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Delivery Address</label>
                <textarea
                  rows={4}
                  placeholder="Street address, city, postal code"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Personal Message <span className="normal-case tracking-normal font-body text-[10px] text-ink-3">(optional — included with your bracelet)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="A note you'd like included with your order…"
                  value={form.specialInstructions}
                  onChange={e => set('specialInstructions', e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Preferred Delivery Date <span className="normal-case tracking-normal font-body text-[10px] text-ink-3">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.preferredDeliveryDate}
                  onChange={e => set('preferredDeliveryDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: Review & Submit ── */}
          {step === 3 && (
            <div className="flex flex-col gap-10">
              {/* Summary */}
              <div className="border border-border p-8 flex flex-col gap-6">
                <p className={sectionHead}>Your Bracelet</p>

                <div>
                  <p className="font-body text-[10px] text-ink-3 mb-2">Bead Colors</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {form.beadColors.map(id => {
                      const c = beadColors.find(b => b.id === id);
                      return c ? (
                        <div key={id} className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: c.hex_code,
                              boxShadow: isLightColor(c.hex_code) ? 'inset 0 0 0 1px #ccc' : undefined,
                            }}
                          />
                          <span className="font-body text-[11px] text-ink-2">{c.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {form.charms.length > 0 && (
                  <div>
                    <p className="font-body text-[10px] text-ink-3 mb-2">Charms</p>
                    <p className="font-body text-sm text-ink-2">
                      {form.charms.map(id => charmLabel(id)).join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-10">
                  <div>
                    <p className="font-body text-[10px] text-ink-3 mb-1">Beads</p>
                    <p className="font-body text-sm text-ink">{form.beadCount}</p>
                  </div>
                  <div>
                    <p className="font-body text-[10px] text-ink-3 mb-1">Wrist size</p>
                    <p className="font-body text-sm text-ink">{form.wristSize} cm</p>
                  </div>
                  {form.preferredDeliveryDate && (
                    <div>
                      <p className="font-body text-[10px] text-ink-3 mb-1">Delivery by</p>
                      <p className="font-body text-sm text-ink">
                        {new Date(form.preferredDeliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                <hr className="border-border"/>

                <p className={sectionHead}>Your Details</p>
                <div className="flex flex-col gap-1">
                  <p className="font-body text-sm text-ink">{form.customerName}</p>
                  <p className="font-body text-sm text-ink-2">{form.phone}</p>
                  <p className="font-body text-sm text-ink-2 leading-relaxed">{form.address}</p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="border border-border p-8">
                <p className={sectionHead}>Price Estimate</p>
                <div className="flex flex-col gap-3 mb-5">
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-ink-2">Base bracelet</span>
                    <span className="font-body text-sm text-ink tabular-nums">{lkr(BASE_PRICE)}</span>
                  </div>
                  {form.beadColors.length > 0 && (
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-ink-2">{form.beadColors.length} bead color{form.beadColors.length > 1 ? 's' : ''} × {lkr(COLOR_PRICE)}</span>
                      <span className="font-body text-sm text-ink tabular-nums">{lkr(form.beadColors.length * COLOR_PRICE)}</span>
                    </div>
                  )}
                  {form.charms.length > 0 && (
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-ink-2">{form.charms.length} charm{form.charms.length > 1 ? 's' : ''} × {lkr(CHARM_PRICE)}</span>
                      <span className="font-body text-sm text-ink tabular-nums">{lkr(form.charms.length * CHARM_PRICE)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between border-t border-border pt-5">
                  <span className="font-display text-base text-ink">Total</span>
                  <span className="font-display text-xl text-ink tabular-nums">{lkr(total)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className={sectionHead}>Payment Method</p>
                <div className="grid grid-cols-2 gap-4 mt-4 max-w-lg">
                  {(
                    [
                      { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
                      { value: 'bank_transfer', label: 'Bank Transfer', sub: 'Transfer before dispatch' },
                    ] as const
                  ).map(({ value, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('paymentMethod', value)}
                      className={[
                        'p-5 border text-left transition-colors duration-150',
                        form.paymentMethod === value ? 'border-ink bg-surface' : 'border-border hover:border-ink-2',
                      ].join(' ')}
                    >
                      <p className="font-display text-base text-ink mb-1">{label}</p>
                      <p className="font-body text-[11px] text-ink-3">{sub}</p>
                    </button>
                  ))}
                </div>

                {form.paymentMethod === 'bank_transfer' && (
                  <div className="flex flex-col gap-5 mt-6 max-w-lg">
                    <div className="border border-border bg-surface p-6">
                      <p className="font-body text-[10px] tracking-[0.3em] text-ink-2 uppercase mb-4">Bank Transfer Details</p>
                      {[
                        ['Bank', 'Commercial Bank of Ceylon'],
                        ['Account Name', 'Mani Jewellery'],
                        ['Account Number', '1234567890'],
                        ['Branch', 'Colombo'],
                      ].map(([lbl, val]) => (
                        <div key={lbl} className="flex justify-between items-baseline gap-4 mb-2">
                          <span className="font-body text-[11px] text-ink-3">{lbl}</span>
                          <span className="font-body text-sm text-ink">{val}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="font-body text-[10px] tracking-[0.2em] text-ink-3 uppercase mb-3">
                        Upload Transfer Proof <span className="normal-case tracking-normal">(optional)</span>
                      </p>
                      <label className="border border-border border-dashed bg-surface p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-bg transition-colors duration-150">
                        <span className="font-display text-2xl text-border select-none">↑</span>
                        <span className="font-body text-sm text-ink-2 text-center">
                          {form.slipFile ? form.slipFile.name : 'Click to select your transfer screenshot'}
                        </span>
                        <span className="font-body text-[10px] text-ink-3 tracking-[0.1em]">JPG, PNG or WEBP</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={e => set('slipFile', e.target.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {submitError && (
                <p className="font-body text-xs text-accent-dark">{submitError}</p>
              )}
            </div>
          )}

          {/* Step error */}
          {stepError && (
            <p className="font-body text-xs text-accent-dark mt-6">{stepError}</p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="font-body text-[11px] text-ink-3 tracking-[0.18em] uppercase hover:text-ink-2 transition-colors duration-200"
                >
                  ← Back
                </button>
              )}
            </div>
            <div>
              {step < 3 ? (
                <button type="button" onClick={goNext} className="btn-primary">
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary disabled:opacity-40"
                >
                  {submitting ? 'Placing Order…' : 'Place Custom Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
