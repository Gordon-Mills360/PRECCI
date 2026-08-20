// FILE: precci/frontend/app/(pwa)/academy/page.tsx
// CUTEME LTD — Beauty Academy Page
// Piper's course library from Teachable via backend.
// Real courses only. No mock content.
// Voice navigation — Piper guides by voice.
// Course purchase via Stripe/Paystack.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AgentAvatar from '../../components/ui/AgentAvatar';
import VoiceWaveform from '../../components/voice/VoiceWaveform';
import LoadingPulse from '../../components/ui/LoadingPulse';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  roseGold: '#C4A494',
  midnight: '#1A0A0F',
  bgPanel: '#2a1a1f',
  bgCard: '#221218',
  border: '#4a2a2f',
  textSec: '#d4b8b0',
  textMuted: '#8a6a6a',
  online: '#22c55e',
  white: '#FFFFFF',
};

interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: string;
  duration?: string;
  level?: string;
  thumbnailUrl?: string;
  published: boolean;
}

export default function AcademyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [vapiId, setVapiId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/'); return; }
      setUserId(session.user.id);

      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', session.user.id)
        .single();
      if (userData?.plan) setUserPlan(userData.plan);

      // Load Piper's Vapi ID
      const { data: piperAgent } = await supabase
        .from('agents')
        .select('vapi_assistant_id')
        .eq('pc_id', 'PC-018')
        .single();
      if (piperAgent?.vapi_assistant_id) setVapiId(piperAgent.vapi_assistant_id);

      // Load courses from content_log (Piper logs published content)
      const { data: contentData } = await supabase
        .from('content_log')
        .select('id, type, caption, media_url, published_at, engagement')
        .eq('agent_id', 'PC-018')
        .eq('type', 'course')
        .order('published_at', { ascending: false });

      // Also check products table for digital courses
      const { data: digitalProducts } = await supabase
        .from('products')
        .select('id, name, brand, category, price, currency, affiliate_url, description, image_url')
        .in('category', ['course', 'masterclass', 'ebook', 'guide', 'digital_guide'])
        .eq('in_stock', true);

      const coursesFromProducts: Course[] = (digitalProducts || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: parseFloat(p.price || '0'),
        currency: p.currency || 'USD',
        type: p.category,
        thumbnailUrl: p.image_url || undefined,
        published: true,
      }));

      const coursesFromContent: Course[] = (contentData || []).map(c => ({
        id: c.id,
        name: c.caption?.substring(0, 50) || 'Course',
        description: c.caption || '',
        price: 0,
        currency: 'USD',
        type: c.type,
        published: true,
      }));

      setCourses([...coursesFromProducts, ...coursesFromContent]);
      setLoading(false);
    }

    init();
  }, [router]);

  // Initialise Piper voice
  useEffect(() => {
    if (!vapiId || !userId || loading) return;
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) return;

    let vapi: any;

    async function initVapi() {
      try {
        const { default: Vapi } = await import('@vapi-ai/web');
        vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);

        vapi.on('call-start', () => setVoiceState('listening'));
        vapi.on('call-end', () => setVoiceState('idle'));
        vapi.on('speech-start', () => setVoiceState('listening'));
        vapi.on('speech-end', () => setVoiceState('processing'));
        vapi.on('message', (msg: any) => {
          if (msg.type === 'transcript' && msg.role === 'assistant') {
            setVoiceState('speaking');
          }
        });
        vapi.on('error', () => setVoiceState('idle'));

        await vapi.start(vapiId, {
          metadata: {
            userId,
            userPlan,
            context: 'beauty_academy',
            availableCourses: courses.length,
          },
        });
      } catch (err) {
        console.error('Piper Vapi error:', err);
      }
    }

    initVapi();
    return () => { if (vapi) vapi.stop(); };
  }, [vapiId, userId, loading, courses.length, userPlan]);

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.type)))];
  const filtered = activeCategory === 'all' ? courses : courses.filter(c => c.type === activeCategory);

  if (loading) {
    return (
      <div style={{ height: '100dvh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.roseGold} size={48} label="Piper is loading your courses..." />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100dvh',
        background: C.midnight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          background: C.bgPanel,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, padding: 0, flexShrink: 0 }}
        >
          ←
        </button>
        <AgentAvatar pcId="PC-018" size="md" status="online" showStatus />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.roseGold }}>CUTEME Academy</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>With Piper</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <VoiceWaveform state={voiceState} colour={C.roseGold} barCount={5} height={20} />
        </div>
      </div>

      {/* Category filter */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0,
              padding: '5px 12px',
              borderRadius: 9999,
              background: activeCategory === cat ? C.roseGold : 'transparent',
              border: `1px solid ${activeCategory === cat ? C.roseGold : C.border}`,
              color: activeCategory === cat ? C.midnight : C.textMuted,
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plan notice for free users */}
      {userPlan === 'free' && (
        <div
          style={{
            padding: '10px 16px',
            background: `${C.roseGold}12`,
            borderBottom: `1px solid ${C.roseGold}33`,
            fontSize: 11,
            color: C.textSec,
            flexShrink: 0,
          }}
        >
          Upgrade to Glow or Pro to unlock all Academy content. Say "upgrade" to Piper.
        </div>
      )}

      {/* Courses */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 16,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, opacity: 0.3 }}>🎓</div>
            <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
              Piper is creating courses now.<br />
              Check back soon — or ask her by voice what's coming next.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(course => (
              <div
                key={course.id}
                style={{
                  background: C.bgPanel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                {course.thumbnailUrl && (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.name}
                    style={{ width: '100%', height: 140, objectFit: 'cover' }}
                  />
                )}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 3 }}>{course.name}</div>
                      <div style={{ fontSize: 8, padding: '2px 6px', borderRadius: 9999, background: `${C.roseGold}20`, color: C.roseGold, display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        {course.type}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: course.price === 0 ? C.online : C.roseGold, flexShrink: 0, marginLeft: 10 }}>
                      {course.price === 0 ? 'FREE' : `${course.currency} ${course.price.toFixed(2)}`}
                    </div>
                  </div>
                  {course.description && (
                    <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
                      {course.description.substring(0, 100)}
                      {course.description.length > 100 ? '...' : ''}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>
                    Say "enrol in {course.name}" to Piper to get started
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice indicator */}
      <div
        style={{
          padding: '10px 16px',
          background: C.bgPanel,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: voiceState !== 'idle' ? C.roseGold : C.border, animation: voiceState !== 'idle' ? 'pulse-dot 2s infinite' : 'none' }} />
        <div style={{ fontSize: 10, color: C.textMuted }}>
          {voiceState === 'idle' ? 'Ask Piper about any course' : voiceState === 'speaking' ? 'Piper is speaking...' : 'Piper is listening...'}
        </div>
      </div>
    </div>
  );
}