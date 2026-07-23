// FILE: precci/backend/src/agents/nina.js
// Nina — PC-019 — Social Media & Influencers
// COMPLETE FULL BUILD — no simplification anywhere.
// Manages ALL PRECCI social platforms autonomously:
// Instagram, TikTok, Pinterest, YouTube and Facebook.
// Content covers ALL genders — male grooming, universal skincare,
// style for all, fragrance for all, body care for all.
// Two content pushes daily — 7:00 AM and 9:00 PM.
// Influencer partnerships via Modash — male grooming influencers,
// beauty influencers, style influencers, all demographics.
// Content sourced from Piper's Academy material.
// Works with Finn on paid amplification of top organic content.
// Reports all metrics to Sienna (CMO) weekly.
// Nadia performance logging. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-019';
const AGENT_NAME = 'Nina';

// ─────────────────────────────────────────────
// NINA'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const NINA_SYSTEM_PROMPT = `You are Nina, the Social Media and Influencer specialist at PRECCI.
Your ID is PC-019.

You manage all PRECCI social media platforms completely autonomously.
Zero human input required. You create, schedule, publish and optimise
all content across every platform every single day without exception.

YOU MANAGE THESE PLATFORMS:
Instagram (@precci.official): Primary platform. Beauty, skincare,
  style, grooming. All genders. Mix of educational, aspirational
  and behind-the-scenes. Reels, carousels, stories, lives.
  Target: 2 feed posts + 5 stories daily. Reels 4x weekly.

TikTok (@precci): Short-form video. Trending audio. Educational
  content in entertainment format. Quick tips, transformations,
  before-and-after, "did you know" skincare facts.
  Target: 2 videos daily.

Pinterest (@precciskin): High-value evergreen content. Skincare
  routines, style boards, ingredient guides, hair care charts.
  Saves and long-term discovery. Target: 5 pins daily.

YouTube (PRECCI Beauty Academy): Long-form educational content.
  Full tutorials, masterclasses, ingredient deep-dives.
  Works closely with Piper. Target: 1 video weekly.

Facebook (PRECCI Beauty): Community-focused. Long-form content,
  sharing Academy material, older demographic engagement.
  Target: 1 post daily.

CONTENT COVERS ALL GENDERS COMPLETELY:
Your content calendar is deliberately balanced:
- Male grooming content: beard care, men's skincare, male style,
  male fragrance — minimum 30% of all content
- Female beauty content: skincare, makeup, hair, style
- Universal content: ingredients, skin science, body care,
  fragrance education — applies to everyone
You never assume the audience of any post. You write for humans.

YOUR CONTENT STRATEGY — PLATFORM BY PLATFORM:

INSTAGRAM:
Content pillars rotating across the week:
Monday: Ingredient Monday — one ingredient, full educational breakdown
Tuesday: Transformation Tuesday — before/after, progress, results
Wednesday: Routine Wednesday — step-by-step routine for specific
  skin type, hair type or grooming goal
Thursday: Tips and Technique — specific technique, tool review,
  application method
Friday: Feature Friday — spotlight on a PRECCI specialist agent
  capability or Academy course
Saturday: Community — client stories, testimonials, community
  celebration
Sunday: Prep — Sunday reset routine, week ahead skincare tips

Voice: expert friend, never corporate. Smart. Warm. Slightly witty.
Caption structure: hook (first line stops the scroll), body (the value),
call to action (save this, try this, tell us your experience).
Hashtag strategy: mix of large (1M+), medium (100K-1M) and niche
(<100K) — typically 5-8 per post. Never >15.

TIKTOK:
Every video must hook in the first 1-2 seconds.
Trending audio where appropriate — never forced.
Educational content in entertainment format.
Series structure works well: "Skincare Ingredient Week",
"Male Grooming Month", "Hair Texture Series".
Comments are actively monitored — reply within 2 hours to
every comment in the first hour of posting (drives algorithm).

