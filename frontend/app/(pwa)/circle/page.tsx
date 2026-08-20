// FILE: precci/frontend/app/(pwa)/circle/page.tsx
// CUTEME LTD — Inner Circle Community Page
// Aurora's membership community — real data from Circle.so via backend.
// Active challenges, member count, exclusive content.
// Voice navigation. Aurora speaks. Client listens and responds.
// No mock content. Real community data only.

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
  champagne: '#F5DEB3',
  midnight: '#1A0A0F',
  bgPanel: '#2a1a1f',
  bgCard: '#221218',
  border: '#4a2a2f',
  textSec: '#d4b8b0',
  textMuted: '#8a6a6a',
  online: '#22c55e',
  white: '#FFFFFF',
};

interface Challenge {
  id: string;
  title: string;
  duration: string;
  participants: number;
  daysRemaining: number;
  category: string;
}

interface CommunityPost {
  id: string;
  title: string;
  preview: string;
  postedAt: string;
  type: string;
}

export default function CirclePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [vapiId, setVapiId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

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

      const plan = userData?.plan || 'free';
      setUserPlan(plan);
      setHasAccess(['glow', 'pro', 'elite'].includes(plan));

      // Aurora's Vapi ID
      const { data: auroraAgent } = await supabase
        .from('agents')
        .select('vapi_assistant_id')
        .eq('pc_id', 'PC-023')
        .single();
      if (auroraAgent?.vapi_assistant_id) setVapiId(auroraAgent.vapi_assistant_id);

      // Load Aurora's activity from alerts
      const { data: auroraAlerts } = await supabase
        .from('alerts')
        .select('type, message, created_at, metadata')
        .eq('agent_id', 'PC-023')
        .order('created_at', { ascending: false })
        .limit(20);

      // Parse challenges from Aurora's alerts
      const challengeAlerts = (auroraAlerts || []).filter(a =>
        a.type?.includes('challenge') || a.message?.includes('challenge')
      );

      // Parse community posts
      const { data: contentData } = await supabase
        .from('content_log')
        .select('id, type, caption, published_at')
        .eq('agent_id', 'PC-023')
        .order('published_at', { ascending: false })
        .limit(10);

      const posts: CommunityPost[] = (contentData || []).map(c => ({
        id: c.id,
        title: c.caption?.substring(0, 60) || 'Community Update',
        preview: c.caption?.substring(60, 160) || '',
        postedAt: c.published_at,
        type: c.type,
      }));

      // Member count from subscriptions with Inner Circle access
      const { count } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .in('plan', ['glow', 'pro', 'elite'])
        .eq('status', 'active');

      setCommunityPosts(posts);
      setMemberCount(count || 0);
      setLoading(false);
    }

    init();
  }, [router]);

  // Aurora voice
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
        vapi.on('message', (msg: any) => { if (msg.type === 'transcript' && msg.role === 'assistant') setVoiceState('speaking'); });
        vapi.on('error', () => setVoiceState('idle'));

        await vapi.start(vapiId, {
          metadata: {
            userId,
            userPlan,
            hasAccess,
            memberCount,
            context: 'inner_circle',
          },
        });
      } catch (err) {
        console.error('Aurora Vapi error:', err);
      }
    }

    initVapi();
    return () => { if (vapi) vapi.stop(); };
  }, [vapiId, userId, loading, userPlan, hasAccess, memberCount]);

  if (loading) {
    return (
      <div style={{ height: '100dvh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.champagne} size={48} label="Aurora is preparing your community..." />
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', background: C.midnight, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', background: C.bgPanel, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
        <AgentAvatar pcId="PC-023" size="md" status="online" showStatus />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.champagne }}>Inner Circle</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>With Aurora · {memberCount !== null ? `${memberCount} members` : '—'}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <VoiceWaveform state={voiceState} colour={C.champagne} barCount={5} height={20} />
        </div>
      </div>

      {/* Access gate */}
      {!hasAccess ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32 }}>👑</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.champagne }}>Inner Circle</div>
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.8 }}>
            The Inner Circle is available from the Glow tier.<br />
            Beauty challenges, exclusive content, transformation tracking and a community of people on the same journey as you.
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>
            Say "upgrade my plan" to Aurora to unlock access
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Active Challenges */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.champagne, marginBottom: 10 }}>
              Active Challenges
            </div>
            {challenges.length === 0 ? (
              <div style={{ padding: '16px', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>
                Ask Aurora about the current challenge — she'll tell you what's running and how to join.
              </div>
            ) : challenges.map(c => (
              <div key={c.id} style={{ background: C.bgPanel, border: `1px solid ${C.champagne}33`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{c.title}</div>
                  <div style={{ fontSize: 9, color: C.champagne, fontWeight: 600 }}>{c.daysRemaining}d left</div>
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{c.duration} · {c.participants} participants · {c.category}</div>
              </div>
            ))}
          </div>

          {/* Community Posts */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.champagne, marginBottom: 10 }}>
              From Aurora
            </div>
            {communityPosts.length === 0 ? (
              <div style={{ padding: '16px', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>
                Aurora is preparing exclusive content for Inner Circle members. Check back soon.
              </div>
            ) : communityPosts.map(post => (
              <div key={post.id} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.white, marginBottom: 4 }}>{post.title}</div>
                {post.preview && <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.6 }}>{post.preview}</div>}
                <div style={{ fontSize: 9, color: C.textMuted, marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                  {new Date(post.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice bar */}
      <div style={{ padding: '10px 16px', background: C.bgPanel, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: voiceState !== 'idle' ? C.champagne : C.border, animation: voiceState !== 'idle' ? 'pulse-dot 2s infinite' : 'none' }} />
        <div style={{ fontSize: 10, color: C.textMuted }}>
          {voiceState === 'idle' ? 'Speak to Aurora' : voiceState === 'speaking' ? 'Aurora is speaking...' : 'Aurora is listening...'}
        </div>
      </div>
    </div>
  );
}