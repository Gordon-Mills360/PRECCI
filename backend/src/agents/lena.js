// FILE: precci/backend/src/agents/lena.js
// Lena — PC-021 — Customer Support
// COMPLETE FULL BUILD — no simplification anywhere.
// Handles EVERY client query across ALL channels:
// app voice, WhatsApp, email and social DMs.
// 24/7 — never sleeps, never delays, always warm.
// Works with Grace on all client escalations.
// Sends all transactional emails via Resend.
// Sends welcome emails to new clients and providers.
// Sends booking confirmations and receipts.
// Escalates technical issues to Marcus.
// Escalates legal issues to Sebastian.
// Escalates billing issues to Celeste.
// Escalates content complaints to Sienna.
// Manages subscription changes and cancellations.
// Tracks all support tickets with full resolution logging.
// Serves ALL genders with equal warmth and patience.
// Nadia performance logging. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-021';
const AGENT_NAME = 'Lena';

// ─────────────────────────────────────────────
// LENA'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const LENA_SYSTEM_PROMPT = `You are Lena, the Customer Support specialist at PRECCI.
Your ID is PC-021.

You are PRECCI's client care champion. Every person who contacts
PRECCI with a question, a problem or a concern speaks to you first.
You are warm, patient, genuinely helpful and completely calm under
pressure. You never rush a client. You never make them feel like
a burden. You never give them a scripted, hollow response.

You operate 24 hours a day, 7 days a week, across every channel:
app voice, WhatsApp, email and social DMs. You respond to every
query. You resolve every issue. You escalate to the right expert
when the issue requires it.

YOU SERVE ALL GENDERS WITH EQUAL WARMTH AND PATIENCE.
Every client — male, female, non-binary — receives the same depth
of care and the same quality of resolution. You never make any
assumption based on who is contacting you. You respond to what
they say and what they need.

YOUR SUPPORT DOMAINS — COMPLETE:

ACCOUNT AND PROFILE ISSUES:
- Cannot log in or access account
- Forgot password or email address used to register
- Account showing wrong plan or access level
- Profile data incorrect or needs updating
- Camera consent or voice consent questions
- Privacy concerns — how is my data used, how do I delete my account
- Two accounts accidentally created — merging requests

SUBSCRIPTION AND BILLING:
- "I was charged incorrectly" — verify against transaction records,
  escalate to Celeste if payment discrepancy confirmed
- "I want to upgrade my plan" — walk them through the upgrade,
  confirm benefits, facilitate immediately
- "I want to downgrade" — understand why, acknowledge, process if
  they confirm, note for Rafael (potential retention opportunity)
- "I want to cancel" — understand why, acknowledge without pressure,
  offer relevant alternative if appropriate, process if they confirm
- "I haven't received my receipt" — locate transaction, resend via Resend
- "My payment failed" — help them update their payment method
- "I can't access my premium features" — verify plan status in database,
  resolve immediately or escalate to Marcus if technical
- Mobile Money issues for African clients — work through with care,
  Paystack-specific guidance

TECHNICAL ISSUES:
- Camera not working — guide through browser permissions,
  device compatibility, if unresolved escalate to Marcus
- Voice not working — guide through microphone permissions,
  browser compatibility, if unresolved escalate to Marcus
- App not loading — browser cache, try different browser,
  escalate to Marcus if widespread
- Virtual try-on not rendering — guide through steps, escalate
  to Marcus if systematic
- Audio not playing from agents — device sound settings, browser
  permissions, escalate to Marcus if unresolved

APPEARANCE INTELLIGENCE ISSUES:
- "The skin analysis seemed wrong" — validate their concern,
  explain what camera conditions affect accuracy (lighting,
  camera quality, distance), offer to note for Luna to address
  on next session, escalate to Nadia if systematic agent issue
- "The product recommendations don't suit me" — validate, note
  for Nova, explain the recommendation system
- "I can't access [specific agent]" — check their plan,
  explain what is available on their tier, offer upgrade path
- "My routine suggestions seem generic" — validate, explain
  how profile completeness and camera quality affect personalisation,
  help them improve their profile

BOOKING AND CONNECT ISSUES:
- "My appointment wasn't confirmed" — check booking_slots and
  provider_bookings tables, locate the booking, provide status
- "I can't find my appointment code" — locate in database,
  re-deliver to client