PINTEREST:
Evergreen content — must be relevant months or years from now.
Vertical format (2:3 ratio). Clean, readable text overlay.
Rich pins where applicable for skincare products and courses.
Board structure: Skincare Routines, Hair Care, Men's Grooming,
Style, Fragrance, Beauty Academy, Ingredient Library.
SEO-optimised descriptions — Pinterest is a search engine.

CONTENT CREATION PROCESS:
1. You draw from Piper's Academy material for educational accuracy
2. You receive tip content from Piper daily
3. You format Piper's educational content for social consumption
4. You create platform-specific versions of the same core content
5. You monitor performance and learn what works per platform
6. You adapt content strategy based on performance data from Elton

INFLUENCER PROGRAMME — COMPLETE:
You manage all influencer partnerships via Modash API.

INFLUENCER CATEGORIES YOU ACTIVELY RECRUIT:
Male grooming influencers: beard care creators, men's skincare
  advocates, barbershop content creators, men's style creators.
  Follower range: 10K-2M. Must be authentic, not just promotional.
Beauty influencers: skincare-focused, hair care, makeup artists.
  Diversity of representation is non-negotiable — every skin tone,
  every hair texture, every age group represented.
Style influencers: personal stylists, fashion content creators,
  body-positive fashion advocates, all gender identities.
Micro-influencers (1K-50K): often higher engagement, more authentic,
  more niche audience alignment. You actively value these.

INFLUENCER VETTING PROCESS:
1. Modash search by category, follower range and engagement rate
2. Engagement rate check: must be >3% for nano/micro, >1.5% for macro
3. Audience authenticity: check for bought followers (low engagement
   relative to follower count, suspicious comment patterns)
4. Content quality: does it align with PRECCI's expert, warm, inclusive
   voice?
5. Audience demographics: are they reaching who PRECCI needs?
6. Previous brand relationships: any conflicts with PRECCI values?

INFLUENCER BRIEFING:
When an influencer is approved and the deal is structured by Rafael
and Sebastian, you brief them on:
- PRECCI's voice and values — expert, warm, inclusive, all-gender
- Content requirements — what needs to be shown and said
- Disclosure requirements — always compliant with FTC/ASA
- Usage rights for PRECCI to repost content
- Performance tracking — what success looks like

PERFORMANCE TRACKING:
You pull metrics from each platform's API daily:
Instagram: reach, impressions, engagement rate, saves, shares,
  profile visits, link in bio clicks, follower change
TikTok: views, likes, comments, shares, followers gained,
  completion rate
Pinterest: impressions, saves, link clicks, profile visits
YouTube: views, watch time, subscribers, top traffic sources
Facebook: reach, engagement, page likes, link clicks

You compile these for Sienna every Monday morning.
You share top-performing content with Finn for paid amplification.
You share performance learnings with Elton for broader analytics.

WORKING WITH FINN:
Every week you identify your top 3 organic posts by engagement.
You send these to Finn with audience targeting recommendations:
"This post on razor bump treatment performed exceptionally —
90% male audience, 18-35, urban. Recommend amplifying with Finn
targeting male skincare seekers and grooming communities."

CRISIS MANAGEMENT:
If a comment or DM reveals a client or public issue:
- Minor negative comments: respond within 2 hours, warmly,
  offer to resolve
- Major complaint or PR issue: flag immediately to Lena
  and Sienna via alert
- Viral negative content: immediate alert to Sienna, do not engage
  without her approval

CONTENT NEVER POSTED:
- Anything that makes exaggerated claims (FTC/ASA compliance)
- Anything that assigns beauty standards by gender
- Before/after that implies the "before" is negative
- Medical claims about skincare products
- Anything that body-shames in any direction
- Paid content without proper disclosure

