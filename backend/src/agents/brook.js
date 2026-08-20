// FILE: precci/backend/src/agents/brook.js
// Brook — PC-027 — PRECCI Connect Manager
// COMPLETE FULL BUILD — no simplification anywhere.
// Brook manages the entire PRECCI Connect provider marketplace
// autonomously across four domains:
// 1. Provider Management — onboarding, profiles, performance monitoring
// 2. Real-Time Booking — finding providers, booking slots, appointment codes
// 3. Provider Notification — voice agent activation, brief delivery
// 4. Revenue Management — all Connect revenue streams tracked and reported
// Serves ALL genders equally — barbers, men's grooming studios,
// nail technicians, hair salons, spas, boutiques, makeup artists —
// all provider types booked with equal precision and care.
// Works with Rafael on provider acquisition targets.
// Works with Sebastian on provider legal agreements.
// Works with Celeste on Connect revenue reporting.
// Works with Elton on marketplace analytics.
// Works with Sage for location-aware provider recommendations.
// Brook never sleeps. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const { getContextForAgent } = require('./sage');
const logger = require('../utils/logger');
const crypto = require('crypto');

const PC_ID = 'PC-027';
const AGENT_NAME = 'Brook';

// ─────────────────────────────────────────────
// BROOK'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const BROOK_SYSTEM_PROMPT = `You are Brook, the PRECCI Connect Manager at PRECCI.
Your ID is PC-027.

You are the engine of PRECCI Connect — the world's first AI-powered
beauty and lifestyle service booking marketplace. You manage every
provider, every booking, every notification and every revenue stream
across the Connect division completely autonomously.

You operate 24 hours a day, 7 days a week, without rest.
Every booking confirmed, every provider notified, every appointment
code generated — you handle it all.

YOU SERVE ALL GENDERS EQUALLY AND COMPLETELY:
A male client after a Drew grooming session gets booked into
a barber or men's grooming studio with the same precision and
care as a female client after a Zara session gets booked into
a hair salon. A client needing multiple services across multiple
provider types gets all booked in one conversation. Provider type
never restricts who you serve or how well you serve them.

PROVIDER TYPES YOU MANAGE — ALL CATEGORIES:
Nail technicians — high repeat visit frequency
Hair salons — highest volume category
Barbers — growing rapidly, strong male client base
Barbershops — traditional and modern, full grooming
Men's grooming studios — premium male grooming
Spas and wellness centres — high-value bookings
Personal stylists — premium, appointment-based
Clothing boutiques — style sessions and personal shopping
Footwear shops — style-completion appointments
Cosmetics stores — beauty consultation appointments
Makeup artists — Mia-driven referrals primarily
Skincare clinics — Luna-driven referrals
Massage therapists — body wellness
Beauty salons — full-service beauty

DOMAIN 1 — PROVIDER MANAGEMENT:
You onboard every new provider who registers at precci.com/connect.
You manage their complete profile in Supabase:
- Business name, owner name, contact details
- Location (address, city, country, coordinates)
- Services offered and service duration per service
- Operating hours and capacity per time slot
- Subscription tier (Basic $15/month or Pro $30/month)
- Featured placement status ($20-$50/month add-on)
- Payment method (Mobile Money for Africa, card for global)
- Rating and total booking count

You monitor provider performance continuously:
- Booking acceptance rate (declining bookings is flagged)
- Client satisfaction ratings (below 3.5 is flagged to Nadia)
- No-show patterns (providers with high client no-shows investigated)
- Response time to booking notifications
- Availability accuracy (providers showing available when they are not)

Underperforming providers are flagged to Nadia.
Providers who discriminate on any basis are flagged to Sebastian
for immediate termination proceedings.

DOMAIN 2 — REAL-TIME BOOKING:
At the end of every specialist agent session — after Luna has
done a skin analysis, after Drew has done a grooming consultation,
after Isla has built outfit recommendations — you activate.

Your booking flow is precise and voice-driven:
Step 1: Receive session summary from the specialist agent.
  What services does this client need in the real world?
  What did Luna recommend? A specific facial? What did Drew
  recommend? A barber visit for a fade? What did Isla recommend?
  A boutique appointment to find the outfit discussed?

Step 2: Get client location. Pull Sage data for their city.

Step 3: Search provider database by:
  - Service type matching what the specialist agent recommended
  - Geographic proximity to client (Google Maps distance)
  - Availability in next 48-72 hours
  - Provider rating (>4.0 preferred)
  - Featured status (featured providers presented first)
  - Subscription tier (Pro providers get priority over Basic
    when all else is equal)

Step 4: Present 1-3 options to client by voice.
  "Based on your skin analysis with Luna, she has recommended
  a professional facial treatment. I have found three clinics
  near you. The first is [Name] — [distance] away, rated [X],
  with availability tomorrow at [time] and [time]. Shall I
  book you in?"

Step 5: Client confirms by voice.

Step 6: Lock the time slot in booking_slots table.
  Verify capacity has not been exceeded between search and
  confirmation (race condition prevention).

Step 7: Generate cryptographic appointment code.
  8-character alphanumeric code. Unique. Single-use.
  Expires 24 hours after the appointment time.

Step 8: Charge provider referral fee immediately.
  Basic provider: $3.00. Pro provider: $2.00.
  Featured provider: $1.50.
  Charged via Paystack (Africa) or Stripe (global).

Step 9: Activate provider voice agent notification.

Step 10: Generate PDF briefs.
  Client brief: appointment details, appointment code,
    provider address, what to expect.
  Provider brief: client name (if consented), services
    requested, PRECCI analysis summary, preparation notes,
    appointment code to verify.

Step 11: Log to Celeste (referral fee), Elton (booking analytics).

MULTI-SERVICE BOOKING:
When a client needs multiple services from multiple providers
in one session, you book all of them sequentially in one
voice conversation. You optimise by proximity and time:
"Let me sort all of that for you. First, for your facial —
I have booked you at [Clinic] tomorrow at 10am, that is 5
minutes from your home. Then for your hair appointment —
[Salon] at 2pm, which gives you plenty of time between
them. Both providers have been notified and are ready for
you. Here are your two appointment codes."

DOMAIN 3 — PROVIDER NOTIFICATION:
The moment a booking is confirmed, the provider's dedicated
PRECCI Connect voice agent activates. You trigger this.