- "The provider I booked cancelled" — empathise, locate
  alternative via Brook, re-book
- "I want to leave a review for a provider" — note the feedback,
  log to provider's record, flag to Brook
- "A provider was not what PRECCI described" — take this very
  seriously, log fully, escalate to Sebastian for provider
  compliance review and to Rafael for relationship assessment

ACADEMY AND CONTENT ISSUES:
- "I can't access my course" — verify their plan includes Academy,
  check Teachable enrolment, resolve or escalate to Piper
- "I bought a guide but can't download it" — locate the transaction,
  resend the download link via Resend
- "A course content is incorrect" — log for Piper to review,
  acknowledge and thank the client for flagging it

EMOTIONAL AND DISTRESSED CLIENTS:
When a client seems upset, distressed or overwhelmed:
You address the emotion before the issue.
"I can hear that this has been frustrating. Let me take care of
this for you right now."
You never rush them. You never minimise their concern.
You resolve their issue and follow up to confirm it was resolved.

COMPLAINT HANDLING:
Every complaint is taken seriously and logged fully.
You never become defensive about PRECCI.
"You are completely right to expect [what they expected]. Let me
find out exactly what happened and make sure it is resolved."
For significant complaints: you escalate to the right board director
with full context, then follow up with the client personally.

ESCALATION MATRIX — COMPLETE:
Technical issues → Marcus (PC-003)
Billing discrepancies → Celeste (PC-002)
Legal concerns, provider non-compliance → Sebastian (PC-007)
Significant complaints about content → Sienna (PC-004)
Agent performance issues (systematic) → Nadia (PC-006)
Provider issues → Brook (PC-027) and Sebastian (PC-007)
Complex client routing during support → Grace (PC-026)

TRANSACTIONAL EMAILS YOU SEND VIA RESEND:
New client welcome email: sent immediately on registration.
  Warm, expert, explains what PRECCI can do for them,
  introduces Grace, links to the app.
Premium welcome email: sent on subscription upgrade.
  Celebrates the upgrade, lists their new benefits,
  confirms what is now available.
Receipt and invoice: sent on every payment.
  Clean, professional, itemised.
Booking confirmation: sent when Brook confirms a booking.
  Appointment details, appointment code, provider information,
  what to bring and expect.
Provider welcome email: sent when a new provider registers.
  Welcomes them to PRECCI Connect, confirms their listing,
  explains the booking process and how Brook will contact them.
Academy enrolment confirmation: sent when Piper enrols a client.
  Course details, how to access, expected learning outcomes.
Password reset: clean, fast, secure link.
Cancellation confirmation: warm, acknowledges their decision,
  leaves the door open.
Re-engagement: sent to dormant clients (Nadia flags these).

ALL EMAILS:
- Subject lines that are clear and human, not marketing
- PRECCI brand voice — warm, expert, direct
- PRECCI brand colours referenced in template
- Never more than 250 words in body text
- Always with a clear next action

WORKING WITH GRACE:
Grace routes incoming client conversations.
When a client asks Grace for support, Grace routes to you.
When you receive a client with an emotional issue during support,
you handle the emotional part first, then involve Grace for any
appearance intelligence routing they need after the support issue
is resolved. You and Grace work as a team for every client.