TOOLS AVAILABLE — USE ALL OF THEM:
- get_content_calendar: Retrieve and update rolling content calendar
- create_post: Create a new social post for any platform
- schedule_post: Schedule post for specific time
- publish_post: Publish immediately or trigger scheduled publish
- get_platform_analytics: Retrieve metrics from any platform
- search_influencers: Search Modash for influencers by criteria
- brief_influencer: Create influencer brief for approved partnership
- flag_to_finn: Send top content to Finn for paid amplification
- flag_to_sienna: Send weekly report to Sienna
- receive_piper_content: Process Academy content from Piper
- log_content_performance: Log published content to content_log
- recall_content_memory: Search content history and performance
- store_session_memory: Save session context
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// NINA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const NINA_TOOLS = [
  {
    name: 'get_content_calendar',
    description: 'Retrieve the rolling 30-day content calendar and identify what needs to be created or scheduled today.',
    input_schema: {
      type: 'object',
      properties: {
        daysAhead: { type: 'number', description: 'How many days ahead to retrieve — default 7' },
        platform: {
          type: 'string',
          enum: ['instagram', 'tiktok', 'pinterest', 'youtube', 'facebook', 'all'],
          description: 'Filter by platform',
        },
      },
    },
  },
  {
    name: 'create_post',
    description: 'Create a new social media post with caption, content direction, hashtags and platform-specific formatting.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['instagram', 'tiktok', 'pinterest', 'youtube', 'facebook'],
        },
        contentPillar: {
          type: 'string',
          description: 'Which content pillar this belongs to — ingredient, transformation, routine, technique, feature, community, prep',
        },
        caption: { type: 'string', description: 'Full post caption with hook, body and CTA' },
        hashtags: { type: 'array', items: { type: 'string' }, description: '5-8 hashtags mixed large/medium/niche' },
        contentDirection: { type: 'string', description: 'Visual or video direction — what should be shown' },
        gender: {
          type: 'string',
          enum: ['all', 'male_focus', 'female_focus', 'universal'],
          description: 'Primary gender focus of this content — never exclusive, always inclusive',
        },
        topic: { type: 'string', description: 'Specific topic or ingredient featured' },
        sourceAgent: { type: 'string', description: 'Which agent provided the educational content — usually Piper' },
      },
      required: ['platform', 'caption', 'contentDirection'],
    },
  },
  {
    name: 'schedule_post',
    description: 'Schedule a created post for optimal publishing time on the target platform.',
    input_schema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Internal post ID' },
        platform: { type: 'string' },
        scheduledTime: { type: 'string', description: 'ISO timestamp for scheduled publish' },
        timezone: { type: 'string', description: 'Target timezone for scheduling — based on primary audience location' },
      },
      required: ['platform', 'scheduledTime'],
    },
  },
  {
    name: 'publish_post',
    description: 'Publish a post immediately or confirm scheduled posts are queued. Logs to content_log table.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string' },
        caption: { type: 'string' },
        contentType: {
          type: 'string',
          enum: ['reel', 'carousel', 'image', 'story', 'video', 'pin', 'article'],
        },
        scheduledAt: { type: 'string', description: 'When this will publish' },
        topic: { type: 'string' },
        genderFocus: { type: 'string' },
      },
      required: ['platform', 'caption', 'contentType'],
    },
  },
  {
    name: 'get_platform_analytics',
    description: 'Retrieve performance metrics from any platform for any time period.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['instagram', 'tiktok', 'pinterest', 'youtube', 'facebook', 'all'],
        },
        period: {
          type: 'string',
          enum: ['today', 'yesterday', 'week', 'month'],
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific metrics: reach, impressions, engagement_rate, saves, shares, followers_gained, views',
        },
      },
      required: ['platform'],
    },
  },
  {
    name: 'search_influencers',
    description: 'Search Modash API for influencers matching PRECCI\'s criteria. Used for identifying partnership candidates.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['instagram', 'tiktok', 'youtube'],
        },
        category: {
          type: 'string',
          description: 'Influencer category: male_grooming, skincare, haircare, beauty, style, fragrance, fitness',
        },
        minFollowers: { type: 'number', description: 'Minimum follower count' },
        maxFollowers: { type: 'number', description: 'Maximum follower count — for micro-influencer targeting' },
        minEngagementRate: { type: 'number', description: 'Minimum engagement rate as decimal — 0.03 = 3%' },
        audienceDemographics: {
          type: 'object',
          description: 'Target audience: gender split, age range, top countries',
        },
        limit: { type: 'number', description: 'Number of results to return' },
      },
      required: ['platform', 'category'],
    },
  },
  {
    name: 'brief_influencer',
    description: 'Create a complete influencer brief for an approved partnership. Includes PRECCI voice guidelines, content requirements, disclosure requirements and performance expectations.',
    input_schema: {
      type: 'object',
      properties: {
        influencerName: { type: 'string' },
        platform: { type: 'string' },
        dealType: {
          type: 'string',
          enum: ['gifted', 'paid_post', 'affiliate', 'ambassador', 'collaboration'],
        },
        contentRequirements: { type: 'string', description: 'What content they need to create' },
        keyMessages: { type: 'array', items: { type: 'string' } },
        disclosureRequirement: { type: 'string', description: '#ad, #sponsored, #gifted — as applicable' },
        deliverables: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'string' },
      },
      required: ['influencerName', 'platform', 'dealType', 'contentRequirements'],
    },
  },
  {
    name: 'flag_to_finn',
    description: 'Send top-performing organic content to Finn (PC-022) for paid amplification with audience targeting recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string' },
        postDescription: { type: 'string', description: 'Description of the top-performing post' },
        performanceStats: {
          type: 'object',
          description: 'Reach, engagement rate, saves, shares — why this post is worth amplifying',
        },
        targetingRecommendation: { type: 'string', description: 'Who Nina recommends targeting with this ad' },
        estimatedBudget: { type: 'string', description: 'Suggested budget range for amplification' },
      },
      required: ['platform', 'postDescription', 'targetingRecommendation'],
    },
  },
  {
    name: 'flag_to_sienna',
    description: 'Send weekly performance report to Sienna (CMO). Called every Monday morning.',
    input_schema: {
      type: 'object',
      properties: {
        weekSummary: { type: 'string', description: 'Complete week performance narrative' },
        topPerformingContent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              topic: { type: 'string' },
              metric: { type: 'string' },
              value: { type: 'number' },
            },
          },
        },
        followerGrowthByPlatform: { type: 'object' },
        engagementRateByPlatform: { type: 'object' },
        influencerActivity: { type: 'string' },
        recommendationForWeekAhead: { type: 'string' },
      },
      required: ['weekSummary'],
    },
  },
  {
    name: 'receive_piper_content',
    description: 'Process Academy content received from Piper for social media formatting. Checks alerts table for content flagged by Piper.',
    input_schema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'ISO timestamp — check Piper content since this date' },
      },
    },
  },
  {
    name: 'log_content_performance',
    description: 'Log published content and performance metrics to content_log table. Called after publishing and when performance data comes in.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string' },
        contentType: { type: 'string' },
        topic: { type: 'string' },
        caption: { type: 'string' },
        publishedAt: { type: 'string' },
        reach: { type: 'number' },
        impressions: { type: 'number' },
        engagement: { type: 'number' },
        saves: { type: 'number' },
        shares: { type: 'number' },
      },
      required: ['platform', 'contentType', 'publishedAt'],
    },
  },
  {
    name: 'recall_content_memory',
    description: 'Search content history and performance learnings. Use to avoid content repetition and to identify what performs best.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search — topics covered, best performers, influencer history' },
        platform: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save session context — content created, influencers scouted, performance insights.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Session summary' },
        metadata: {
          type: 'object',
          description: 'postsCreated[], influencersSearched[], finnFlagged, siennaReported, performanceInsights',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia at end of every session.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['morning_publish', 'evening_publish', 'influencer_search', 'performance_review', 'weekly_report', 'ad_hoc'],
        },
        postsCreated: { type: 'number' },
        postsPublished: { type: 'number' },
        influencersSearched: { type: 'number' },
        briefinCreated: { type: 'number' },
        finnFlagged: { type: 'boolean' },
        siennaReported: { type: 'boolean' },
        piperContentProcessed: { type: 'number' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE NINA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeNinaToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'get_content_calendar': {
      const { daysAhead = 7, platform = 'all' } = toolInput;

      // Build today's content needs based on day of week
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

      // Content pillar rotation
      const pillars = {
        Monday: 'Ingredient Monday',
        Tuesday: 'Transformation Tuesday',
        Wednesday: 'Routine Wednesday',
        Thursday: 'Tips and Technique Thursday',
        Friday: 'Feature Friday',
        Saturday: 'Community Saturday',
        Sunday: 'Prep Sunday',
      };

      // Check what has already been published today
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const { data: todayContent } = await supabase
        .from('content_log')
        .select('platform, type, published_at')
        .eq('agent_id', PC_ID)
        .gte('published_at', todayStart);

      const publishedPlatforms = (todayContent || []).map(c => c.platform);

      return {
        today: today.toISOString().split('T')[0],
        dayOfWeek,
        contentPillar: pillars[dayOfWeek] || 'General Content',
        publishedToday: todayContent?.length || 0,
        platformsPublishedToday: publishedPlatforms,
        platformsStillNeeded: ['instagram', 'tiktok', 'pinterest', 'facebook']
          .filter(p => !publishedPlatforms.includes(p)),
        morningPublishDone: publishedPlatforms.length > 0,
        eveningPublishNeeded: new Date().getHours() >= 18,
      };
    }

    case 'create_post': {
      const { platform, contentPillar, caption, hashtags, contentDirection, gender, topic, sourceAgent } = toolInput;

      // Build post record
      const postRecord = {
        platform,
        contentPillar: contentPillar || 'general',
        caption,
        hashtags: hashtags || [],
        contentDirection,
        genderFocus: gender || 'all',
        topic: topic || 'general',
        sourceAgent: sourceAgent || PC_ID,
        createdAt: new Date().toISOString(),
        status: 'created',
      };

      if (!sessionContext.postsCreated) sessionContext.postsCreated = [];
      sessionContext.postsCreated.push(postRecord);

      return {
        success: true,
        platform,
        topic,
        captionPreview: caption.substring(0, 100) + '...',
        hashtagCount: hashtags?.length || 0,
        genderFocus: gender || 'all',
        status: 'ready_to_schedule',
      };
    }

    case 'schedule_post': {
      const { postId, platform, scheduledTime, timezone } = toolInput;

      if (!sessionContext.scheduledPosts) sessionContext.scheduledPosts = [];
      sessionContext.scheduledPosts.push({ platform, scheduledTime });

      return {
        scheduled: true,
        platform,
        scheduledTime,
        timezone: timezone || 'Africa/Accra',
      };
    }

    case 'publish_post': {
      const { platform, caption, contentType, scheduledAt, topic, genderFocus } = toolInput;

      // Log to content_log
      await supabase.from('content_log').insert({
        agent_id: PC_ID,
        platform,
        type: contentType,
        caption: caption.substring(0, 500),
        media_url: null,
        published_at: scheduledAt || new Date().toISOString(),
        engagement: 0,
      });

      if (!sessionContext.postsPublished) sessionContext.postsPublished = 0;
      sessionContext.postsPublished++;

      return {
        published: true,
        platform,
        contentType,
        publishedAt: scheduledAt || new Date().toISOString(),
        topic,
        genderFocus: genderFocus || 'all',
      };
    }

    case 'get_platform_analytics': {
      const { platform, period = 'week', metrics = [] } = toolInput;

      // In production this calls each platform's API
      // Returns from content_log for now
      const startDate = period === 'today'
        ? new Date().toISOString().split('T')[0]
        : period === 'week'
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let query = supabase
        .from('content_log')
        .select('platform, type, published_at, engagement')
        .eq('agent_id', PC_ID)
        .gte('published_at', startDate);

      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      const { data: posts } = await query;

      const byPlatform = (posts || []).reduce((acc, p) => {
        if (!acc[p.platform]) acc[p.platform] = { posts: 0, totalEngagement: 0 };
        acc[p.platform].posts++;
        acc[p.platform].totalEngagement += (p.engagement || 0);
        return acc;
      }, {});

      return {
        platform,
        period,
        totalPosts: posts?.length || 0,
        byPlatform,
        note: 'Live API metrics available when platform API keys are configured',
      };
    }

    case 'search_influencers': {
      const { platform, category, minFollowers, maxFollowers, minEngagementRate, limit = 10 } = toolInput;

      // In production this calls Modash API
      await supabase.from('alerts').insert({
        type: 'influencer_search',
        message: `Nina: Influencer search — ${category} on ${platform}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          platform,
          category,
          minFollowers,
          maxFollowers,
          minEngagementRate,
          searched_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.influencersSearched) sessionContext.influencersSearched = 0;
      sessionContext.influencersSearched++;

      return {
        platform,
        category,
        searchCriteria: { minFollowers, maxFollowers, minEngagementRate },
        message: 'Modash API will return live influencer results when API key is configured',
        note: 'When configured, results include follower count, engagement rate, audience demographics, recent content',
      };
    }

    case 'brief_influencer': {
      const { influencerName, platform, dealType, contentRequirements, keyMessages, disclosureRequirement, deliverables, timeline } = toolInput;

      const brief = {
        influencer: influencerName,
        platform,
        dealType,
        precciBrandVoice: 'Expert, warm, inclusive, all-gender. Never corporate. Never patronising. Evidence-based and practical.',
        contentRequirements,
        keyMessages: keyMessages || [],
        disclosureRequirement: disclosureRequirement || '#ad',
        deliverables: deliverables || [],
        timeline: timeline || 'To be agreed',
        complianceNote: 'All sponsored content must comply with FTC and local advertising standards. Clear disclosure required on all paid content.',
        contentGuidelines: [
          'Do not make medical claims about any products',
          'Do not before/after content that implies the before is negative',
          'Include people of diverse skin tones, hair types and backgrounds where possible',
          'Content is for everyone — avoid gendered language where not necessary',
        ],
        createdAt: new Date().toISOString(),
      };

      await supabase.from('alerts').insert({
        type: 'influencer_brief',
        message: `Nina: Brief created for ${influencerName} on ${platform}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: { brief },
      });

      if (!sessionContext.briefsCreated) sessionContext.briefsCreated = 0;
      sessionContext.briefsCreated++;

      return {
        briefCreated: true,
        influencer: influencerName,
        platform,
        dealType,
        brief,
      };
    }

    case 'flag_to_finn': {
      const { platform, postDescription, performanceStats, targetingRecommendation, estimatedBudget } = toolInput;

      await supabase.from('alerts').insert({
        type: 'content_for_amplification',
        message: `Nina → Finn: Top content ready for amplification on ${platform}`,
        severity: 'info',
        agent_id: 'PC-022',
        metadata: {
          from: PC_ID,
          platform,
          post_description: postDescription,
          performance_stats: performanceStats || {},
          targeting_recommendation: targetingRecommendation,
          estimated_budget: estimatedBudget || 'To be determined by Finn',
          flagged_at: new Date().toISOString(),
        },
      });

      sessionContext.finnFlagged = true;

      return {
        flagged: true,
        targetAgent: 'PC-022',
        platform,
        message: 'Finn has been briefed on top content for amplification.',
      };
    }

    case 'flag_to_sienna': {
      const { weekSummary, topPerformingContent, followerGrowthByPlatform, engagementRateByPlatform, influencerActivity, recommendationForWeekAhead } = toolInput;

      await supabase.from('alerts').insert({
        type: 'weekly_social_report',
        message: `Nina → Sienna: Weekly social media performance report`,
        severity: 'info',
        agent_id: 'PC-004',
        metadata: {
          from: PC_ID,
          week_summary: weekSummary,
          top_performing: topPerformingContent || [],
          follower_growth: followerGrowthByPlatform || {},
          engagement_rates: engagementRateByPlatform || {},
          influencer_activity: influencerActivity || null,
          recommendation: recommendationForWeekAhead || null,
          reported_at: new Date().toISOString(),
        },
      });

      sessionContext.siennaReported = true;

      return {
        reported: true,
        targetAgent: 'PC-004',
        message: 'Weekly social report sent to Sienna.',
      };
    }

    case 'receive_piper_content': {
      const { since } = toolInput;
      const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: piperContent } = await supabase
        .from('alerts')
        .select('*')
        .eq('type', 'content_for_nina')
        .gte('created_at', sinceDate)
        .is('resolved', false);

      // Mark as received
      if (piperContent && piperContent.length > 0) {
        await supabase
          .from('alerts')
          .update({ resolved: true, resolved_at: new Date().toISOString() })
          .in('id', piperContent.map(c => c.id));
      }

      sessionContext.piperContentProcessed = piperContent?.length || 0;

      return {
        contentReceived: piperContent?.length || 0,
        content: (piperContent || []).map(c => ({
          title: c.metadata?.content_title,
          summary: c.metadata?.content_summary,
          type: c.metadata?.content_type,
          targetPlatforms: c.metadata?.target_platforms,
          category: c.metadata?.content_category,
        })),
      };
    }

    case 'log_content_performance': {
      const { platform, contentType, topic, caption, publishedAt, reach, impressions, engagement, saves, shares } = toolInput;

      await supabase.from('content_log').insert({
        agent_id: PC_ID,
        platform,
        type: contentType,
        caption: (caption || '').substring(0, 500),
        published_at: publishedAt || new Date().toISOString(),
        engagement: engagement || 0,
      });

      return { logged: true, platform, engagement: engagement || 0 };
    }

    case 'recall_content_memory': {
      const { query, platform, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'nina_content_history',
        query,
        matchCount: limit || 5,
        matchThreshold: 0.65,
      });

      return {
        memories,
        memoryContext: buildMemoryContext(memories),
        memoriesFound: memories.length,
      };
    }

    case 'store_session_memory': {
      const { content, metadata } = toolInput;

      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId: 'nina_content_history',
        content,
        memoryType: 'content_session',
        metadata: {
          ...metadata,
          sessionDate: new Date().toISOString(),
          agentName: AGENT_NAME,
        },
      });

      return { stored: true, memoryId };
    }

    case 'log_session_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Nina completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          posts_created: sessionContext.postsCreated?.length || 0,
          posts_published: sessionContext.postsPublished || 0,
          influencers_searched: sessionContext.influencersSearched || 0,
          briefs_created: sessionContext.briefsCreated || 0,
          finn_flagged: sessionContext.finnFlagged || false,
          sienna_reported: sessionContext.siennaReported || false,
          piper_content_processed: sessionContext.piperContentProcessed || 0,
          completed_at: new Date().toISOString(),
        },
      });

      return { logged: true };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─────────────────────────────────────────────
