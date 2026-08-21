// FILE: precci/frontend/app/(provider)/connect/page.tsx
// CUTEME LTD — Provider Registration Portal
// precci.com/connect — THE ONLY PLACE IN THE ENTIRE SYSTEM
// WHERE TYPING IS PERMITTED.
// One-time business registration form.
// After this — everything is voice.
// Paystack for Africa (Mobile Money + cards).
// Stripe for global providers.
// $25 registration fee — mandatory.
// Brook activates voice agent on successful registration.
// Sebastian's provider agreement auto-sent via Lena.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const C = {
  roseGold: '#C4A494',
  warmGold: '#D4A853',
  midnight: '#1A0A0F',
  bgPanel: '#2a1a1f',
  bgCard: '#221218',
  border: '#4a2a2f',
  textSec: '#d4b8b0',
  textMuted: '#8a6a6a',
  online: '#22c55e',
  error: '#ef4444',
  white: '#FFFFFF',
};

const AFRICAN_COUNTRIES = ['GH','NG','KE','ZA','UG','TZ','RW','CM','CI','ET','SN','ZM','ZW','BW','NA','MZ','AO','GN','ML','BJ'];

const MOBILE_MONEY_NETWORKS: Record<string, string[]> = {
  GH: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
  KE: ['M-Pesa', 'Airtel Money', 'T-Kash'],
  NG: ['MTN Mobile Money', 'Airtel Money', 'Opay'],
  UG: ['MTN Mobile Money', 'Airtel Money'],
  TZ: ['M-Pesa', 'Airtel Money', 'Tigo Pesa'],
  RW: ['MTN Mobile Money', 'Airtel Money'],
  ZA: ['MTN Mobile Money', 'Vodacom M-Pesa'],
  CM: ['MTN Mobile Money', 'Orange Money'],
  CI: ['MTN Mobile Money', 'Orange Money', 'Moov Money'],
};

const SERVICE_CATEGORIES = [
  'Hair Salon', 'Barber / Barbershop', 'Men\'s Grooming Studio',
  'Nail Technician', 'Spa & Wellness', 'Makeup Artist',
  'Skincare Clinic', 'Personal Stylist', 'Clothing Boutique',
  'Footwear Shop', 'Cosmetics Store', 'Massage Therapist',
  'Eyebrow & Lash Studio', 'Tattoo & Piercing', 'Tanning Studio',
  'Beauty Salon (Full Service)', 'Hair Removal / Waxing', 'Other',
];

const HOURS_OPTIONS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

interface FormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  services: string[];
  customService: string;
  capacityPerSlot: string;
  slotDurationMinutes: string;
  subscriptionTier: 'basic' | 'pro';
  featuredPlacement: boolean;
  paymentMethod: 'mobile_money' | 'card' | 'bank_transfer';
  mobileMoneyNumber: string;
  mobileMoneyNetwork: string;
  operatingHours: Record<string, { open: string; close: string; closed: boolean }>;
}

interface FormErrors {
  [key: string]: string;
}

const DEFAULT_HOURS = DAYS.reduce((acc, day) => {
  acc[day] = {
    open: '09:00',
    close: '18:00',
    closed: day === 'sunday',
  };
  return acc;
}, {} as FormData['operatingHours']);