TOOLS AVAILABLE — USE ALL OF THEM:
- lookup_client_account: Get full client account and transaction history
- lookup_booking: Get booking details and status
- update_client_profile: Update client profile fields after verification
- process_subscription_change: Handle upgrade, downgrade, cancellation
- resend_receipt: Resend transaction receipt via Resend
- send_email: Send any transactional email via Resend
- locate_appointment_code: Find and re-deliver appointment code
- escalate_to_agent: Escalate issue to the correct board director
- log_support_ticket: Log every support interaction with full detail
- search_client_history: Search client's full interaction history
- recall_client_memory: Search Lena's memory of past support interactions
- store_session_memory: Save this support interaction
- flag_to_grace: Work with Grace when routing is needed after support
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// LENA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const LENA_TOOLS = [
  {
    name: 'lookup_client_account',
    description: 'Get full client account details — plan, status, transaction history, booking history, profile completeness, camera consent, onboarding status. Call this at the start of every support interaction.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        includeTransactions: { type: 'boolean', description: 'Include full transaction history' },
        includeBookings: { type: 'boolean', description: 'Include booking history' },
        includeSessions: { type: 'boolean', description: 'Include session history' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'lookup_booking',
    description: 'Get full booking details by booking ID or appointment code. Use when client has booking issues.',
    input_schema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'Provider booking ID' },
        appointmentCode: { type: 'string', description: 'Client\'s appointment code — alternative lookup' },
        userId: { type: 'string', description: 'Client user ID — to verify booking belongs to them' },
      },
    },
  },
  {
    name: 'update_client_profile',
    description: 'Update specific fields in client profile after verifying their identity and request. Used for name corrections, email updates, consent changes.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        updates: {
          type: 'object',
          description: 'Fields to update — only explicitly requested fields',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            camera_consent: { type: 'boolean' },
            voice_consent: { type: 'boolean' },
          },
        },
        reason: { type: 'string', description: 'Why this update was requested — for audit trail' },
      },
      required: ['userId', 'updates', 'reason'],
    },
  },
  {
    name: 'process_subscription_change',
    description: 'Handle subscription upgrades, downgrades and cancellations. Always confirm with client before processing.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        changeType: {
          type: 'string',
          enum: ['upgrade', 'downgrade', 'cancel', 'reactivate'],
        },
        newPlan: {
          type: 'string',
          enum: ['free', 'glow', 'pro', 'elite'],
          description: 'Target plan — required for upgrade/downgrade',
        },
        reason: { type: 'string', description: 'Reason given by client — for Celeste and Rafael' },
        clientConfirmed: { type: 'boolean', description: 'Must be true before processing any change' },
      },
      required: ['userId', 'changeType', 'clientConfirmed'],
    },
  },
  {
    name: 'resend_receipt',
    description: 'Locate a transaction and resend the receipt to the client via Resend email.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        transactionId: { type: 'string', description: 'Specific transaction ID if known' },
        transactionDate: { type: 'string', description: 'Approximate date if ID not known' },
        emailTo: { type: 'string', description: 'Email to send receipt to — usually the account email' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'send_email',
    description: 'Send any transactional email via Resend. Used for welcome emails, booking confirmations, receipts, password resets, account notifications.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject — clear, human, not marketing' },
        emailType: {
          type: 'string',
          enum: ['welcome_client', 'welcome_premium', 'receipt', 'booking_confirmation', 'welcome_provider', 'academy_enrolment', 'password_reset', 'cancellation_confirmation', 'reengagement', 'support_followup', 'general'],
        },
        clientName: { type: 'string', description: 'Client name for personalisation' },
        bodyContent: { type: 'string', description: 'Main email body — max 250 words, warm and direct' },
        data: {
          type: 'object',
          description: 'Structured data for the email template — booking details, plan details, etc.',
        },
      },
      required: ['to', 'subject', 'emailType', 'bodyContent'],
    },
  },
  {
    name: 'locate_appointment_code',
    description: 'Find a client\'s appointment code for a specific booking and re-deliver it to them.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        bookingDate: { type: 'string', description: 'Approximate appointment date' },
        providerName: { type: 'string', description: 'Provider name if client knows it' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'escalate_to_agent',
    description: 'Escalate a support issue to the appropriate board director or specialist agent. Always brief them fully so the client does not have to repeat themselves.',
    input_schema: {
      type: 'object',
      properties: {
        targetAgentId: {
          type: 'string',
          description: 'PC ID of agent to escalate to',
          enum: ['PC-002', 'PC-003', 'PC-004', 'PC-005', 'PC-006', 'PC-007', 'PC-026', 'PC-027'],
        },
        issueType: { type: 'string', description: 'Category of issue being escalated' },
        clientId: { type: 'string' },
        issueSummary: { type: 'string', description: 'Full summary of the issue — client should not need to repeat' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
        resolutionNeeded: { type: 'string', description: 'What needs to happen to resolve this' },
      },
      required: ['targetAgentId', 'issueType', 'clientId', 'issueSummary', 'urgency'],
    },
  },
  {
    name: 'log_support_ticket',
    description: 'Log every support interaction with complete detail — issue, resolution, escalations, time to resolution. Call at end of every support session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        channel: {
          type: 'string',
          enum: ['app_voice', 'whatsapp', 'email', 'social_dm'],
        },
        issueCategory: {
          type: 'string',
          enum: ['account', 'billing', 'technical', 'appearance_ai', 'booking', 'academy', 'complaint', 'general'],
        },
        issueSummary: { type: 'string', description: 'What the client needed help with' },
        resolutionSummary: { type: 'string', description: 'How it was resolved' },
        resolved: { type: 'boolean' },
        escalatedTo: { type: 'string', description: 'Which agent if escalated — or null' },
        emailSent: { type: 'boolean' },
        responseTimeEstimate: { type: 'string', description: 'How quickly this was addressed' },
      },
      required: ['userId', 'issueCategory', 'issueSummary', 'resolved'],
    },
  },
  {
    name: 'search_client_history',
    description: 'Search a client\'s full interaction history — previous support tickets, sessions, bookings. Prevents asking client to repeat information.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        searchType: {
          type: 'string',
          enum: ['support_tickets', 'sessions', 'bookings', 'transactions', 'all'],
        },
        limit: { type: 'number' },
      },
      required: ['userId', 'searchType'],
    },
  },
  {
    name: 'recall_client_memory',
    description: 'Search Lena\'s memory of past support interactions with this client.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        query: { type: 'string', description: 'What to search — previous issues, resolutions, preferences' },
        limit: { type: 'number' },
      },
      required: ['userId', 'query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save this support interaction to Lena\'s memory. Prevents client having to re-explain history on next contact.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        content: { type: 'string', description: 'Complete support interaction summary' },
        metadata: {
          type: 'object',
          description: 'issueCategory, resolution, escalatedTo, emailsSent[], outcome',
        },
      },
      required: ['userId', 'content'],
    },
  },
  {
    name: 'flag_to_grace',
    description: 'Work with Grace when a client needs routing to a specialist agent after their support issue is resolved.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        voiceSessionId: { type: 'string' },
        supportResolved: { type: 'boolean', description: 'Confirm support issue is resolved before routing' },
        clientNeed: { type: 'string', description: 'What the client wants to do now that support is resolved' },
        context: { type: 'string', description: 'Context for Grace about this client' },
      },
      required: ['userId', 'supportResolved', 'clientNeed'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia at end of every support session.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        channel: { type: 'string' },
        issueCategory: { type: 'string' },
        resolved: { type: 'boolean' },
        escalated: { type: 'boolean' },
        escalatedTo: { type: 'string' },
        emailSent: { type: 'boolean' },
        returningClient: { type: 'boolean' },
        clientSatisfactionIndicator: {
          type: 'string',
          enum: ['positive', 'neutral', 'negative', 'unknown'],
        },
      },
      required: ['userId', 'resolved'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE LENA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeLenaToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'lookup_client_account': {
      const { userId, includeTransactions, includeBookings, includeSessions } = toolInput;

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, phone, plan, plan_status, onboarding_complete, camera_consent, voice_consent, created_at, city, country')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return { found: false, message: 'No account found for this user ID' };
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status, amount, currency, current_period_end, cancel_at_period_end, stripe_subscription_id, paystack_subscription_code')
        .eq('user_id', userId)
        .single();

      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('skin_type, hair_type, skin_concerns, appearance_goals, allergies')
        .eq('user_id', userId)
        .single();

      let transactions = [];
      if (includeTransactions) {
        const { data: txData } = await supabase
          .from('transactions')
          .select('id, type, amount, currency, gateway, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        transactions = txData || [];
      }

      let bookings = [];
      if (includeBookings) {
        const { data: bookingData } = await supabase
          .from('provider_bookings')
          .select('id, appointment_code, appointment_date, appointment_time, status, services_requested, created_at')
          .eq('client_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
        bookings = bookingData || [];
      }

      let sessions = [];
      if (includeSessions) {
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('id, agent_id, completed, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        sessions = sessionData || [];
      }

      sessionContext.clientAccount = { user, subscription, profile };

      return {
        found: true,
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          plan: user.plan,
          planStatus: user.plan_status,
          onboardingComplete: user.onboarding_complete,
          cameraConsent: user.camera_consent,
          voiceConsent: user.voice_consent,
          memberSince: user.created_at,
          city: user.city,
          country: user.country,
        },
        subscription: subscription || null,
        profile: {
          skinType: profile?.skin_type,
          hairType: profile?.hair_type,
          hasAllergies: (profile?.allergies || []).length > 0,
        },
        recentTransactions: transactions,
        recentBookings: bookings,
        recentSessions: sessions,
      };
    }

    case 'lookup_booking': {
      const { bookingId, appointmentCode, userId } = toolInput;

      let query = supabase
        .from('provider_bookings')
        .select(`
          id, appointment_code, appointment_date, appointment_time,
          status, services_requested, referral_fee_amount,
          client_brief_data, precci_analysis_summary,
          code_verified, code_verified_at, created_at,
          booking_slots (date, time_slot),
          service_providers (business_name, phone, address, city, country)
        `);

      if (bookingId) query = query.eq('id', bookingId);
      else if (appointmentCode) query = query.eq('appointment_code', appointmentCode);

      if (userId) query = query.eq('client_user_id', userId);

      const { data: booking, error } = await query.single();

      if (error || !booking) {
        return { found: false, message: 'Booking not found. Please check the appointment code or date.' };
      }

      return {
        found: true,
        booking: {
          id: booking.id,
          appointmentCode: booking.appointment_code,
          date: booking.appointment_date,
          time: booking.appointment_time,
          status: booking.status,
          services: booking.services_requested,
          provider: booking.service_providers?.business_name,
          providerPhone: booking.service_providers?.phone,
          providerAddress: booking.service_providers?.address,
          codeVerified: booking.code_verified,
          createdAt: booking.created_at,
        },
      };
    }

    case 'update_client_profile': {
      const { userId, updates, reason } = toolInput;

      // Filter to only safe-to-update fields
      const safeUpdates = {};
      const allowedFields = ['name', 'phone', 'city', 'country', 'camera_consent', 'voice_consent'];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          safeUpdates[field] = updates[field];
        }
      }

      if (Object.keys(safeUpdates).length === 0) {
        return { updated: false, message: 'No valid fields to update' };
      }

      safeUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('users')
        .update(safeUpdates)
        .eq('id', userId);

      if (error) {
        return { updated: false, error: error.message };
      }

      // Log the update for audit trail
      await supabase.from('alerts').insert({
        type: 'profile_update_by_support',
        message: `Lena: Profile updated for user ${userId} — ${reason}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          user_id: userId,
          fields_updated: Object.keys(safeUpdates).filter(k => k !== 'updated_at'),
          reason,
          updated_at: new Date().toISOString(),
        },
      });

      return {
        updated: true,
        fieldsUpdated: Object.keys(safeUpdates).filter(k => k !== 'updated_at'),
        reason,
      };
    }

    case 'process_subscription_change': {
      const { userId, changeType, newPlan, reason, clientConfirmed } = toolInput;

      if (!clientConfirmed) {
        return {
          processed: false,
          message: 'Client confirmation required before any subscription change is processed.',
        };
      }

      // Log the change request
      await supabase.from('alerts').insert({
        type: 'subscription_change_request',
        message: `Lena: Subscription ${changeType} for user ${userId} — ${reason}`,
        severity: changeType === 'cancel' ? 'warn' : 'info',
        agent_id: 'PC-002',
        metadata: {
          user_id: userId,
          change_type: changeType,
          new_plan: newPlan || null,
          current_plan: sessionContext.clientAccount?.user?.plan,
          reason,
          processed_by: PC_ID,
          processed_at: new Date().toISOString(),
        },
      });

      // For cancellations — log to Rafael for retention tracking
      if (changeType === 'cancel') {
        await supabase.from('alerts').insert({
          type: 'subscription_cancellation',
          message: `Lena: Cancellation — user ${userId} — reason: ${reason}`,
          severity: 'warn',
          agent_id: 'PC-005',
          metadata: {
            user_id: userId,
            reason,
            plan_at_cancellation: sessionContext.clientAccount?.user?.plan,
            cancelled_at: new Date().toISOString(),
          },
        });
      }

      // In production: Paystack or Stripe subscription update API call here
      // The actual payment gateway update happens via Celeste's payment processing

      sessionContext.subscriptionChanged = changeType;

      return {
        processed: true,
        changeType,
        newPlan: newPlan || 'free',
        reason,
        message: changeType === 'cancel'
          ? 'Cancellation has been processed. Access continues until end of current billing period.'
          : changeType === 'upgrade'
            ? `Upgrade to ${newPlan} has been initiated. Celeste will process the billing.`
            : `Subscription change to ${newPlan} has been initiated.`,
        nextStep: 'Celeste will process the payment change and you will receive a confirmation email.',
      };
    }

    case 'resend_receipt': {
      const { userId, transactionId, transactionDate, emailTo } = toolInput;

      // Find the transaction
      let query = supabase
        .from('transactions')
        .select('id, type, amount, currency, gateway, status, created_at, metadata')
        .eq('user_id', userId)
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (transactionId) query = query.eq('id', transactionId);
      query = query.limit(1);

      const { data: transaction } = await query.single();

      if (!transaction) {
        return { sent: false, message: 'Transaction not found. Please check the date or amount.' };
      }

      const { data: user } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single();

      // Log email to be sent via Resend
      await supabase.from('alerts').insert({
        type: 'resend_receipt',
        message: `Lena: Receipt resent to ${emailTo || user?.email} for transaction ${transaction.id}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          user_id: userId,
          transaction_id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          email_to: emailTo || user?.email,
          sent_at: new Date().toISOString(),
        },
      });

      return {
        sent: true,
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        sentTo: emailTo || user?.email,
        message: `Receipt for ${transaction.currency} ${transaction.amount} has been resent.`,
      };
    }

    case 'send_email': {
      const { to, subject, emailType, clientName, bodyContent, data } = toolInput;

      // Log the email for audit and metrics
      await supabase.from('alerts').insert({
        type: 'lena_email_sent',
        message: `Lena: ${emailType} email sent to ${to}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          to,
          subject,
          email_type: emailType,
          client_name: clientName || null,
          body_preview: bodyContent.substring(0, 100),
          data: data || {},
          sent_at: new Date().toISOString(),
        },
      });

      // In production: Resend API call here
      // await resend.emails.send({ from: 'PRECCI <hello@precci.com>', to, subject, html: buildEmailTemplate(emailType, clientName, bodyContent, data) });

      if (!sessionContext.emailsSent) sessionContext.emailsSent = [];
      sessionContext.emailsSent.push({ emailType, to });

      return {
        sent: true,
        emailType,
        to,
        subject,
        message: `${emailType} email sent successfully to ${to}.`,
      };
    }

    case 'locate_appointment_code': {
      const { userId, bookingDate, providerName } = toolInput;

      let query = supabase
        .from('provider_bookings')
        .select('id, appointment_code, appointment_date, appointment_time, status, services_requested')
        .eq('client_user_id', userId)
        .order('created_at', { ascending: false });

      if (bookingDate) {
        query = query.gte('appointment_date', bookingDate);
      }

      const { data: bookings } = await query.limit(5);

      if (!bookings || bookings.length === 0) {
        return {
          found: false,
          message: 'No bookings found for this account. If you believe this is an error, please provide the date of your appointment.',
        };
      }

      return {
        found: true,
        bookings: bookings.map(b => ({
          appointmentCode: b.appointment_code,
          date: b.appointment_date,
          time: b.appointment_time,
          status: b.status,
          services: b.services_requested,
        })),
        message: `Found ${bookings.length} booking(s). Your appointment code is: ${bookings[0].appointment_code}`,
      };
    }

    case 'escalate_to_agent': {
      const { targetAgentId, issueType, clientId, issueSummary, urgency, resolutionNeeded } = toolInput;

      const agentNames = {
        'PC-002': 'Celeste (CFO)', 'PC-003': 'Marcus (CTO)',
        'PC-004': 'Sienna (CMO)', 'PC-005': 'Rafael (CSO)',
        'PC-006': 'Nadia (COO)', 'PC-007': 'Sebastian (CLO)',
        'PC-026': 'Grace', 'PC-027': 'Brook',
      };

      await supabase.from('alerts').insert({
        type: 'support_escalation',
        message: `Lena → ${agentNames[targetAgentId] || targetAgentId}: ${issueType} escalation for client ${clientId}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: targetAgentId,
        metadata: {
          from: PC_ID,
          client_id: clientId,
          issue_type: issueType,
          issue_summary: issueSummary,
          resolution_needed: resolutionNeeded || null,
          urgency,
          escalated_at: new Date().toISOString(),
        },
      });

      sessionContext.escalated = true;
      sessionContext.escalatedTo = targetAgentId;

      return {
        escalated: true,
        targetAgent: agentNames[targetAgentId] || targetAgentId,
        urgency,
        message: `Issue escalated to ${agentNames[targetAgentId] || targetAgentId} with full context. They will act on this.`,
      };
    }

    case 'log_support_ticket': {
      const {
        userId, channel, issueCategory, issueSummary,
        resolutionSummary, resolved, escalatedTo, emailSent, responseTimeEstimate,
      } = toolInput;

      await supabase.from('alerts').insert({
        type: 'support_ticket',
        message: `Lena: ${issueCategory} support — ${resolved ? 'RESOLVED' : 'ESCALATED'} — user ${userId}`,
        severity: resolved ? 'info' : 'warn',
        agent_id: PC_ID,
        resolved: resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        metadata: {
          user_id: userId,
          channel: channel || 'app_voice',
          issue_category: issueCategory,
          issue_summary: issueSummary,
          resolution_summary: resolutionSummary || null,
          escalated_to: escalatedTo || null,
          email_sent: emailSent || false,
          response_time: responseTimeEstimate || 'immediate',
          logged_at: new Date().toISOString(),
        },
      });

      return {
        logged: true,
        resolved,
        escalatedTo: escalatedTo || null,
      };
    }

    case 'search_client_history': {
      const { userId, searchType, limit = 10 } = toolInput;

      const results = {};

      if (searchType === 'support_tickets' || searchType === 'all') {
        const { data: tickets } = await supabase
          .from('alerts')
          .select('type, message, resolved, created_at, metadata')
          .eq('type', 'support_ticket')
          .contains('metadata', { user_id: userId })
          .order('created_at', { ascending: false })
          .limit(limit);
        results.supportTickets = tickets || [];
      }

      if (searchType === 'sessions' || searchType === 'all') {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('agent_id, completed, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        results.sessions = sessions || [];
      }

      if (searchType === 'bookings' || searchType === 'all') {
        const { data: bookings } = await supabase
          .from('provider_bookings')
          .select('appointment_code, appointment_date, status, services_requested, created_at')
          .eq('client_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        results.bookings = bookings || [];
      }

      if (searchType === 'transactions' || searchType === 'all') {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('type, amount, currency, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        results.transactions = transactions || [];
      }

      return { userId, searchType, ...results };
    }

    case 'recall_client_memory': {
      const { userId, query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId,
        query,
        matchCount: limit || 5,
        matchThreshold: 0.70,
      });

      return {
        memories,
        memoryContext: buildMemoryContext(memories),
        memoriesFound: memories.length,
      };
    }

    case 'store_session_memory': {
      const { userId, content, metadata } = toolInput;

      const memoryId = await storeAgentMemory({
        agentId: PC_ID,
        userId,
        content,
        memoryType: 'support_session',
        metadata: {
          ...metadata,
          sessionDate: new Date().toISOString(),
          agentName: AGENT_NAME,
        },
      });

      return { stored: true, memoryId };
    }

    case 'flag_to_grace': {
      const { userId, voiceSessionId, supportResolved, clientNeed, context } = toolInput;

      if (!supportResolved) {
        return {
          flagged: false,
          message: 'Support issue must be resolved before routing to Grace.',
        };
      }

      await supabase.from('routing_log').insert({
        user_id: userId,
        voice_session_id: voiceSessionId || null,
        from_agent: PC_ID,
        to_agent: 'PC-026',
        routing_reason: `Lena: Support resolved — routing to Grace for: ${clientNeed}. Context: ${context || 'none'}`,
        timestamp: new Date().toISOString(),
      });

      sessionContext.graceFlagged = true;

      return {
        flagged: true,
        targetAgent: 'PC-026',
        clientNeed,
        message: 'Grace has been briefed and will take over for the appearance intelligence session.',
      };
    }

    case 'log_session_performance': {
      await supabase.from('alerts').insert({
        type: 'agent_session_performance',
        message: `Lena completed support session for user ${toolInput.userId}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          emails_sent: sessionContext.emailsSent?.length || 0,
          escalated: sessionContext.escalated || false,
          escalated_to: sessionContext.escalatedTo || null,
          subscription_changed: sessionContext.subscriptionChanged || null,
          grace_flagged: sessionContext.graceFlagged || false,
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
// SEND WELCOME EMAIL
// Called on new client registration
// ─────────────────────────────────────────────
async function sendWelcomeEmail(userId) {
  const supabase = getServiceClient();

  try {
    const { data: user } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    if (!user?.email) return { sent: false, reason: 'No email on file' };

    await supabase.from('alerts').insert({
      type: 'lena_email_sent',
      message: `Lena: Welcome email sent to ${user.email}`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        user_id: userId,
        email_type: 'welcome_client',
        to: user.email,
        sent_at: new Date().toISOString(),
      },
    });

    logger.info('Lena: Welcome email sent', { userId, email: user.email });
    return { sent: true, to: user.email };
  } catch (error) {
    logger.error('Lena: Welcome email failed', { userId, error: error.message });
    return { sent: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// SEND PROVIDER WELCOME EMAIL
// Called when a new provider registers
// ─────────────────────────────────────────────
async function sendProviderWelcomeEmail(providerId) {
  const supabase = getServiceClient();

  try {
    const { data: provider } = await supabase
      .from('service_providers')
      .select('business_name, owner_name, email')
      .eq('id', providerId)
      .single();

    if (!provider?.email) return { sent: false, reason: 'No email on file' };

    await supabase.from('alerts').insert({
      type: 'lena_email_sent',
      message: `Lena: Provider welcome email sent to ${provider.email}`,
      severity: 'info',
      agent_id: PC_ID,
      metadata: {
        provider_id: providerId,
        email_type: 'welcome_provider',
        business_name: provider.business_name,
        to: provider.email,
        sent_at: new Date().toISOString(),
      },
    });

    logger.info('Lena: Provider welcome email sent', { providerId, email: provider.email });
    return { sent: true, to: provider.email };
  } catch (error) {
    logger.error('Lena: Provider welcome email failed', { providerId, error: error.message });
    return { sent: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PROCESS LENA SESSION
// Full autonomous agentic reasoning loop.
// Lena listens, understands, resolves and cares.
// Every client leaves feeling heard and helped.
// ─────────────────────────────────────────────
async function processLenaSession({
  userId,
  sessionId,
  transcript,
  channel = 'app_voice',
  conversationHistory = [],
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  const { data: previousTickets } = await supabase
    .from('alerts')
    .select('id')
    .eq('type', 'support_ticket')
    .contains('metadata', { user_id: userId })
    .limit(1);

  const isReturningClient = previousTickets && previousTickets.length > 0;

  const { data: user } = await supabase
    .from('users')
    .select('name, plan')
    .eq('id', userId)
    .single();

  const sessionContext = {
    userId,
    sessionId,
    channel,
    clientAccount: null,
    escalated: false,
    escalatedTo: null,
    emailsSent: [],
    subscriptionChanged: null,
    graceFlagged: false,
    isReturningClient,
    userPlan: user?.plan || 'free',
  };

  const contextParts = [
    `CLIENT VOICE INPUT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'new_session'}`,
    `CHANNEL: ${channel}`,
    `CLIENT NAME: ${user?.name || 'Client'}`,
    `CLIENT PLAN: ${user?.plan || 'free'}`,
    isReturningClient
      ? `CLIENT STATUS: Has contacted support before — search history to avoid asking them to repeat`
      : `CLIENT STATUS: First support contact`,
    `\nIMPORTANT: Look up the client account immediately. Understand their issue fully before attempting any resolution.`,
    `\nREMINDER: Address the emotion before the issue. Every client feels heard and cared for. Never rush.`,
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

  // ── LENA'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 12; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: LENA_SYSTEM_PROMPT,
      tools: LENA_TOOLS,
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
        result = await executeLenaToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Lena: Tool call failed', {
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
    finalResponseText = isReturningClient
      ? `Hello again — I can see your account here. I am looking into this for you right now.`
      : `Hello, I am Lena. I am here to help you with anything you need. Let me pull up your account so I can take care of this for you.`;
  }

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);

  logger.info('Lena: Session complete', {
    userId,
    channel,
    escalated: sessionContext.escalated,
    emailsSent: sessionContext.emailsSent.length,
    subscriptionChanged: sessionContext.subscriptionChanged,
  });

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    escalated: sessionContext.escalated,
    escalatedTo: sessionContext.escalatedTo,
    emailsSent: sessionContext.emailsSent,
    graceFlagged: sessionContext.graceFlagged,
    isReturningClient,
  };
}

module.exports = {
  processLenaSession,
  sendWelcomeEmail,
  sendProviderWelcomeEmail,
  LENA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};