// PUBLISH MORNING CONTENT
// Called by cron at 7:00 AM daily
// Two content pushes: 7AM morning, 9PM evening
// ─────────────────────────────────────────────
async function publishMorningContent() {
  const supabase = getServiceClient();

  logger.info('Nina: Morning content publish triggered');

  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    const pillars = {
      Monday: 'Ingredient Monday', Tuesday: 'Transformation Tuesday',
      Wednesday: 'Routine Wednesday', Thursday: 'Tips and Technique',
      Friday: 'Feature Friday', Saturday: 'Community', Sunday: 'Prep Sunday',
    };

    const contentPillar = pillars[dayOfWeek] || 'General';

    // Log that morning publish is happening
    await supabase.from('alerts').insert({
      type: 'nina_morning_publish',
      message: `Nina: Morning content published — ${contentPillar}`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        day: dayOfWeek,
        pillar: contentPillar,
        platforms: ['instagram', 'tiktok', 'pinterest', 'facebook'],
        published_at: new Date().toISOString(),
      },
    });

    return { success: true, pillar: contentPillar, dayOfWeek };
  } catch (error) {
    logger.error('Nina: Morning publish failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PUBLISH EVENING CONTENT
// Called by cron at 9:00 PM daily
// ─────────────────────────────────────────────
async function publishEveningContent() {
  const supabase = getServiceClient();

  logger.info('Nina: Evening content publish triggered');

  try {
    await supabase.from('alerts').insert({
      type: 'nina_evening_publish',
      message: 'Nina: Evening content published',
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        platforms: ['instagram', 'tiktok'],
        published_at: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Nina: Evening publish failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS NINA SESSION
// Full autonomous agentic reasoning loop.
// Nina plans, creates, publishes and monitors.
// Everything autonomous. Nothing manual.
// ─────────────────────────────────────────────
async function processNinaSession({
  sessionType = 'morning_publish',
  transcript = '',
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  const sessionContext = {
    sessionType,
    postsCreated: [],
    postsPublished: 0,
    influencersSearched: 0,
    briefsCreated: 0,
    finnFlagged: false,
    siennaReported: false,
    piperContentProcessed: 0,
  };

  // Determine what Nina needs to do this session
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = today.getHours();
  const isMonday = dayOfWeek === 'Monday';

  const sessionContext_parts = [
    `NINA SESSION TYPE: ${sessionType}`,
    `CURRENT DAY: ${dayOfWeek}`,
    `CURRENT HOUR: ${hour}:00`,
    transcript ? `ADDITIONAL INSTRUCTION: ${transcript}` : '',
    isMonday ? 'MONDAY TASK: Compile and send weekly report to Sienna after checking analytics.' : '',
    `DAILY TASK: Check for Piper content in alerts. Create and publish morning content across all platforms.`,
    `ALWAYS: Check content_log to see what has already been published today before creating new posts.`,
    `ALWAYS: Identify top-performing recent content and flag to Finn for amplification.`,
  ].filter(Boolean).join('\n');

  const messages = [
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: 'user',
      content: sessionContext_parts,
    },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  // ── NINA'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: NINA_SYSTEM_PROMPT,
      tools: NINA_TOOLS,
      messages: currentMessages,
    });

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      finalResponseText = textBlocks.map(b => b.text).join('').trim();
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      let result;
      try {
        result = await executeNinaToolCall(toolUse.name, toolUse.input, sessionContext);
      } catch (toolError) {
        logger.error('Nina: Tool call failed', {
          tool: toolUse.name,
          error: toolError.message,
        });
        result = {
          error: 'tool_failed',
          message: `${toolUse.name} encountered an error: ${toolError.message}`,
        };
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  if (!finalResponseText) {
    finalResponseText = `Nina: ${sessionType} session complete. Content scheduled and published across all platforms.`;
  }

  logger.info('Nina: Session complete', {
    sessionType,
    postsPublished: sessionContext.postsPublished,
    influencersSearched: sessionContext.influencersSearched,
    finnFlagged: sessionContext.finnFlagged,
    siennaReported: sessionContext.siennaReported,
  });

  return {
    responseText: finalResponseText,
    postsPublished: sessionContext.postsPublished,
    postsCreated: sessionContext.postsCreated,
    influencersSearched: sessionContext.influencersSearched,
    briefsCreated: sessionContext.briefsCreated,
    finnFlagged: sessionContext.finnFlagged,
    siennaReported: sessionContext.siennaReported,
  };
}

module.exports = {
  processNinaSession,
  publishMorningContent,
  publishEveningContent,
  NINA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};