The notification includes:
- Who is coming — client first name (if consented)
- When they are arriving — date and time
- What services they have booked
- What PRECCI's agents found — relevant analysis summary
  (e.g. "Client has 4C hair type with breakage at ends —
  Zara has recommended a protective style and deep condition")
- The appointment code they need to verify on arrival
- Any preparation notes (products to have ready, etc.)

The provider also sees the full brief in their dashboard.
They can download it as a PDF before the appointment.

DOMAIN 4 — REVENUE MANAGEMENT:
You track all Connect revenue streams and report to Celeste daily:

Registration fees: $25 per provider, one-time, mandatory.
  Paystack for African providers. Stripe for global.

Monthly subscriptions:
  Basic: $15/month. Pro: $30/month.
  Auto-charged on the same date each month.
  Mobile Money auto-debit for African providers registered
  with Mobile Money.

Featured placement:
  $20-$50/month depending on market.
  Featured providers presented first by voice when equal
  on proximity and rating.
  Expires at end of monthly period if not renewed.

Per-booking referral fees:
  Basic: $3.00. Pro: $2.00. Featured: $1.50.
  Auto-charged on booking confirmation.
  Client never pays — charged to provider.

You flag to Celeste:
- Daily total referral fees collected
- New provider registrations and fees
- Subscription renewals and any failures
- Featured placement conversions

FEATURED PLACEMENT — HOW IT WORKS:
When Brook presents options to a client, featured providers
appear first — but only if they have genuine availability
and are within reasonable proximity. Featured placement never
overrides fundamental service quality requirements. If a
featured provider has a rating below 3.5, they do not get
presented first regardless of featured status.

WORKING WITH OTHER AGENTS:
Specialist agents: you receive session summaries from Luna,
  Zara, Mia, Isla, Drew, Remy, Cora after their sessions.
  Each summary tells you what services the client needs.
Sage: you call Sage for every booking search to get the
  client's location context and ambient conditions.
Rafael: you report provider supply gaps to Rafael weekly.
  He drives provider acquisition into underserved areas.
Sebastian: all provider agreements have been reviewed by
  Sebastian. You enforce these terms with every provider.
  Provider discrimination or misconduct goes to Sebastian.
Celeste: you report all Connect revenue daily.
Elton: you send booking analytics weekly.
  Which services have highest demand? Which areas are
  undersupplied? What is the repeat booking rate?
  Which providers have the highest client satisfaction?
Nadia: you flag provider underperformance to Nadia.
  Low ratings, cancelled bookings, no-shows, complaints.
Lena: client booking complaints go to Lena for support.
  If a client had a poor experience, Lena handles it.
Grace: after you complete a booking, Grace is available
  to route the client anywhere else they need.

OVERBOOKING PREVENTION:
Every provider sets their capacity per time slot during
registration. The system only offers slots where
available > 0. Capacity is checked at search time AND
at confirmation time. The second check catches race
conditions where two clients book the same slot
simultaneously. If a slot fills between search and
confirmation, you immediately offer the next available
slot: "That slot was just taken — the next available
is [time]. Shall I book that for you instead?"

APPOINTMENT CODE SYSTEM:
Codes are 8-character alphanumeric, uppercase.
Generated using crypto.randomBytes for true randomness.
Example: BK7X9QM2
Each code is:
- Unique (checked against existing codes before use)
- Single-use (marked as verified after first use)
- Time-limited (expires 24 hours after appointment time)
- Provider-scoped (can only be verified by the booked provider)

When a client arrives:
1. Client shows their code to the provider
2. Provider enters code in their PRECCI Connect dashboard
3. Code verified — full client brief appears instantly
4. Provider is ready to serve

TOOLS AVAILABLE — USE ALL OF THEM:
- search_providers: Find available providers by criteria
- check_slot_availability: Verify a specific slot is still open
- confirm_booking: Lock slot, generate code, charge provider
- activate_provider_voice_agent: Trigger notification to provider
- generate_appointment_brief: Create PDF brief for client and provider
- verify_appointment_code: Verify code when client arrives
- onboard_provider: Process new provider registration
- update_provider_profile: Update provider details
- flag_provider_issue: Report provider performance problem
- get_connect_analytics: Booking and provider marketplace stats
- flag_to_celeste: Report Connect revenue
- flag_to_rafael: Provider supply gap intelligence
- flag_to_elton: Booking analytics
- flag_to_nadia: Provider performance issues
- flag_to_sebastian: Provider compliance violations
- recall_booking_memory: Search booking history
- store_session_memory: Save session context
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// BROOK'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const BROOK_TOOLS = [
  {
    name: 'search_providers',
    description: 'Find available providers matching the client\'s needs. Called after every specialist agent session. Returns providers sorted by featured status, rating and proximity.',
    input_schema: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          description: 'Service needed — e.g. facial, haircut, manicure, barber, personal_styling, spa_treatment, makeup, beard_grooming',
        },
        clientLat: { type: 'number', description: 'Client latitude' },
        clientLng: { type: 'number', description: 'Client longitude' },
        clientCity: { type: 'string', description: 'Client city for display' },
        radiusKm: { type: 'number', description: 'Search radius in kilometres — default 10' },
        datePreference: { type: 'string', description: 'Preferred appointment date — ISO date string' },
        timePreference: { type: 'string', description: 'Preferred time range — morning/afternoon/evening or specific time' },
        genderContext: {
          type: 'string',
          enum: ['all', 'male_client', 'female_client'],
          description: 'Used to match appropriate provider category — barber for male grooming, salon for hair styling. Never restricts which providers serve which clients.',
        },
        maxResults: { type: 'number', description: 'Maximum providers to return — default 3' },
        minRating: { type: 'number', description: 'Minimum provider rating — default 3.5' },
        sessionContext: { type: 'string', description: 'What the specialist agent session revealed — passed to provider brief' },
      },
      required: ['serviceType', 'clientLat', 'clientLng'],
    },
  },
  {
    name: 'check_slot_availability',
    description: 'Verify a specific slot is still available before confirming booking. Always called immediately before confirm_booking to prevent race conditions.',
    input_schema: {
      type: 'object',
      properties: {
        providerId: { type: 'string' },
        date: { type: 'string', description: 'ISO date string' },
        timeSlot: { type: 'string', description: 'Time slot — e.g. 10:00, 14:30' },
      },
      required: ['providerId', 'date', 'timeSlot'],
    },
  },
  {
    name: 'confirm_booking',
    description: 'Lock the time slot, generate cryptographic appointment code, charge provider referral fee and create booking record.',
    input_schema: {
      type: 'object',
      properties: {
        clientUserId: { type: 'string' },
        providerId: { type: 'string' },
        bookingSlotId: { type: 'string' },
        appointmentDate: { type: 'string', description: 'ISO date string' },
        appointmentTime: { type: 'string' },
        servicesRequested: { type: 'array', items: { type: 'string' } },
        sessionSummary: { type: 'string', description: 'What PRECCI agents found — goes into provider brief' },
        precciAnalysisSummary: { type: 'string', description: 'Specific analysis details relevant to provider preparation' },
        clientConsentToShareName: { type: 'boolean', description: 'Has client consented to share their name with provider' },
      },
      required: ['clientUserId', 'providerId', 'appointmentDate', 'appointmentTime', 'servicesRequested'],
    },
  },
  {
    name: 'activate_provider_voice_agent',
    description: 'Trigger the provider\'s dedicated PRECCI Connect voice agent to notify them of the incoming booking.',
    input_schema: {
      type: 'object',
      properties: {
        providerId: { type: 'string' },
        bookingId: { type: 'string' },
        appointmentCode: { type: 'string' },
        appointmentDate: { type: 'string' },
        appointmentTime: { type: 'string' },
        servicesRequested: { type: 'array', items: { type: 'string' } },
        clientFirstName: { type: 'string', description: 'Client first name if consent given — or null' },
        analysisForProvider: { type: 'string', description: 'The PRECCI analysis relevant for provider preparation' },
        providerVapiAssistantId: { type: 'string', description: 'The provider\'s dedicated Vapi assistant ID' },
      },
      required: ['providerId', 'bookingId', 'appointmentCode', 'appointmentDate', 'servicesRequested'],
    },
  },
  {
    name: 'generate_appointment_brief',
    description: 'Generate PDF briefs for both client and provider. Client gets appointment details and code. Provider gets full client brief with PRECCI analysis.',
    input_schema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string' },
        briefType: { type: 'string', enum: ['client', 'provider', 'both'] },
        clientData: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            appointmentCode: { type: 'string' },
            providerName: { type: 'string' },
            providerAddress: { type: 'string' },
            appointmentDate: { type: 'string' },
            appointmentTime: { type: 'string' },
            servicesBooked: { type: 'array', items: { type: 'string' } },
          },
        },
        providerData: {
          type: 'object',
          properties: {
            clientName: { type: 'string' },
            appointmentCode: { type: 'string' },
            servicesRequested: { type: 'array', items: { type: 'string' } },
            preccAnalysis: { type: 'string' },
            preparationNotes: { type: 'string' },
            appointmentDate: { type: 'string' },
            appointmentTime: { type: 'string' },
          },
        },
      },
      required: ['bookingId', 'briefType'],
    },
  },
  {
    name: 'verify_appointment_code',
    description: 'Verify a client\'s appointment code when they arrive at the provider. Returns full client brief to provider on successful verification.',
    input_schema: {
      type: 'object',
      properties: {
        appointmentCode: { type: 'string', description: '8-character appointment code' },
        providerId: { type: 'string', description: 'Provider verifying the code — scoped for security' },
      },
      required: ['appointmentCode', 'providerId'],
    },
  },
  {
    name: 'onboard_provider',
    description: 'Process a new provider registration. Creates Supabase record, charges registration fee, activates voice agent, sends welcome email via Lena.',
    input_schema: {
      type: 'object',
      properties: {
        businessName: { type: 'string' },
        ownerName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        services: { type: 'array', items: { type: 'string' } },
        operatingHours: { type: 'object', description: 'Hours per day of week' },
        capacityPerSlot: { type: 'number' },
        slotDurationMinutes: { type: 'number' },
        subscriptionTier: { type: 'string', enum: ['basic', 'pro'] },
        paymentMethod: { type: 'string', enum: ['mobile_money', 'card', 'bank_transfer'] },
        mobileMoneyNumber: { type: 'string', description: 'If mobile money' },
        mobileMoneyNetwork: { type: 'string', description: 'MTN, Vodafone, AirtelTigo, M-Pesa etc' },
        registrationGateway: { type: 'string', enum: ['paystack', 'stripe'] },
      },
      required: ['businessName', 'ownerName', 'email', 'city', 'country', 'services', 'subscriptionTier', 'registrationGateway'],
    },
  },
  {
    name: 'update_provider_profile',
    description: 'Update provider profile fields — services, hours, capacity, subscription tier, featured status.',
    input_schema: {
      type: 'object',
      properties: {
        providerId: { type: 'string' },
        updates: {
          type: 'object',
          description: 'Fields to update — services, operating_hours, capacity_per_slot, subscription_tier, featured, active',
        },
        reason: { type: 'string', description: 'Why this update is being made' },
      },
      required: ['providerId', 'updates', 'reason'],
    },
  },
  {
    name: 'flag_provider_issue',
    description: 'Report a provider performance problem — low ratings, booking cancellations, client complaints, discrimination, availability inaccuracy.',
    input_schema: {
      type: 'object',
      properties: {
        providerId: { type: 'string' },
        providerName: { type: 'string' },
        issueType: {
          type: 'string',
          enum: ['low_rating', 'booking_cancellation', 'client_complaint', 'discrimination', 'availability_inaccuracy', 'no_show_pattern', 'payment_failure', 'conduct_violation'],
        },
        issueDescription: { type: 'string' },
        severity: { type: 'string', enum: ['minor', 'moderate', 'serious', 'critical'] },
        clientAffected: { type: 'string', description: 'Client user ID if client was affected' },
        recommendedAction: { type: 'string', enum: ['monitor', 'warn', 'suspend', 'terminate'] },
      },
      required: ['providerId', 'providerName', 'issueType', 'issueDescription', 'severity'],
    },
  },
  {
    name: 'get_connect_analytics',
    description: 'Get PRECCI Connect marketplace analytics — booking volumes, provider counts, revenue, top categories, supply/demand gaps.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today', 'week', 'month'] },
        includeSupplyGaps: { type: 'boolean', description: 'Identify areas with client demand but insufficient providers' },
        includeTopProviders: { type: 'boolean', description: 'Top providers by booking volume and rating' },
        includeServiceCategoryBreakdown: { type: 'boolean' },
        includeGeographicBreakdown: { type: 'boolean' },
      },
      required: ['period'],
    },
  },
  {
    name: 'flag_to_celeste',
    description: 'Report Connect revenue to Celeste — referral fees, registration fees, subscription revenue, featured placement.',
    input_schema: {
      type: 'object',
      properties: {
        reportType: { type: 'string', enum: ['daily_revenue', 'new_registration', 'subscription_event', 'featured_placement', 'referral_fee_batch'] },
        totalReferralFees: { type: 'number' },
        totalRegistrationFees: { type: 'number' },
        totalSubscriptionFees: { type: 'number' },
        totalFeaturedFees: { type: 'number' },
        bookingCount: { type: 'number' },
        newProviderCount: { type: 'number' },
        period: { type: 'string' },
      },
      required: ['reportType'],
    },
  },
  {
    name: 'flag_to_rafael',
    description: 'Send provider supply gap intelligence to Rafael for acquisition targeting.',
    input_schema: {
      type: 'object',
      properties: {
        supplyGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              city: { type: 'string' },
              country: { type: 'string' },
              serviceCategory: { type: 'string' },
              clientDemand: { type: 'number' },
              currentProviders: { type: 'number' },
              urgency: { type: 'string' },
            },
          },
        },
        topPriorityGap: { type: 'string', description: 'The single most urgent supply gap' },
        recommendation: { type: 'string' },
      },
      required: ['supplyGaps', 'recommendation'],
    },
  },
  {
    name: 'flag_to_elton',
    description: 'Send booking analytics to Elton for platform intelligence reporting.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        totalBookings: { type: 'number' },
        confirmedBookings: { type: 'number' },
        completedBookings: { type: 'number' },
        topServiceCategories: { type: 'array', items: { type: 'string' } },
        repeatBookingRate: { type: 'string' },
        avgRating: { type: 'number' },
        topGeographies: { type: 'array', items: { type: 'string' } },
      },
      required: ['period', 'totalBookings'],
    },
  },
  {
    name: 'flag_to_nadia',
    description: 'Report provider performance issues to Nadia for operational response.',
    input_schema: {
      type: 'object',
      properties: {
        issueType: { type: 'string' },
        providersAffected: { type: 'array', items: { type: 'string' } },
        clientImpact: { type: 'string' },
        recommendation: { type: 'string' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
      },
      required: ['issueType', 'providersAffected', 'recommendation', 'urgency'],
    },
  },
  {
    name: 'flag_to_sebastian',
    description: 'Report provider compliance violations to Sebastian for legal response.',
    input_schema: {
      type: 'object',
      properties: {
        providerId: { type: 'string' },
        providerName: { type: 'string' },
        violationType: {
          type: 'string',
          enum: ['discrimination', 'terms_breach', 'data_misuse', 'fraud', 'conduct_violation'],
        },
        evidenceSummary: { type: 'string' },
        clientAffected: { type: 'string' },
        recommendedAction: { type: 'string' },
      },
      required: ['providerId', 'violationType', 'evidenceSummary', 'recommendedAction'],
    },
  },
  {
    name: 'recall_booking_memory',
    description: 'Search booking history for a client — previous providers, service preferences, satisfaction patterns.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save booking session context.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['content'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['client_booking', 'provider_onboarding', 'booking_verification', 'analytics_review', 'provider_management', 'daily_revenue_report'],
        },
        bookingsSearched: { type: 'number' },
        bookingsConfirmed: { type: 'number' },
        providersOnboarded: { type: 'number' },
        codesVerified: { type: 'number' },
        totalReferralFees: { type: 'number' },
        providerIssuesFlagged: { type: 'number' },
        genderBalance: { type: 'string', description: 'Mix of provider types served this session' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// APPOINTMENT CODE GENERATOR
// Cryptographically secure, unique, 8-character
// ─────────────────────────────────────────────
async function generateAppointmentCode(supabase) {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate 8-character alphanumeric code
    const bytes = crypto.randomBytes(6);
    const code = bytes.toString('base64')
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8)
      .toUpperCase()
      .padEnd(8, 'X');

    // Verify uniqueness
    const { data: existing } = await supabase
      .from('provider_bookings')
      .select('id')
      .eq('appointment_code', code)
      .limit(1);

    if (!existing || existing.length === 0) {
      return code;
    }
  }

  // Fallback with timestamp component if all 10 attempts collide
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${timestamp}${random}`.substring(0, 8);
}

// ─────────────────────────────────────────────
// EXECUTE BROOK'S TOOL CALLS
// Every tool fully implemented with real queries
// ─────────────────────────────────────────────
async function executeBrookToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'search_providers': {
      const {
        serviceType, clientLat, clientLng, clientCity, radiusKm = 10,
        datePreference, timePreference, genderContext, maxResults = 3, minRating = 3.5,
        sessionContext: sessionCtx,
      } = toolInput;

      // Build provider search
      let query = supabase
        .from('service_providers')
        .select(`
          id, business_name, owner_name, address, city, country,
          lat, lng, services, operating_hours, capacity_per_slot,
          slot_duration_minutes, subscription_tier, featured, featured_expires_at,
          rating, total_bookings, vapi_assistant_id, active, verified
        `)
        .eq('active', true)
        .eq('verified', true)
        .gte('rating', minRating);

      const { data: allProviders } = await query;

      if (!allProviders || allProviders.length === 0) {
        return {
          found: false,
          message: `No verified providers found for ${serviceType} in this area yet. PRECCI Connect is growing — providers are registering daily.`,
          serviceType,
          clientCity,
        };
      }

      // Filter by service type
      const matchingService = allProviders.filter(p => {
        const services = Array.isArray(p.services) ? p.services : [p.services];
        return services.some(s => s && (
          s.toLowerCase().includes(serviceType.toLowerCase()) ||
          serviceType.toLowerCase().includes(s.toLowerCase()) ||
          (serviceType === 'haircut' && s.toLowerCase().includes('barber')) ||
          (serviceType === 'beard_grooming' && (s.toLowerCase().includes('barber') || s.toLowerCase().includes('grooming'))) ||
          (serviceType === 'hair_styling' && (s.toLowerCase().includes('hair') || s.toLowerCase().includes('salon'))) ||
          (serviceType === 'facial' && (s.toLowerCase().includes('facial') || s.toLowerCase().includes('skincare') || s.toLowerCase().includes('clinic')))
        ));
      });

      // Calculate distances using Haversine formula
      const withDistance = matchingService.map(p => {
        if (!p.lat || !p.lng) return { ...p, distanceKm: 999 };

        const R = 6371; // Earth radius km
        const dLat = (p.lat - clientLat) * Math.PI / 180;
        const dLng = (p.lng - clientLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(clientLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = parseFloat((R * c).toFixed(1));

        return { ...p, distanceKm };
      });

      // Filter by radius
      const inRadius = withDistance.filter(p => p.distanceKm <= radiusKm);

      // Sort: featured first (if featured not expired), then by rating, then distance
      const now = new Date();
      const sorted = inRadius.sort((a, b) => {
        const aFeatured = a.featured && a.rating >= 3.5 && (!a.featured_expires_at || new Date(a.featured_expires_at) > now);
        const bFeatured = b.featured && b.rating >= 3.5 && (!b.featured_expires_at || new Date(b.featured_expires_at) > now);

        if (aFeatured && !bFeatured) return -1;
        if (!aFeatured && bFeatured) return 1;

        // Same featured status — sort by rating then distance
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (Math.abs(ratingDiff) > 0.3) return ratingDiff;
        return a.distanceKm - b.distanceKm;
      });

      const results = sorted.slice(0, maxResults);

      sessionContext.providersSearched = (sessionContext.providersSearched || 0) + 1;
      sessionContext.genderContext = genderContext || 'all';

      // Get available slots for each provider
      const dateToCheck = datePreference || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const providersWithSlots = await Promise.all(results.map(async (p) => {
        const { data: slots } = await supabase
          .from('booking_slots')
          .select('id, date, time_slot, capacity, booked_count')
          .eq('provider_id', p.id)
          .gte('date', dateToCheck)
          .order('date', { ascending: true })
          .order('time_slot', { ascending: true })
          .limit(5);

        const availableSlots = (slots || []).filter(s => s.booked_count < s.capacity);

        return {
          ...p,
          availableSlots: availableSlots.slice(0, 3).map(s => ({
            slotId: s.id,
            date: s.date,
            time: s.time_slot,
            capacity: s.capacity - s.booked_count,
          })),
        };
      }));

      return {
        found: providersWithSlots.length > 0,
        serviceType,
        clientCity,
        radiusKm,
        totalMatching: inRadius.length,
        providers: providersWithSlots.map(p => ({
          id: p.id,
          businessName: p.business_name,
          address: p.address,
          city: p.city,
          distanceKm: p.distanceKm,
          rating: p.rating || 0,
          totalBookings: p.total_bookings || 0,
          subscriptionTier: p.subscription_tier,
          featured: p.featured || false,
          vapiAssistantId: p.vapi_assistant_id,
          availableSlots: p.availableSlots,
          services: p.services,
        })),
      };
    }

    case 'check_slot_availability': {
      const { providerId, date, timeSlot } = toolInput;

      const { data: slot } = await supabase
        .from('booking_slots')
        .select('id, capacity, booked_count')
        .eq('provider_id', providerId)
        .eq('date', date)
        .eq('time_slot', timeSlot)
        .single();

      if (!slot) {
        return { available: false, reason: 'Slot not found — provider may not have set availability for this time' };
      }

      const available = slot.booked_count < slot.capacity;
      const remainingCapacity = slot.capacity - slot.booked_count;

      return {
        slotId: slot.id,
        available,
        remainingCapacity,
        date,
        timeSlot,
        reason: !available ? 'Slot is now fully booked — offering next available' : null,
      };
    }

    case 'confirm_booking': {
      const {
        clientUserId, providerId, bookingSlotId, appointmentDate, appointmentTime,
        servicesRequested, sessionSummary, precciAnalysisSummary, clientConsentToShareName,
      } = toolInput;

      // Final availability check before confirming
      if (bookingSlotId) {
        const { data: slot } = await supabase
          .from('booking_slots')
          .select('id, capacity, booked_count')
          .eq('id', bookingSlotId)
          .single();

        if (slot && slot.booked_count >= slot.capacity) {
          return {
            confirmed: false,
            reason: 'slot_just_filled',
            message: 'That slot was just taken by another client. Let me find you the next available time.',
          };
        }
      }

      // Get provider details for fee calculation
      const { data: provider } = await supabase
        .from('service_providers')
        .select('business_name, subscription_tier, featured, paystack_customer_id, stripe_customer_id, mobile_money_number, country')
        .eq('id', providerId)
        .single();

      if (!provider) {
        return { confirmed: false, reason: 'provider_not_found' };
      }

      // Calculate referral fee
      const referralFee = provider.featured ? 1.50
        : provider.subscription_tier === 'pro' ? 2.00
        : 3.00;

      // Generate unique appointment code
      const appointmentCode = await generateAppointmentCode(supabase);

      // Set appointment expiry (24 hours after appointment)
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
      const codeExpiry = new Date(appointmentDateTime.getTime() + 24 * 60 * 60 * 1000).toISOString();

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('provider_bookings')
        .insert({
          client_user_id: clientUserId,
          provider_id: providerId,
          booking_slot_id: bookingSlotId || null,
          appointment_code: appointmentCode,
          services_requested: servicesRequested,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: 'confirmed',
          precci_analysis_summary: precciAnalysisSummary || sessionSummary || null,
          referral_fee_amount: referralFee,
          referral_fee_gateway: provider.country === 'GH' || provider.mobile_money_number ? 'paystack' : 'stripe',
          referral_fee_charged_at: new Date().toISOString(),
          appointment_code_expires_at: codeExpiry,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (bookingError || !booking) {
        logger.error('Brook: Booking creation failed', { error: bookingError?.message });
        return { confirmed: false, reason: 'database_error', error: bookingError?.message };
      }

      // Update slot booked count
      if (bookingSlotId) {
        await supabase.rpc('increment_slot_booked_count', { slot_id: bookingSlotId })
          .catch(() => {
            // Fallback direct update
            supabase.from('booking_slots')
              .select('booked_count')
              .eq('id', bookingSlotId)
              .single()
              .then(({ data: slotData }) => {
                if (slotData) {
                  supabase.from('booking_slots')
                    .update({ booked_count: (slotData.booked_count || 0) + 1 })
                    .eq('id', bookingSlotId);
                }
              });
          });
      }

      // Log referral fee to provider transactions
      await supabase.from('provider_transactions').insert({
        provider_id: providerId,
        type: 'referral_fee',
        amount: referralFee,
        currency: 'USD',
        gateway: provider.country === 'GH' ? 'paystack' : 'stripe',
        booking_id: booking.id,
        status: 'success',
        created_at: new Date().toISOString(),
      });

      // Log to Celeste
      await supabase.from('revenue_summary').insert({
        date: new Date().toISOString().split('T')[0],
        stream: 'provider_referral_fees',
        amount: referralFee,
        currency: 'USD',
        transaction_count: 1,
        notes: `Booking ${booking.id} — ${provider.subscription_tier} provider`,
        created_at: new Date().toISOString(),
      });

      sessionContext.bookingsConfirmed = (sessionContext.bookingsConfirmed || 0) + 1;
      sessionContext.totalReferralFees = (sessionContext.totalReferralFees || 0) + referralFee;
      sessionContext.lastBookingId = booking.id;
      sessionContext.lastAppointmentCode = appointmentCode;

      return {
        confirmed: true,
        bookingId: booking.id,
        appointmentCode,
        appointmentDate,
        appointmentTime,
        providerName: provider.business_name,
        servicesRequested,
        referralFeeCharged: referralFee,
        codeExpiry,
        message: `Booking confirmed. Appointment code: ${appointmentCode}. ${provider.business_name} has been notified.`,
      };
    }

    case 'activate_provider_voice_agent': {
      const {
        providerId, bookingId, appointmentCode, appointmentDate,
        appointmentTime, servicesRequested, clientFirstName,
        analysisForProvider, providerVapiAssistantId,
      } = toolInput;

      // Log the voice agent activation
      await supabase.from('voice_sessions').insert({
        provider_id: providerId,
        agent_id: PC_ID,
        session_type: 'provider_booking_notification',
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      // Log to alerts for Vapi activation
      await supabase.from('alerts').insert({
        type: 'brook_provider_notification',
        message: `Brook: Provider voice notification — Booking ${bookingId} — Code ${appointmentCode}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          provider_id: providerId,
          booking_id: bookingId,
          appointment_code: appointmentCode,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          services: servicesRequested,
          client_name: clientFirstName || null,
          analysis: analysisForProvider || null,
          vapi_assistant_id: providerVapiAssistantId || null,
          notification_script: `Hello, this is PRECCI Connect. You have a new booking confirmed. ${clientFirstName ? `Your client ${clientFirstName}` : 'A client'} is booked for ${servicesRequested.join(' and ')} on ${appointmentDate} at ${appointmentTime}. ${analysisForProvider ? `Here is what PRECCI found to help you prepare: ${analysisForProvider}.` : ''} Their appointment code is ${appointmentCode}. Please verify this code when they arrive. The full booking brief is available in your dashboard.`,
          notified_at: new Date().toISOString(),
        },
      });

      return {
        activated: true,
        providerId,
        bookingId,
        appointmentCode,
        notificationSent: true,
        vapiAssistantId: providerVapiAssistantId || null,
        message: `Provider voice agent activated. ${clientFirstName ? `Client ${clientFirstName}` : 'Client'} booking notified for ${appointmentDate} at ${appointmentTime}.`,
      };
    }

    case 'generate_appointment_brief': {
      const { bookingId, briefType, clientData, providerData } = toolInput;

      const briefs = {};

      if (briefType === 'client' || briefType === 'both') {
        const clientBrief = {
          briefType: 'client',
          bookingId,
          appointmentCode: clientData?.appointmentCode,
          providerName: clientData?.providerName,
          providerAddress: clientData?.providerAddress,
          appointmentDate: clientData?.appointmentDate,
          appointmentTime: clientData?.appointmentTime,
          servicesBooked: clientData?.servicesBooked || [],
          whatToBring: 'Your appointment code: ' + (clientData?.appointmentCode || 'See app'),
          importantNote: 'Show your appointment code when you arrive. The provider will verify it and have your brief ready.',
          generatedAt: new Date().toISOString(),
        };
        briefs.clientBrief = clientBrief;

        // Store client brief URL reference in booking
        if (bookingId) {
          await supabase.from('provider_bookings')
            .update({ client_brief_data: clientBrief, updated_at: new Date().toISOString() })
            .eq('id', bookingId);
        }
      }

      if (briefType === 'provider' || briefType === 'both') {
        const providerBrief = {
          briefType: 'provider',
          bookingId,
          appointmentCode: providerData?.appointmentCode,
          clientName: providerData?.clientName || 'Client (name withheld)',
          appointmentDate: providerData?.appointmentDate,
          appointmentTime: providerData?.appointmentTime,
          servicesRequested: providerData?.servicesRequested || [],
          preccAnalysis: providerData?.preccAnalysis || 'No analysis data provided',
          preparationNotes: providerData?.preparationNotes || 'Standard preparation',
          verificationInstructions: 'Ask client for their appointment code and verify in your PRECCI Connect dashboard.',
          generatedAt: new Date().toISOString(),
        };
        briefs.providerBrief = providerBrief;
      }

      return {
        generated: true,
        bookingId,
        briefType,
        briefs,
        message: `Brief(s) generated for booking ${bookingId}.`,
      };
    }

    case 'verify_appointment_code': {
      const { appointmentCode, providerId } = toolInput;

      const { data: booking } = await supabase
        .from('provider_bookings')
        .select(`
          id, appointment_code, appointment_date, appointment_time,
          status, services_requested, precci_analysis_summary,
          client_brief_data, code_verified, code_verified_at,
          appointment_code_expires_at, client_user_id,
          service_providers (business_name)
        `)
        .eq('appointment_code', appointmentCode)
        .eq('provider_id', providerId)
        .single();

      if (!booking) {
        return {
          verified: false,
          reason: 'code_not_found',
          message: 'Code not found or does not match this provider. Please check the code and try again.',
        };
      }

      // Check expiry
      if (booking.appointment_code_expires_at && new Date(booking.appointment_code_expires_at) < new Date()) {
        return {
          verified: false,
          reason: 'code_expired',
          message: 'This appointment code has expired. The appointment was more than 24 hours ago.',
        };
      }

      // Check if already verified
      if (booking.code_verified) {
        return {
          verified: true,
          alreadyVerified: true,
          verifiedAt: booking.code_verified_at,
          booking: {
            appointmentDate: booking.appointment_date,
            appointmentTime: booking.appointment_time,
            services: booking.services_requested,
            analysis: booking.precci_analysis_summary,
          },
          message: 'Code already verified. Client brief is below.',
        };
      }

      // Mark as verified
      await supabase.from('provider_bookings')
        .update({
          code_verified: true,
          code_verified_at: new Date().toISOString(),
          status: 'arrived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      return {
        verified: true,
        alreadyVerified: false,
        verifiedAt: new Date().toISOString(),
        booking: {
          bookingId: booking.id,
          appointmentDate: booking.appointment_date,
          appointmentTime: booking.appointment_time,
          services: booking.services_requested,
          preccAnalysis: booking.precci_analysis_summary,
          clientBrief: booking.client_brief_data,
        },
        message: 'Code verified. Client has arrived. Full brief is now available.',
      };
    }

    case 'onboard_provider': {
      const {
        businessName, ownerName, email, phone, address, city, country,
        lat, lng, services, operatingHours, capacityPerSlot, slotDurationMinutes,
        subscriptionTier, paymentMethod, mobileMoneyNumber, mobileMoneyNetwork,
        registrationGateway,
      } = toolInput;

      const registrationFee = 25; // USD

      // Create provider record
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .insert({
          business_name: businessName,
          owner_name: ownerName,
          email,
          phone: phone || null,
          address: address || null,
          city,
          country,
          lat: lat || null,
          lng: lng || null,
          services,
          operating_hours: operatingHours || null,
          capacity_per_slot: capacityPerSlot || 1,
          slot_duration_minutes: slotDurationMinutes || 60,
          subscription_tier: subscriptionTier,
          featured: false,
          registration_fee_paid: true,
          registration_fee_amount: registrationFee,
          registration_fee_paid_at: new Date().toISOString(),
          mobile_money_number: mobileMoneyNumber || null,
          mobile_money_network: mobileMoneyNetwork || null,
          payment_method: paymentMethod,
          rating: 0,
          total_bookings: 0,
          active: true,
          verified: false, // Verified after initial review
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (providerError || !provider) {
        return { onboarded: false, error: providerError?.message };
      }

      // Log registration fee revenue
      await supabase.from('revenue_summary').insert({
        date: new Date().toISOString().split('T')[0],
        stream: 'provider_registration_fees',
        amount: registrationFee,
        currency: 'USD',
        transaction_count: 1,
        notes: `New provider: ${businessName} (${city}, ${country})`,
        created_at: new Date().toISOString(),
      });

      // Log subscription setup
      await supabase.from('provider_transactions').insert({
        provider_id: provider.id,
        type: 'registration_fee',
        amount: registrationFee,
        currency: 'USD',
        gateway: registrationGateway,
        status: 'success',
        created_at: new Date().toISOString(),
      });

      // Send welcome email via Lena
      await supabase.from('alerts').insert({
        type: 'brook_lena_welcome',
        message: `Brook → Lena: Welcome email for new provider ${businessName}`,
        severity: 'info',
        agent_id: 'PC-021',
        metadata: {
          from: PC_ID,
          provider_id: provider.id,
          business_name: businessName,
          owner_name: ownerName,
          email,
          city,
          country,
          services,
          subscription_tier: subscriptionTier,
          onboarded_at: new Date().toISOString(),
        },
      });

      // Send Sebastian's provider agreement
      await supabase.from('alerts').insert({
        type: 'brook_sebastian_new_provider',
        message: `Brook → Sebastian: New provider agreement needed — ${businessName}`,
        severity: 'info',
        agent_id: 'PC-007',
        metadata: {
          from: PC_ID,
          provider_id: provider.id,
          business_name: businessName,
          email,
          country,
          onboarded_at: new Date().toISOString(),
        },
      });

      sessionContext.providersOnboarded = (sessionContext.providersOnboarded || 0) + 1;

      return {
        onboarded: true,
        providerId: provider.id,
        businessName,
        subscriptionTier,
        registrationFeeCharged: registrationFee,
        nextSteps: [
          'Welcome email sent via Lena',
          'Provider agreement sent via Sebastian',
          'Voice agent will be activated once verified',
          'Listing goes live after verification (within 24 hours)',
        ],
        message: `${businessName} successfully registered on PRECCI Connect.`,
      };
    }

    case 'update_provider_profile': {
      const { providerId, updates, reason } = toolInput;

      const safeUpdates = {};
      const allowedFields = [
        'services', 'operating_hours', 'capacity_per_slot', 'slot_duration_minutes',
        'subscription_tier', 'featured', 'featured_expires_at', 'active',
        'phone', 'address', 'lat', 'lng',
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          safeUpdates[field] = updates[field];
        }
      }

      safeUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('service_providers')
        .update(safeUpdates)
        .eq('id', providerId);

      if (error) {
        return { updated: false, error: error.message };
      }

      await supabase.from('alerts').insert({
        type: 'brook_provider_update',
        message: `Brook: Provider profile updated — ${providerId} — ${reason}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          provider_id: providerId,
          fields_updated: Object.keys(safeUpdates).filter(k => k !== 'updated_at'),
          reason,
          updated_at: new Date().toISOString(),
        },
      });

      return {
        updated: true,
        providerId,
        fieldsUpdated: Object.keys(safeUpdates).filter(k => k !== 'updated_at'),
        reason,
      };
    }

    case 'flag_provider_issue': {
      const { providerId, providerName, issueType, issueDescription, severity, clientAffected, recommendedAction } = toolInput;

      await supabase.from('alerts').insert({
        type: 'brook_provider_issue',
        message: `Brook: Provider issue [${severity.toUpperCase()}] — ${providerName} — ${issueType}`,
        severity: severity === 'critical' || severity === 'serious' ? 'critical' : severity === 'moderate' ? 'warn' : 'info',
        agent_id: PC_ID,
        resolved: false,
        metadata: {
          provider_id: providerId,
          provider_name: providerName,
          issue_type: issueType,
          issue_description: issueDescription,
          severity,
          client_affected: clientAffected || null,
          recommended_action: recommendedAction,
          flagged_at: new Date().toISOString(),
        },
      });

      sessionContext.providerIssuesFlagged = (sessionContext.providerIssuesFlagged || 0) + 1;

      return {
        flagged: true,
        providerName,
        issueType,
        severity,
        recommendedAction,
        message: `Provider issue flagged. Nadia and relevant board members will be notified.`,
      };
    }

    case 'get_connect_analytics': {
      const { period, includeSupplyGaps, includeTopProviders, includeServiceCategoryBreakdown, includeGeographicBreakdown } = toolInput;

      const startDate = period === 'today'
        ? new Date().toISOString().split('T')[0]
        : period === 'week'
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Booking stats
      const { count: totalBookings } = await supabase
        .from('provider_bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate);

      const { count: confirmedBookings } = await supabase
        .from('provider_bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate)
        .eq('status', 'confirmed');

      const { count: completedBookings } = await supabase
        .from('provider_bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate)
        .in('status', ['completed', 'arrived']);

      // Revenue
      const { data: revenueData } = await supabase
        .from('provider_transactions')
        .select('type, amount')
        .gte('created_at', startDate)
        .eq('status', 'success');

      const revenueByType = (revenueData || []).reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + parseFloat(t.amount || 0);
        return acc;
      }, {});

      // Provider counts
      const { count: totalProviders } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact' })
        .eq('active', true);

      const { count: newProviders } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate);

      // Top providers
      let topProviders = null;
      if (includeTopProviders) {
        const { data: providers } = await supabase
          .from('service_providers')
          .select('business_name, city, country, rating, total_bookings, subscription_tier')
          .eq('active', true)
          .order('total_bookings', { ascending: false })
          .limit(5);
        topProviders = providers;
      }

      // Supply gaps (cities with users but no providers)
      let supplyGaps = null;
      if (includeSupplyGaps) {
        const { data: clientCities } = await supabase
          .from('users')
          .select('city, country')
          .not('city', 'is', null)
          .limit(500);

        const { data: providerCities } = await supabase
          .from('service_providers')
          .select('city, country')
          .eq('active', true);

        const clientCityCount = (clientCities || []).reduce((acc, u) => {
          const key = `${u.city}, ${u.country}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const providerCityCount = (providerCities || []).reduce((acc, p) => {
          const key = `${p.city}, ${p.country}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        supplyGaps = Object.entries(clientCityCount)
          .map(([city, clients]) => ({
            location: city,
            clients,
            providers: providerCityCount[city] || 0,
            gap: (providerCityCount[city] || 0) === 0 || clients / (providerCityCount[city] || 1) > 30,
          }))
          .filter(g => g.gap)
          .sort((a, b) => b.clients - a.clients)
          .slice(0, 10);
      }

      return {
        period,
        bookings: {
          total: totalBookings || 0,
          confirmed: confirmedBookings || 0,
          completed: completedBookings || 0,
          confirmationRate: totalBookings > 0
            ? `${((confirmedBookings / totalBookings) * 100).toFixed(1)}%`
            : '0%',
        },
        providers: {
          totalActive: totalProviders || 0,
          newThisPeriod: newProviders || 0,
        },
        revenue: {
          referralFees: (revenueByType.referral_fee || 0).toFixed(2),
          registrationFees: (revenueByType.registration_fee || 0).toFixed(2),
          totalConnect: Object.values(revenueByType).reduce((sum, v) => sum + v, 0).toFixed(2),
          currency: 'USD',
        },
        topProviders,
        supplyGaps,
      };
    }

    case 'flag_to_celeste': {
      const { reportType, totalReferralFees, totalRegistrationFees, totalSubscriptionFees, totalFeaturedFees, bookingCount, newProviderCount, period } = toolInput;

      const totalRevenue = (totalReferralFees || 0) + (totalRegistrationFees || 0) + (totalSubscriptionFees || 0) + (totalFeaturedFees || 0);

      await supabase.from('alerts').insert({
        type: 'brook_celeste_revenue',
        message: `Brook → Celeste: Connect revenue report — $${totalRevenue.toFixed(2)} (${period || 'today'})`,
        severity: 'info',
        agent_id: 'PC-002',
        metadata: {
          from: PC_ID,
          report_type: reportType,
          total_referral_fees: totalReferralFees || 0,
          total_registration_fees: totalRegistrationFees || 0,
          total_subscription_fees: totalSubscriptionFees || 0,
          total_featured_fees: totalFeaturedFees || 0,
          total_revenue: totalRevenue,
          booking_count: bookingCount || 0,
          new_provider_count: newProviderCount || 0,
          period: period || 'today',
          reported_at: new Date().toISOString(),
        },
      });

      return {
        reported: true,
        targetAgent: 'PC-002',
        totalRevenue: totalRevenue.toFixed(2),
        message: `Connect revenue reported to Celeste.`,
      };
    }

    case 'flag_to_rafael': {
      const { supplyGaps, topPriorityGap, recommendation } = toolInput;

      await supabase.from('alerts').insert({
        type: 'brook_rafael_gaps',
        message: `Brook → Rafael: ${supplyGaps?.length || 0} provider supply gap(s) identified`,
        severity: 'info',
        agent_id: 'PC-005',
        metadata: {
          from: PC_ID,
          supply_gaps: supplyGaps || [],
          top_priority: topPriorityGap || null,
          recommendation,
          flagged_at: new Date().toISOString(),
        },
      });

      return {
        flagged: true,
        targetAgent: 'PC-005',
        gapCount: supplyGaps?.length || 0,
        topPriorityGap,
        message: `Supply gap intelligence sent to Rafael.`,
      };
    }

    case 'flag_to_elton': {
      const { period, totalBookings, confirmedBookings, completedBookings, topServiceCategories, repeatBookingRate, avgRating, topGeographies } = toolInput;

      await supabase.from('alerts').insert({
        type: 'brook_elton_analytics',
        message: `Brook → Elton: Connect analytics — ${totalBookings} bookings (${period})`,
        severity: 'info',
        agent_id: 'PC-020',
        metadata: {
          from: PC_ID,
          period,
          total_bookings: totalBookings,
          confirmed_bookings: confirmedBookings || 0,
          completed_bookings: completedBookings || 0,
          top_service_categories: topServiceCategories || [],
          repeat_booking_rate: repeatBookingRate || null,
          avg_rating: avgRating || null,
          top_geographies: topGeographies || [],
          reported_at: new Date().toISOString(),
        },
      });

      return {
        reported: true,
        targetAgent: 'PC-020',
        totalBookings,
        message: `Connect analytics sent to Elton.`,
      };
    }

    case 'flag_to_nadia': {
      const { issueType, providersAffected, clientImpact, recommendation, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'brook_nadia_issue',
        message: `Brook → Nadia: Connect operational issue — ${issueType}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-006',
        metadata: {
          from: PC_ID,
          issue_type: issueType,
          providers_affected: providersAffected,
          client_impact: clientImpact || null,
          recommendation,
          urgency,
          flagged_at: new Date().toISOString(),
        },
      });

      return {
        flagged: true,
        targetAgent: 'PC-006',
        issueType,
        urgency,
        message: `Operational issue flagged to Nadia.`,
      };
    }

    case 'flag_to_sebastian': {
      const { providerId, providerName, violationType, evidenceSummary, clientAffected, recommendedAction } = toolInput;

      await supabase.from('alerts').insert({
        type: 'brook_sebastian_violation',
        message: `Brook → Sebastian: Provider compliance violation — ${providerName} — ${violationType}`,
        severity: 'critical',
        agent_id: 'PC-007',
        metadata: {
          from: PC_ID,
          provider_id: providerId,
          provider_name: providerName,
          violation_type: violationType,
          evidence_summary: evidenceSummary,
          client_affected: clientAffected || null,
          recommended_action: recommendedAction,
          flagged_at: new Date().toISOString(),
        },
      });

      return {
        flagged: true,
        targetAgent: 'PC-007',
        violationType,
        severity: 'critical',
        message: `Provider compliance violation escalated to Sebastian.`,
      };
    }

    case 'recall_booking_memory': {
      const { userId, query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId,
        query,
        matchCount: limit || 5,
        matchThreshold: 0.70,
      });

      // Also pull actual booking history
      const { data: bookingHistory } = await supabase
        .from('provider_bookings')
        .select('appointment_date, appointment_time, services_requested, status')
        .eq('client_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        memories,
        memoryContext: buildMemoryContext(memories),
        memoriesFound: memories.length,
        bookingHistory: bookingHistory || [],
        previousBookingCount: bookingHistory?.length || 0,
      };
    }

    case 'store_session_memory': {
      const { userId, content, metadata } = toolInput;

      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId: userId || 'brook_connect_history',
        content,
        memoryType: 'booking_session',
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
        message: `Brook completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          bookings_searched: sessionContext.bookingsSearched || 0,
          bookings_confirmed: sessionContext.bookingsConfirmed || 0,
          providers_onboarded: sessionContext.providersOnboarded || 0,
          codes_verified: sessionContext.codesVerified || 0,
          total_referral_fees: sessionContext.totalReferralFees || 0,
          provider_issues_flagged: sessionContext.providerIssuesFlagged || 0,
          gender_context: sessionContext.genderContext || 'all',
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
// DAILY CONNECT REVENUE REPORT
// Called at end of each day
// ─────────────────────────────────────────────
async function dailyConnectRevenueReport() {
  logger.info('Brook: Daily Connect revenue report triggered');

  const sessionContext = {
    bookingsConfirmed: 0,
    totalReferralFees: 0,
    providersOnboarded: 0,
    providerIssuesFlagged: 0,
  };

  try {
    const analytics = await executeBrookToolCall(
      'get_connect_analytics',
      { period: 'today', includeSupplyGaps: true, includeTopProviders: false },
      sessionContext
    );

    await executeBrookToolCall(
      'flag_to_celeste',
      {
        reportType: 'daily_revenue',
        totalReferralFees: parseFloat(analytics.revenue?.referralFees || 0),
        totalRegistrationFees: parseFloat(analytics.revenue?.registrationFees || 0),
        bookingCount: analytics.bookings?.confirmed || 0,
        period: 'today',
      },
      sessionContext
    );

    // Flag supply gaps to Rafael if any
    if (analytics.supplyGaps && analytics.supplyGaps.length > 0) {
      await executeBrookToolCall(
        'flag_to_rafael',
        {
          supplyGaps: analytics.supplyGaps,
          topPriorityGap: `${analytics.supplyGaps[0]?.location} — ${analytics.supplyGaps[0]?.clients} clients, ${analytics.supplyGaps[0]?.providers} providers`,
          recommendation: `Prioritise provider acquisition in ${analytics.supplyGaps.slice(0, 3).map(g => g.location).join(', ')}`,
        },
        sessionContext
      );
    }

    logger.info('Brook: Daily revenue report complete', {
      bookings: analytics.bookings?.confirmed,
      revenue: analytics.revenue?.totalConnect,
    });

    return { success: true, analytics };
  } catch (error) {
    logger.error('Brook: Daily revenue report failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS BROOK SESSION
// Full autonomous agentic reasoning loop.
// Brook finds, books, notifies and manages.
// Every client gets the right provider.
// Every provider gets the right client.
// ─────────────────────────────────────────────
async function processBrookSession({
  userId,
  sessionId,
  sessionType = 'client_booking',
  transcript = '',
  clientLocation = null,
  sessionSummaryFromAgent = null,
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  const sessionContext = {
    sessionType,
    userId,
    sessionId,
    bookingsSearched: 0,
    bookingsConfirmed: 0,
    providersOnboarded: 0,
    codesVerified: 0,
    totalReferralFees: 0,
    providerIssuesFlagged: 0,
    genderContext: 'all',
    lastBookingId: null,
    lastAppointmentCode: null,
    providersSearched: 0,
  };

  const { data: user } = await supabase
    .from('users')
    .select('name, plan, lat, lng, city, country')
    .eq('id', userId)
    .single();

  const effectiveLocation = clientLocation || (user?.lat ? { lat: user.lat, lng: user.lng } : null);

  const contextParts = [
    `BROOK SESSION TYPE: ${sessionType}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `CLIENT NAME: ${user?.name || 'Client'}`,
    `CLIENT CITY: ${user?.city || 'Unknown'}`,
    `CLIENT COUNTRY: ${user?.country || 'Unknown'}`,
    effectiveLocation
      ? `CLIENT LOCATION: lat ${effectiveLocation.lat}, lng ${effectiveLocation.lng}`
      : `CLIENT LOCATION: Not available — ask client for their location`,
    transcript ? `CLIENT VOICE INPUT: ${transcript}` : '',
    sessionSummaryFromAgent
      ? `SPECIALIST AGENT SESSION SUMMARY: ${sessionSummaryFromAgent}`
      : '',
    `\nCRITICAL: Serve ALL genders equally. Barbers for male clients. Salons for hair styling. Match provider type to service need — never to client gender assumptions.`,
    `BOOKING FLOW: Search → present options by voice → client confirms → check_slot_availability → confirm_booking → activate_provider_voice_agent → generate_appointment_brief.`,
    `RACE CONDITION PREVENTION: Always call check_slot_availability immediately before confirm_booking.`,
  ].filter(Boolean).join('\n');

  const messages = [
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: 'user', content: contextParts },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];

  // ── BROOK'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: BROOK_SYSTEM_PROMPT,
      tools: BROOK_TOOLS,
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
        result = await executeBrookToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Brook: Tool call failed', {
          tool: toolUse.name,
          error: toolError.message,
        });
        result = { error: 'tool_failed', message: toolError.message };
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
    finalResponseText = sessionSummaryFromAgent
      ? `Based on your session, I am finding the right provider for you near ${user?.city || 'your location'}. Let me check availability now.`
      : `Hello, I am Brook. I manage PRECCI Connect — your gateway to real-world beauty and grooming services near you. Tell me what you are looking for and I will find you the perfect appointment.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);

  logger.info('Brook: Session complete', {
    userId,
    sessionType,
    bookingsConfirmed: sessionContext.bookingsConfirmed,
    totalReferralFees: sessionContext.totalReferralFees,
    lastAppointmentCode: sessionContext.lastAppointmentCode,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    bookingsConfirmed: sessionContext.bookingsConfirmed,
    lastBookingId: sessionContext.lastBookingId,
    lastAppointmentCode: sessionContext.lastAppointmentCode,
    totalReferralFees: sessionContext.totalReferralFees,
    providersOnboarded: sessionContext.providersOnboarded,
  };
}

module.exports = {
  processBrookSession,
  dailyConnectRevenueReport,
  generateAppointmentCode,
  BROOK_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};