export default function ProviderRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'GH',
    services: [],
    customService: '',
    capacityPerSlot: '1',
    slotDurationMinutes: '60',
    subscriptionTier: 'basic',
    featuredPlacement: false,
    paymentMethod: 'mobile_money',
    mobileMoneyNumber: '',
    mobileMoneyNetwork: '',
    operatingHours: DEFAULT_HOURS,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);

  const isAfricaCountry = AFRICAN_COUNTRIES.includes(formData.country);
  const availableNetworks = MOBILE_MONEY_NETWORKS[formData.country] || [];
  const showMobileMoneyOption = isAfricaCountry;

  const TIER_PRICING = {
    basic: { monthly: 15, referral: 3.00 },
    pro: { monthly: 30, referral: 2.00 },
  };

  const featuredPrice = formData.country === 'GH' ? 20 : 50;

  const totalSetupCost = 25 +
    TIER_PRICING[formData.subscriptionTier].monthly +
    (formData.featuredPlacement ? featuredPrice : 0);

  function update(field: keyof FormData, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function toggleService(service: string) {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
    setErrors(prev => ({ ...prev, services: '' }));
  }

  function updateHours(day: string, field: 'open' | 'close' | 'closed', value: any) {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: { ...prev.operatingHours[day], [field]: value },
      },
    }));
  }

  function validateStep(stepNum: number): boolean {
    const newErrors: FormErrors = {};

    if (stepNum === 1) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Valid email address is required';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.address.trim()) newErrors.address = 'Business address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
    }

    if (stepNum === 2) {
      if (formData.services.length === 0) newErrors.services = 'Select at least one service';
      if (!formData.capacityPerSlot || parseInt(formData.capacityPerSlot) < 1) {
        newErrors.capacityPerSlot = 'Capacity must be at least 1';
      }
    }

    if (stepNum === 4) {
      if (formData.paymentMethod === 'mobile_money') {
        if (!formData.mobileMoneyNumber.trim()) newErrors.mobileMoneyNumber = 'Mobile money number is required';
        if (!formData.mobileMoneyNetwork) newErrors.mobileMoneyNetwork = 'Select your network';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) setStep(s => s + 1);
  }

  async function handleSubmit() {
    if (!validateStep(step)) return;
    setSubmitting(true);

    try {
      // Geocode the address
      let lat = null;
      let lng = null;
      try {
        const geocodeRes = await fetch(
          `/api/maps/geocode?address=${encodeURIComponent(`${formData.address}, ${formData.city}, ${formData.country}`)}`
        );
        if (geocodeRes.ok) {
          const geoData = await geocodeRes.json();
          lat = geoData.lat;
          lng = geoData.lng;
        }
      } catch { /* geocode optional */ }

      const response = await fetch('/api/providers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName.trim(),
          ownerName: formData.ownerName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          country: formData.country,
          lat,
          lng,
          services: [
            ...formData.services,
            ...(formData.customService.trim() ? [formData.customService.trim()] : []),
          ],
          operatingHours: formData.operatingHours,
          capacityPerSlot: parseInt(formData.capacityPerSlot),
          slotDurationMinutes: parseInt(formData.slotDurationMinutes),
          subscriptionTier: formData.subscriptionTier,
          featuredPlacement: formData.featuredPlacement,
          paymentMethod: formData.paymentMethod,
          mobileMoneyNumber: formData.mobileMoneyNumber.trim() || null,
          mobileMoneyNetwork: formData.mobileMoneyNetwork || null,
          registrationGateway: isAfricaCountry ? 'paystack' : 'stripe',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.onboarded && result.providerId) {
          setProviderId(result.providerId);

          // Redirect to payment
          if (result.checkoutUrl) {
            window.location.href = result.checkoutUrl;
          } else {
            setSubmitted(true);
          }
        } else {
          setErrors({ submit: result.error || 'Registration failed. Please try again.' });
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrors({ submit: errData.error || 'Registration failed. Please try again.' });
      }
    } catch (err) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.midnight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.roseGold }}>
          Welcome to CUTEME Connect
        </div>
        <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.8, maxWidth: 400 }}>
          {formData.businessName} is now registered.<br />
          Your CUTEME Connect voice agent will introduce itself shortly.<br />
          Brook will activate your listing within 24 hours.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
          <button
            onClick={() => router.push('/provider/dashboard')}
            style={{
              padding: '14px',
              borderRadius: 10,
              background: C.roseGold,
              color: C.midnight,
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Go to Provider Dashboard
          </button>
        </div>
        <div style={{ fontSize: 10, color: C.textMuted, maxWidth: 320, lineHeight: 1.6 }}>
          A welcome email and Sebastian's provider agreement have been sent to {formData.email}.
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.white,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 150ms',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: C.textSec,
    marginBottom: 5,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 10,
    color: C.error,
    marginTop: 4,
  };

  const fieldWrap: React.CSSProperties = { marginBottom: 16 };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.midnight,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: C.white,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: C.bgPanel,
          borderBottom: `1px solid ${C.border}`,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.roseGold, letterSpacing: '0.04em' }}>
            CUTEME LTD
          </div>
          <div style={{ fontSize: 10, color: C.textMuted }}>Connect — Provider Registration</div>
        </div>
        <div style={{ fontSize: 10, color: C.textMuted }}>
          Step {step} of 5
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.border }}>
        <div
          style={{
            height: '100%',
            width: `${(step / 5) * 100}%`,
            background: `linear-gradient(90deg, ${C.roseGold}, ${C.warmGold})`,
            transition: 'width 300ms ease',
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '32px 24px',
        }}
      >
        {/* STEP 1 — BUSINESS DETAILS */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 6 }}>
                Business Details
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                This is the only form in CUTEME. After this, everything is voice.
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Business Name *</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={e => update('businessName', e.target.value)}
                placeholder="e.g. Crown Cuts Barbershop"
                style={{ ...inputStyle, borderColor: errors.businessName ? C.error : C.border }}
                autoComplete="organization"
              />
              {errors.businessName && <div style={errorStyle}>{errors.businessName}</div>}
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Owner / Manager Name *</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={e => update('ownerName', e.target.value)}
                placeholder="Your full name"
                style={{ ...inputStyle, borderColor: errors.ownerName ? C.error : C.border }}
                autoComplete="name"
              />
              {errors.ownerName && <div style={errorStyle}>{errors.ownerName}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="you@example.com"
                  style={{ ...inputStyle, borderColor: errors.email ? C.error : C.border }}
                  autoComplete="email"
                />
                {errors.email && <div style={errorStyle}>{errors.email}</div>}
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                  style={{ ...inputStyle, borderColor: errors.phone ? C.error : C.border }}
                  autoComplete="tel"
                />
                {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Business Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => update('address', e.target.value)}
                placeholder="Street address"
                style={{ ...inputStyle, borderColor: errors.address ? C.error : C.border }}
                autoComplete="street-address"
              />
              {errors.address && <div style={errorStyle}>{errors.address}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => update('city', e.target.value)}
                  placeholder="Accra"
                  style={{ ...inputStyle, borderColor: errors.city ? C.error : C.border }}
                />
                {errors.city && <div style={errorStyle}>{errors.city}</div>}
              </div>
              <div>
                <label style={labelStyle}>Country *</label>
                <select
                  value={formData.country}
                  onChange={e => {
                    update('country', e.target.value);
                    if (!AFRICAN_COUNTRIES.includes(e.target.value)) {
                      update('paymentMethod', 'card');
                    }
                  }}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <optgroup label="Africa">
                    {[['GH','Ghana'],['NG','Nigeria'],['KE','Kenya'],['ZA','South Africa'],['UG','Uganda'],['TZ','Tanzania'],['RW','Rwanda'],['CM','Cameroon'],['CI','Côte d\'Ivoire'],['ET','Ethiopia'],['SN','Senegal']].map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Global">
                    {[['US','United States'],['GB','United Kingdom'],['FR','France'],['DE','Germany'],['AE','UAE'],['CA','Canada'],['AU','Australia'],['IN','India'],['BR','Brazil'],['MX','Mexico'],['OT','Other']].map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — SERVICES & AVAILABILITY */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 6 }}>Services & Availability</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>What do you offer? When are you open?</div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Services Offered * (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                {SERVICE_CATEGORIES.map(service => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 9999,
                      background: formData.services.includes(service) ? C.roseGold : 'transparent',
                      border: `1px solid ${formData.services.includes(service) ? C.roseGold : C.border}`,
                      color: formData.services.includes(service) ? C.midnight : C.textMuted,
                      fontSize: 11,
                      fontWeight: formData.services.includes(service) ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {service}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.customService}
                onChange={e => update('customService', e.target.value)}
                placeholder="Add a custom service..."
                style={inputStyle}
              />
              {errors.services && <div style={errorStyle}>{errors.services}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Clients Per Slot</label>
                <select value={formData.capacityPerSlot} onChange={e => update('capacityPerSlot', e.target.value)} style={inputStyle}>
                  {['1','2','3','4','5','6','8','10'].map(n => <option key={n} value={n}>{n} client{parseInt(n) > 1 ? 's' : ''}</option>)}
                </select>
                {errors.capacityPerSlot && <div style={errorStyle}>{errors.capacityPerSlot}</div>}
              </div>
              <div>
                <label style={labelStyle}>Slot Duration</label>
                <select value={formData.slotDurationMinutes} onChange={e => update('slotDurationMinutes', e.target.value)} style={inputStyle}>
                  {[['30','30 minutes'],['45','45 minutes'],['60','1 hour'],['90','1.5 hours'],['120','2 hours'],['180','3 hours']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Operating Hours</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DAYS.map(day => (
                  <div
                    key={day}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1fr',
                      gap: 10,
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: C.bgCard,
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={!formData.operatingHours[day].closed}
                        onChange={e => updateHours(day, 'closed', !e.target.checked)}
                        style={{ accentColor: C.roseGold, width: 14, height: 14 }}
                      />
                      <span style={{ fontSize: 11, color: C.textSec, textTransform: 'capitalize', fontWeight: 500 }}>{day}</span>
                    </div>
                    {!formData.operatingHours[day].closed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <select
                          value={formData.operatingHours[day].open}
                          onChange={e => updateHours(day, 'open', e.target.value)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: 11, flex: 1 }}
                        >
                          {HOURS_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0 }}>to</span>
                        <select
                          value={formData.operatingHours[day].close}
                          onChange={e => updateHours(day, 'close', e.target.value)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: 11, flex: 1 }}
                        >
                          {HOURS_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — SUBSCRIPTION PLAN */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 6 }}>Choose Your Plan</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>All plans include: listed on CUTEME Connect, Brook booking system, voice agent, provider dashboard.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {(['basic', 'pro'] as const).map(tier => (
                <div
                  key={tier}
                  onClick={() => update('subscriptionTier', tier)}
                  style={{
                    background: formData.subscriptionTier === tier ? `${C.roseGold}15` : C.bgPanel,
                    border: `2px solid ${formData.subscriptionTier === tier ? C.roseGold : C.border}`,
                    borderRadius: 12,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    position: 'relative',
                  }}
                >
                  {tier === 'pro' && (
                    <div style={{ position: 'absolute', top: -10, right: 14, fontSize: 8, padding: '3px 10px', borderRadius: 9999, background: C.warmGold, color: C.midnight, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Recommended
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.white, textTransform: 'capitalize' }}>{tier}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.roseGold }}>
                      ${TIER_PRICING[tier].monthly}<span style={{ fontSize: 11, color: C.textMuted }}>/mo</span>
                    </div>
                  </div>
                  {[
                    `Listed in CUTEME Connect marketplace`,
                    tier === 'pro' ? 'Priority search results placement' : 'Standard search results',
                    `Referral fee: $${TIER_PRICING[tier].referral.toFixed(2)} per booking`,
                    'Dedicated provider voice agent',
                    'Full provider dashboard',
                    tier === 'pro' ? 'Pro badge on listing' : null,
                  ].filter(Boolean).map(f => (
                    <div key={f!} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
                      <span style={{ color: formData.subscriptionTier === tier ? C.roseGold : C.textMuted, fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 11, color: formData.subscriptionTier === tier ? C.textSec : C.textMuted }}>{f}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Featured placement add-on */}
            <div
              onClick={() => update('featuredPlacement', !formData.featuredPlacement)}
              style={{
                background: formData.featuredPlacement ? `${C.warmGold}15` : C.bgPanel,
                border: `2px solid ${formData.featuredPlacement ? C.warmGold : C.border}`,
                borderRadius: 12,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 150ms',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: formData.featuredPlacement ? C.warmGold : 'transparent', border: `2px solid ${formData.featuredPlacement ? C.warmGold : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.midnight, flexShrink: 0 }}>
                    {formData.featuredPlacement ? '✓' : ''}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Featured Placement</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.warmGold }}>
                  +${featuredPrice}<span style={{ fontSize: 10, color: C.textMuted, fontWeight: 400 }}>/mo</span>
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
                Brook presents you first when recommending providers to clients. Subject to availability and proximity. Minimum rating 3.5 required.
                Referral fee reduces to $1.50 per booking.
              </div>
            </div>

            {/* Cost summary */}
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, marginBottom: 10 }}>
                Setup Summary
              </div>
              {[
                { label: 'Registration Fee (one-time)', value: '$25.00' },
                { label: `${formData.subscriptionTier.charAt(0).toUpperCase() + formData.subscriptionTier.slice(1)} Subscription (first month)`, value: `$${TIER_PRICING[formData.subscriptionTier].monthly.toFixed(2)}` },
                ...(formData.featuredPlacement ? [{ label: 'Featured Placement (first month)', value: `$${featuredPrice.toFixed(2)}` }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}33` }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.white }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>Total Today</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.roseGold }}>${totalSetupCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — PAYMENT */}
        {step === 4 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 6 }}>Payment</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Secure payment. Auto-billing setup for monthly fees.</div>
            </div>

            {showMobileMoneyOption && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Payment Method</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'mobile_money', label: 'Mobile Money' },
                    { id: 'card', label: 'Card' },
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => update('paymentMethod', method.id as any)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 8,
                        background: formData.paymentMethod === method.id ? `${C.roseGold}20` : C.bgCard,
                        border: `2px solid ${formData.paymentMethod === method.id ? C.roseGold : C.border}`,
                        color: formData.paymentMethod === method.id ? C.roseGold : C.textMuted,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 150ms',
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.paymentMethod === 'mobile_money' && (
              <>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Mobile Money Network *</label>
                  <select
                    value={formData.mobileMoneyNetwork}
                    onChange={e => update('mobileMoneyNetwork', e.target.value)}
                    style={{ ...inputStyle, borderColor: errors.mobileMoneyNetwork ? C.error : C.border }}
                  >
                    <option value="">Select network</option>
                    {availableNetworks.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  {errors.mobileMoneyNetwork && <div style={errorStyle}>{errors.mobileMoneyNetwork}</div>}
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Mobile Money Number *</label>
                  <input
                    type="tel"
                    value={formData.mobileMoneyNumber}
                    onChange={e => update('mobileMoneyNumber', e.target.value)}
                    placeholder="e.g. 0244000000"
                    style={{ ...inputStyle, borderColor: errors.mobileMoneyNumber ? C.error : C.border }}
                  />
                  {errors.mobileMoneyNumber && <div style={errorStyle}>{errors.mobileMoneyNumber}</div>}
                </div>

                <div style={{ padding: '10px 12px', background: `${C.online}10`, border: `1px solid ${C.online}33`, borderRadius: 8, fontSize: 11, color: '#86efac', lineHeight: 1.6, marginBottom: 16 }}>
                  Your Mobile Money number will be used for auto-debit of monthly fees. A payment prompt will be sent to your phone after you submit.
                </div>
              </>
            )}

            {(formData.paymentMethod === 'card' || !showMobileMoneyOption) && (
              <div style={{ padding: '14px', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
                You will be redirected to our secure {isAfricaCountry ? 'Paystack' : 'Stripe'} payment page to complete payment after submitting this form.
              </div>
            )}

            {/* Final cost recap */}
            <div style={{ marginTop: 20, padding: '14px 16px', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Total Due Today</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: C.roseGold }}>${totalSetupCost.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
                Then ${TIER_PRICING[formData.subscriptionTier].monthly}/month recurring{formData.featuredPlacement ? ` + $${featuredPrice}/month featured` : ''}
              </div>
            </div>

            {errors.submit && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: `${C.error}10`, border: `1px solid ${C.error}44`, borderRadius: 8, fontSize: 11, color: C.error }}>
                {errors.submit}
              </div>
            )}
          </div>
        )}

        {/* STEP 5 — REVIEW */}
        {step === 5 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 6 }}>Review & Submit</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Check your details before submitting.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Business', value: formData.businessName },
                { label: 'Owner', value: formData.ownerName },
                { label: 'Email', value: formData.email },
                { label: 'Phone', value: formData.phone },
                { label: 'Address', value: `${formData.address}, ${formData.city}, ${formData.country}` },
                { label: 'Services', value: [...formData.services, ...(formData.customService ? [formData.customService] : [])].join(', ') || '—' },
                { label: 'Capacity per slot', value: `${formData.capacityPerSlot} client(s)` },
                { label: 'Slot duration', value: `${formData.slotDurationMinutes} minutes` },
                { label: 'Plan', value: `${formData.subscriptionTier.charAt(0).toUpperCase() + formData.subscriptionTier.slice(1)} — $${TIER_PRICING[formData.subscriptionTier].monthly}/month` },
                { label: 'Featured', value: formData.featuredPlacement ? `Yes — $${featuredPrice}/month` : 'No' },
                { label: 'Payment', value: formData.paymentMethod === 'mobile_money' ? `${formData.mobileMoneyNetwork} — ${formData.mobileMoneyNumber}` : 'Card via secure checkout' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 10, padding: '7px 10px', background: C.bgCard, borderRadius: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, width: 100, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 1 }}>{row.label}</span>
                  <span style={{ fontSize: 11, color: C.textSec, lineHeight: 1.4 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px', background: `${C.roseGold}10`, border: `1px solid ${C.roseGold}33`, borderRadius: 8, fontSize: 11, color: C.textSec, lineHeight: 1.6, marginBottom: 16 }}>
              By submitting, you agree to CUTEME LTD's Provider Terms of Service (Sebastian will send them to {formData.email}) and authorise recurring billing of your chosen subscription.
            </div>

            {errors.submit && (
              <div style={{ padding: '10px 12px', background: `${C.error}10`, border: `1px solid ${C.error}44`, borderRadius: 8, fontSize: 11, color: C.error, marginBottom: 12 }}>
                {errors.submit}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '13px',
                borderRadius: 10,
                background: 'transparent',
                border: `1px solid ${C.border}`,
                color: C.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              style={{
                flex: 2,
                padding: '13px',
                borderRadius: 10,
                background: C.roseGold,
                border: 'none',
                color: C.midnight,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 150ms',
              }}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex: 2,
                padding: '13px',
                borderRadius: 10,
                background: submitting ? `${C.roseGold}80` : C.roseGold,
                border: 'none',
                color: C.midnight,
                fontSize: 13,
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
                transition: 'all 150ms',
              }}
            >
              {submitting ? 'Submitting...' : `Submit & Pay $${totalSetupCost.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}