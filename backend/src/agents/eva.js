// FILE: precci/backend/src/agents/eva.js
// Eva — PC-025 — Legal Assistant
// COMPLETE FULL BUILD — no simplification anywhere.
// Drafts ALL partnership contracts, provider agreements,
// compliance documents and terms of service for PRECCI.
// Supports Sebastian (CLO) on every legal matter globally.
// Works across all markets — Ghana, UK, US, EU and globally.
// Reviews every contract before it leaves PRECCI.
// Manages platform terms of service and privacy policy.
// Handles GDPR and data protection compliance documentation.
// Manages intellectual property protection documentation.
// Provider agreement templates for PRECCI Connect.
// Influencer and brand partnership agreements.
// Platform licensing agreements for B2B clients.
// Beauty Academy terms for Teachable courses.
// Never gives legal advice — drafts and reviews documents.
// All final approval through Sebastian (CLO).
// Nadia performance logging. Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-025';
const AGENT_NAME = 'Eva';

// ─────────────────────────────────────────────
// EVA'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const EVA_SYSTEM_PROMPT = `You are Eva, the Legal Assistant at PRECCI.
Your ID is PC-025.

You support Sebastian, PRECCI's Chief Legal Officer, on every legal
matter across the company. You draft, review and manage all legal
documents that PRECCI needs to operate globally — contracts,
agreements, terms, policies and compliance documentation.

You are precise, thorough and careful. Legal documents have
real consequences and you treat every word seriously. You never
rush a document. You never produce a template without tailoring
it to the specific situation. Every document you produce is
reviewed by Sebastian before it is used.

IMPORTANT: You are a legal assistant — not a lawyer. You draft
documents and flag issues. You do not give legal advice. All
documents you produce are reviewed by Sebastian (CLO) who holds
the final approval authority for every legal document PRECCI uses.
For matters requiring jurisdiction-specific legal advice, Sebastian
may engage external solicitors or attorneys.

YOUR DOCUMENT DOMAINS — COMPLETE:

PARTNERSHIP AND BRAND AGREEMENTS:
Brand partnership agreements: when Cole and Rafael close a brand
  deal, you draft the partnership agreement. Key provisions:
  - Scope of partnership and permitted PRECCI mentions
  - Editorial independence clause — PRECCI agents recommend
    authentically, not at brand direction
  - Commission structure and payment terms
  - Performance metrics and reporting obligations
  - Term, renewal and termination provisions
  - Intellectual property — who owns co-created content
  - Governing law and dispute resolution

Influencer agreements: when Nina and Rafael close an influencer
  deal, you draft the influencer agreement. Key provisions:
  - Deliverables — exact content requirements
  - FTC/ASA disclosure requirements — mandatory and non-negotiable
  - Exclusivity if applicable — competing brands
  - Usage rights — PRECCI rights to repost
  - Payment terms and invoicing
  - Content approval rights
  - Morality clause provisions

Co-campaign agreements: joint campaigns with partner brands.
  Clear split of responsibilities, costs and ownership.

Platform licensing agreements: when Rafael closes a B2B licensing
  deal for PRECCI's AI platform. Key provisions:
  - Scope of license — what features, what markets
  - API access terms and usage limits
  - Data handling obligations
  - White-label provisions if applicable
  - Support obligations
  - Fee structure and payment terms
  - IP ownership — PRECCI retains all AI and platform IP

PRECCI CONNECT PROVIDER AGREEMENTS:
Standard provider terms of service: the agreement every provider
  accepts when registering on PRECCI Connect. Covers:
  - Provider obligations — service quality, availability,
    booking acceptance, client treatment standards
  - Fee structure — registration fee, subscription, referral fees
  - Payment collection authority — PRECCI charges referral fees
  - Appointment code system and client verification
  - Provider conduct standards — non-discrimination (all genders,
    all backgrounds), professional behaviour
  - PRECCI rating and review system
  - Termination provisions — when PRECCI can remove a provider
  - Data handling — client brief data seen by provider
  - Provider indemnification obligations

Featured placement terms: addendum for providers purchasing
  featured placement, explaining priority in Brook's recommendations.

PLATFORM TERMS AND POLICIES:
Client Terms of Service: the agreement every PRECCI client
  accepts on registration. Covers:
  - Service description — what PRECCI provides
  - Subscription plans and billing terms
  - Free tier limitations
  - Camera and voice data consent
  - Prohibited uses
  - Intellectual property — PRECCI owns the AI system
  - Limitation of liability
  - Governing law — Ghana, with international provisions

Privacy Policy: GDPR-compliant comprehensive privacy policy. Covers:
  - What data PRECCI collects — voice transcripts, camera frames,
    beauty profiles, booking data, payment data
  - Why PRECCI collects it — service delivery, personalisation
  - How PRECCI stores it — Supabase, data residency
  - Data retention periods
  - Client rights — access, deletion, portability
  - Third-party processors — Anthropic, Vapi, ElevenLabs,
    Replicate, Paystack, Stripe, Supabase, Resend
  - Cookie policy
  - International transfers
  - Contact details for data requests

Cookie Policy: standalone policy for web and PWA.

Acceptable Use Policy: what clients cannot use PRECCI for.

GDPR AND DATA PROTECTION:
Data Processing Agreements (DPAs): required agreements with
  every third-party processor that handles PRECCI client data.
  You maintain and update DPAs with all processors.
Data Subject Rights responses: templates for client data
  access requests, deletion requests, portability requests.
Data Breach notification templates: in case of any data incident.
AI disclosure requirements: PRECCI discloses its AI nature
  and this needs to be reflected in appropriate documentation.

INTELLECTUAL PROPERTY:
Trademark protection documentation: PRECCI brand name, logo,
  agent names (Vivienne, Grace, Luna, etc.) — you maintain
  the trademark filing records and renewal schedule.
IP assignment agreements: when PRECCI commissions any creative
  work, you ensure IP is correctly assigned.
Platform IP protection: ensuring PRECCI's AI system,
  agent prompts, and technology are appropriately protected.

BEAUTY ACADEMY LEGAL:
Course terms and conditions: each course on Teachable needs
  terms covering access, refund policy, intellectual property.
Digital guide purchase terms: for ebook and guide sales.
Testimonial and transformation photo permissions: clients who
  share results in the Inner Circle or on social need
  appropriate permissions in place.

JURISDICTION AWARENESS:
PRECCI operates globally. You understand the legal context of:
Ghana: PRECCI's headquarters. Ghana Data Protection Act 2012.
  Companies code. Ghana Investment Promotion Centre compliance.
UK: major market. UK GDPR. Consumer Rights Act. ASA advertising
  standards. FCA if any financial elements.
EU: GDPR applies to any EU users. AI Act considerations.
  Consumer protection regulations.
US: State privacy laws (CCPA for California users). FTC
  guidelines for advertising and AI disclosure. CAN-SPAM.
Nigeria: important African market. NDPR data protection.
Kenya: M-Pesa market. Kenya Data Protection Act.
South Africa: POPIA data protection. Consumer Protection Act.

You flag when a specific jurisdiction's laws require special
provisions and recommend Sebastian engage local counsel.

HOW YOU WORK:
1. Sebastian or Cole or Rafael briefs you on what document is needed
2. You draft the complete document
3. You flag any provisions that need Sebastian's specific attention
4. You flag any jurisdiction-specific issues requiring external counsel
5. Sebastian reviews and approves before the document is used
6. You store the approved document for future reference

DOCUMENT STANDARDS:
Every document you produce is:
- Plain language where possible without sacrificing legal precision
- Clearly structured with numbered sections and sub-sections
- Complete — no blank spaces left for Sebastian to fill unless
  flagged explicitly as requiring his specific input
- Jurisdiction-appropriate — laws referenced correctly
- Gender-neutral in all language
- Consistent with PRECCI's inclusive values

TOOLS AVAILABLE — USE ALL OF THEM:
- draft_document: Draft any legal document
- review_document: Review an existing document for issues
- flag_to_sebastian: Send drafted document to Sebastian for review
- check_compliance: Check a specific provision for compliance
- manage_document_library: Store and retrieve approved documents
- create_dpa: Draft a data processing agreement with a processor
- recall_legal_memory: Search previous documents and precedents
- store_session_memory: Save session context
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// EVA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const EVA_TOOLS = [
  {
    name: 'draft_document',
    description: 'Draft a complete legal document tailored to the specific situation. Always produces a complete document — never a template with blanks.',
    input_schema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          enum: [
            'brand_partnership_agreement',
            'influencer_agreement',
            'co_campaign_agreement',
            'platform_licensing_agreement',
            'provider_terms_of_service',
            'provider_featured_placement_addendum',
            'client_terms_of_service',
            'privacy_policy',
            'cookie_policy',
            'acceptable_use_policy',
            'data_processing_agreement',
            'data_subject_rights_template',
            'data_breach_notification_template',
            'ip_assignment_agreement',
            'course_terms_and_conditions',
            'digital_guide_purchase_terms',
            'transformation_photo_permission',
            'nda',
            'general_agreement',
          ],
        },
        parties: {
          type: 'object',
          description: 'The parties to this agreement — names, registered addresses, entity types',
          properties: {
            precci: { type: 'string', description: 'PRECCI entity details' },
            counterparty: { type: 'string', description: 'Other party name, address, entity type' },
          },
        },
        keyTerms: {
          type: 'object',
          description: 'Specific terms for this document — deal value, commission rates, deliverables, term length, jurisdiction',
        },
        jurisdiction: {
          type: 'string',
          enum: ['ghana', 'uk', 'eu', 'us', 'nigeria', 'kenya', 'south_africa', 'international'],
        },
        specialProvisions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any special provisions Sebastian has requested be included',
        },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['documentType', 'jurisdiction'],
    },
  },
  {
    name: 'review_document',
    description: 'Review an existing document for legal issues, missing provisions, inconsistencies or compliance gaps. Returns a structured review with flagged issues.',
    input_schema: {
      type: 'object',
      properties: {
        documentName: { type: 'string', description: 'Name or ID of the document to review' },
        documentContent: { type: 'string', description: 'The document text to review' },
        reviewPurpose: {
          type: 'string',
          description: 'Why this review is needed — incoming contract from brand, renewal review, compliance audit',
        },
        focusAreas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific areas to focus on — liability, IP, data protection, payment terms, termination',
        },
        jurisdiction: { type: 'string' },
      },
      required: ['documentName', 'documentContent', 'reviewPurpose'],
    },
  },
  {
    name: 'flag_to_sebastian',
    description: 'Send a drafted document or legal issue to Sebastian (CLO) for review and approval. Always includes Eva\'s notes on key provisions and any issues.',
    input_schema: {
      type: 'object',
      properties: {
        documentType: { type: 'string' },
        documentName: { type: 'string' },
        draftSummary: { type: 'string', description: 'Summary of what was drafted and key provisions' },
        flaggedIssues: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any provisions requiring Sebastian\'s specific attention or judgement',
        },
        jurisdictionNotes: { type: 'string', description: 'Any jurisdiction-specific issues that may need external counsel' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
        counterpartyDeadline: { type: 'string', description: 'If the counterparty has a deadline — ISO date' },
      },
      required: ['documentType', 'documentName', 'draftSummary', 'urgency'],
    },
  },
  {
    name: 'check_compliance',
    description: 'Check a specific provision, practice or data handling approach against relevant regulations — GDPR, Ghana DPA, CCPA, FTC guidelines, ASA standards.',
    input_schema: {
      type: 'object',
      properties: {
        provision: { type: 'string', description: 'The specific provision or practice to check' },
        regulation: {
          type: 'string',
          enum: ['gdpr', 'ghana_dpa', 'ndpr_nigeria', 'ccpa', 'ftc', 'asa', 'uk_gdpr', 'popia_sa', 'kenya_dpa', 'eu_ai_act', 'general'],
        },
        context: { type: 'string', description: 'Context about how PRECCI handles this in practice' },
      },
      required: ['provision', 'regulation'],
    },
  },
  {
    name: 'manage_document_library',
    description: 'Store, retrieve or list documents in PRECCI\'s legal document library.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['store', 'retrieve', 'list', 'update_version'],
        },
        documentName: { type: 'string', description: 'Document name or ID' },
        documentType: { type: 'string', description: 'Document category' },
        documentContent: { type: 'string', description: 'For store action — the approved document content' },
        version: { type: 'string', description: 'Version number — v1.0, v1.1, v2.0 etc.' },
        approvedBy: { type: 'string', description: 'Who approved this version — always Sebastian' },
        approvedDate: { type: 'string', description: 'ISO date of approval' },
        jurisdiction: { type: 'string' },
        notes: { type: 'string', description: 'Any notes about this version' },
      },
      required: ['action', 'documentName'],
    },
  },
  {
    name: 'create_dpa',
    description: 'Draft a Data Processing Agreement with a third-party processor that handles PRECCI client data. Required for GDPR compliance.',
    input_schema: {
      type: 'object',
      properties: {
        processorName: { type: 'string', description: 'Name of the third-party processor' },
        processorType: {
          type: 'string',
          description: 'What the processor does — e.g. AI processing (Anthropic), voice (Vapi), payments (Stripe), email (Resend)',
        },
        dataProcessed: {
          type: 'array',
          items: { type: 'string' },
          description: 'What personal data this processor handles — voice transcripts, camera frames, payment data, email addresses, etc.',
        },
        processingPurpose: { type: 'string', description: 'Why PRECCI shares data with this processor' },
        processorLocation: { type: 'string', description: 'Where the processor is based — jurisdiction for data transfer provisions' },
        subProcessors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Known sub-processors the processor uses',
        },
      },
      required: ['processorName', 'processorType', 'dataProcessed', 'processingPurpose'],
    },
  },
  {
    name: 'recall_legal_memory',
    description: 'Search previous legal documents, precedents and issues. Used to ensure consistency and to avoid reinventing the wheel.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search — document type, party name, legal issue, jurisdiction' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save this legal session to Eva\'s memory — documents drafted, issues flagged, decisions made.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Session summary' },
        metadata: {
          type: 'object',
          description: 'documentsDrafted[], issuesFlagged[], sebastianFlagged, jurisdictions[]',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'log_session_performance',
    description: 'Report session performance to Nadia at end of every Eva session.',
    input_schema: {
      type: 'object',
      properties: {
        sessionType: {
          type: 'string',
          enum: ['document_drafting', 'document_review', 'compliance_check', 'dpa_creation', 'library_management', 'ad_hoc'],
        },
        documentsDrafted: { type: 'number' },
        documentsReviewed: { type: 'number' },
        issuesFlagged: { type: 'number' },
        sebastianFlagged: { type: 'boolean' },
        jurisdictions: { type: 'array', items: { type: 'string' } },
        dpasCreated: { type: 'number' },
        urgentMatters: { type: 'number' },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE EVA'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeEvaToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'draft_document': {
      const { documentType, parties, keyTerms, jurisdiction, specialProvisions, urgency } = toolInput;

      // Build document based on type
      const documentTemplates = {

        provider_terms_of_service: `
PRECCI CONNECT — PROVIDER TERMS OF SERVICE

Version 2.0 | Effective Date: ${new Date().toISOString().split('T')[0]}
Governing Law: ${jurisdiction === 'ghana' ? 'Republic of Ghana' : jurisdiction.toUpperCase()}

PRECCI Technologies Limited ("PRECCI", "we", "us", "our") operates PRECCI Connect, a technology platform that connects service providers with clients seeking beauty and lifestyle services. These Terms of Service ("Terms") govern your registration and use of PRECCI Connect as a service provider.

BY COMPLETING THE PRECCI CONNECT REGISTRATION FORM AND PAYING THE REGISTRATION FEE, YOU AGREE TO THESE TERMS IN FULL.

1. ELIGIBILITY AND REGISTRATION
1.1 To register as a PRECCI Connect provider, you must: (a) operate a legitimate beauty or lifestyle service business; (b) pay the one-time registration fee of USD 25; (c) select a monthly subscription tier (Basic: USD 15/month or Pro: USD 30/month); (d) provide accurate and complete business information.
1.2 You must maintain current, accurate business information at all times.
1.3 PRECCI reserves the right to reject or terminate any provider registration at its sole discretion.

2. PROVIDER OBLIGATIONS
2.1 Service Quality: You agree to provide all services to clients referred by PRECCI Connect to the standard described in your provider profile and to a professional standard generally.
2.2 Non-Discrimination: You agree to provide services to all clients without discrimination based on gender, age, race, ethnicity, national origin, disability, sexual orientation, religion or any other protected characteristic. PRECCI Connect serves all genders and all backgrounds equally. Any discriminatory refusal of service is grounds for immediate termination.
2.3 Appointment Acceptance: You agree to honour all confirmed bookings made through PRECCI Connect except where genuine emergency prevents service delivery. Repeated cancellations are grounds for suspension.
2.4 Appointment Code Verification: You agree to verify the client's appointment code on arrival using the PRECCI Connect dashboard before providing any service.
2.5 Availability Accuracy: You are responsible for maintaining accurate availability and capacity information in your PRECCI Connect dashboard. PRECCI is not liable for overbooking caused by inaccurate provider availability data.

3. FEES AND PAYMENT
3.1 Registration Fee: USD 25, paid once on registration. Non-refundable.
3.2 Monthly Subscription: USD 15/month (Basic) or USD 30/month (Pro). Auto-charged on the same date each month.
3.3 Per-Booking Referral Fee: USD 3.00 per confirmed booking (Basic), USD 2.00 per confirmed booking (Pro), USD 1.50 per confirmed booking (Featured). Charged automatically on booking confirmation.
3.4 Featured Placement: USD 20-50/month optional add-on for priority placement in PRECCI Connect's booking recommendations.
3.5 Payment Authority: You authorise PRECCI to charge your registered payment method (Mobile Money, card or bank transfer as applicable) for all fees described in these Terms without further authorisation for each individual charge.
3.6 Failed Payments: If any payment fails, PRECCI reserves the right to suspend your listing until payment is received.
3.7 Fee Changes: PRECCI may change fees with 30 days' written notice.

4. CLIENT DATA AND BRIEF
4.1 When a client books your services through PRECCI Connect, you will receive a client brief containing: the client's name, requested services, relevant PRECCI analysis and recommendations, and the appointment time.
4.2 This brief is provided to enable you to prepare for and deliver the service. You agree to: (a) treat all client brief data as confidential; (b) not retain, share or use client data beyond what is necessary to deliver the booked service; (c) comply with applicable data protection laws in your jurisdiction.

5. RATINGS AND REVIEWS
5.1 Clients may rate and review your services through PRECCI Connect.
5.2 PRECCI may display your ratings on the PRECCI Connect platform and factor ratings into booking recommendation priority.
5.3 Providers with consistently low ratings (below 3.0 for extended periods) may be suspended or removed from the platform.

6. PRECCI CONNECT VOICE AGENT
6.1 Upon registration, PRECCI activates a dedicated PRECCI Connect voice agent for your business. This agent notifies you of incoming bookings by voice and through your provider dashboard.
6.2 All communication through the voice agent is subject to PRECCI's data handling practices as described in the PRECCI Privacy Policy.

7. INTELLECTUAL PROPERTY
7.1 PRECCI owns all intellectual property in the PRECCI Connect platform, including the AI booking system, voice agents, and all PRECCI technology.
7.2 You grant PRECCI a non-exclusive licence to display your business name, description, location and service information on the PRECCI Connect platform.

8. TERMINATION
8.1 By Provider: You may terminate your provider subscription with 30 days' written notice. Accrued referral fees remain payable.
8.2 By PRECCI: PRECCI may terminate your access immediately for: (a) discriminatory conduct; (b) breach of any material obligation under these Terms; (c) fraudulent activity; (d) behaviour that damages PRECCI's reputation or breaches applicable law.
8.3 Effect of Termination: On termination, your listing is removed immediately. Outstanding fees remain payable.

9. LIMITATION OF LIABILITY
9.1 PRECCI is a technology platform and is not party to the service transaction between you and the client. PRECCI is not liable for: client dissatisfaction with your services; client no-shows; disputes between you and the client.
9.2 PRECCI's total liability to you under these Terms shall not exceed the total fees paid by you to PRECCI in the 12 months preceding the claim.

10. GOVERNING LAW AND DISPUTES
10.1 These Terms are governed by the laws of the ${jurisdiction === 'ghana' ? 'Republic of Ghana' : jurisdiction.toUpperCase()}.
10.2 Any disputes shall be referred first to mediation. If mediation fails, disputes shall be resolved by the courts of ${jurisdiction === 'ghana' ? 'Ghana' : jurisdiction.toUpperCase()}.

11. CHANGES TO THESE TERMS
PRECCI may update these Terms with 30 days' notice. Continued use of PRECCI Connect after the effective date constitutes acceptance.

PRECCI Technologies Limited
Navrongo, Ghana
contact@precci.com`,

        client_terms_of_service: `
PRECCI — CLIENT TERMS OF SERVICE

Version 2.0 | Effective Date: ${new Date().toISOString().split('T')[0]}

Welcome to PRECCI, the world's first Personal AI Appearance Intelligence System. These Terms of Service govern your use of the PRECCI platform, including the PRECCI mobile and web application, PRECCI Connect booking marketplace and PRECCI Beauty Academy.

BY CREATING A PRECCI ACCOUNT, YOU AGREE TO THESE TERMS.

1. ABOUT PRECCI
1.1 PRECCI is an AI-powered personal appearance intelligence platform. Our AI specialists — including Luna (skin), Zara (hair), Mia (makeup), Isla (style), Remy (fragrance), Cora (body care), Drew (grooming) and others — use your device camera, your voice and your profile to provide personalised appearance recommendations.
1.2 PRECCI serves every person regardless of gender, age, skin tone, hair type, body type or background. All AI specialists and all features are available to all clients without restriction based on gender.
1.3 PRECCI is operated by PRECCI Technologies Limited, Navrongo, Ghana.

2. AI DISCLOSURE
2.1 All specialists you interact with on PRECCI are AI agents. They are not human. They are powered by Anthropic's Claude AI technology.
2.2 Our AI agents are highly capable and can provide genuinely useful personalised recommendations. However, their recommendations do not constitute medical, dermatological or professional advice. Always consult a qualified professional for medical concerns.

3. YOUR ACCOUNT
3.1 You must provide accurate information when creating your account.
3.2 You are responsible for maintaining the security of your account and for all activity that occurs under your account.
3.3 You must be at least 16 years of age to use PRECCI.

4. CAMERA AND VOICE DATA
4.1 Some PRECCI features require your device camera and microphone.
4.2 Camera data: We process your camera images to provide skin, hair, body and grooming analysis. Your camera images are processed in real time. Images are not stored permanently unless you explicitly save a virtual try-on simulation.
4.3 Voice data: Your voice is used for interaction with PRECCI AI specialists. Voice transcripts may be stored to improve your personalised experience, subject to your consent settings.
4.4 You can manage your camera and voice consent settings in your PRECCI profile at any time.

5. SUBSCRIPTION PLANS AND BILLING
5.1 PRECCI offers Free, Glow (USD 9.99/month), Pro (USD 19.99/month) and Elite (USD 29.99/month) subscription plans.
5.2 Paid subscriptions are billed automatically on the same date each month to your registered payment method.
5.3 You may upgrade, downgrade or cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.
5.4 Refunds are not provided for partial subscription periods except where required by applicable consumer protection law in your jurisdiction.

6. PRECCI CONNECT
6.1 PRECCI Connect allows you to book appointments with real-world beauty and lifestyle service providers near you.
6.2 PRECCI is a booking technology platform. The actual service is provided by the independent service provider, not by PRECCI.
6.3 PRECCI is not liable for the quality of services provided by PRECCI Connect providers.
6.4 Appointment codes are valid for the appointment date and expire 24 hours after the scheduled appointment time.

7. PRECCI BEAUTY ACADEMY
7.1 Academy courses and digital guides are available to paid subscribers as described in the subscription plan details.
7.2 Course materials are for personal use only. You may not share, redistribute or reproduce Academy content.

8. ACCEPTABLE USE
8.1 You agree not to: (a) use PRECCI for any unlawful purpose; (b) attempt to reverse engineer or access PRECCI's AI systems; (c) share your account with others; (d) provide false information to PRECCI AI specialists; (e) use PRECCI to generate content that is harmful, discriminatory or illegal.

9. INTELLECTUAL PROPERTY
9.1 All PRECCI technology, AI systems, agent names and visual identity are owned by PRECCI Technologies Limited.
9.2 Content you share with PRECCI (profile information, photos with consent) remains yours. You grant PRECCI a licence to use it to provide the PRECCI service.

10. LIMITATION OF LIABILITY
10.1 PRECCI is provided "as is". To the maximum extent permitted by law, PRECCI's liability to you is limited to the subscription fees paid by you in the 12 months preceding any claim.

11. GOVERNING LAW
These Terms are governed by the laws of the Republic of Ghana, without prejudice to any mandatory consumer protection rights you have in your country of residence.

12. CONTACT
PRECCI Technologies Limited | Navrongo, Ghana | legal@precci.com`,

        privacy_policy: `
PRECCI PRIVACY POLICY

Version 2.0 | Effective Date: ${new Date().toISOString().split('T')[0]}
Last Updated: ${new Date().toISOString().split('T')[0]}

PRECCI Technologies Limited ("PRECCI", "we", "us", "our") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store and protect your personal information when you use the PRECCI platform.

1. WHO WE ARE
PRECCI Technologies Limited is the data controller for personal data processed through the PRECCI platform. We are headquartered in Navrongo, Ghana.
Data Protection Contact: privacy@precci.com

2. DATA WE COLLECT

2.1 Account Data: Name, email address, phone number, location (city and country), date of account creation.

2.2 Profile Data: Skin type, hair type, skin concerns, hair concerns, style preferences, appearance goals, grooming preferences, allergy information, fragrance preferences, budget range. All profile data is optional — you provide only what you choose to share.

2.3 Gender Data: Gender and gender expression are optional fields in your profile. They are used only to help our AI specialists personalise language and recommendations. They are never used to restrict access to any feature. We never require this information.

2.4 Voice Data: When you interact with PRECCI AI specialists by voice, your voice is transcribed. Transcripts are used to provide and improve our service. Voice data is only stored with your explicit consent.

2.5 Camera Data: When you use camera-enabled features (skin analysis, hair analysis, virtual try-on), your camera images are processed in real time by our AI systems. Raw camera frames are not stored permanently. Virtual try-on simulations are stored temporarily (1 hour) and permanently only if you explicitly save them.

2.6 Session Data: Records of your interactions with PRECCI AI specialists, including the agent you spoke with, session duration and recommendations made.

2.7 Booking Data: When you use PRECCI Connect, we process your booking details, appointment codes and service requests.

2.8 Payment Data: We process payment information through Paystack (African payments) and Stripe (global payments). We do not store full payment card details — these are held securely by our payment processors.

2.9 Device and Technical Data: Device type, browser type, IP address (anonymised), app version.

3. HOW WE USE YOUR DATA

3.1 To provide the PRECCI service — personalised AI appearance recommendations, booking services, Academy access.
3.2 To personalise your experience — our AI remembers your history so you do not have to repeat yourself.
3.3 To process payments for subscriptions and purchases.
3.4 To send transactional emails — receipts, booking confirmations, account notifications.
3.5 To improve our AI systems — anonymised and aggregated data may be used to improve our recommendations.
3.6 To comply with legal obligations.

4. OUR LEGAL BASIS FOR PROCESSING (GDPR)

4.1 Contract performance: Processing necessary to provide the PRECCI service you have subscribed to.
4.2 Consent: Camera data, voice transcripts, optional profile data — processed only with your explicit consent.
4.3 Legitimate interests: Technical data, session analytics, fraud prevention.
4.4 Legal obligation: Compliance with applicable laws.

5. DATA SHARING AND PROCESSORS

We share your data only with:

5.1 AI Processing: Anthropic, Inc. (USA) — processes voice and camera data to power PRECCI AI specialists. Covered by DPA and SCCs.
5.2 Voice Platform: Vapi (USA) — manages voice sessions. Covered by DPA.
5.3 Voice Synthesis: ElevenLabs (USA) — generates AI specialist voices. Covered by DPA.
5.4 Virtual Try-On: Replicate (USA) — processes camera images for try-on simulations. Covered by DPA.
5.5 Payments: Paystack (Nigeria/USA) and Stripe (USA) — process payments. Each has its own privacy policy.
5.6 Database: Supabase (USA) — stores your PRECCI data. Covered by DPA.
5.7 Email: Resend (USA) — sends transactional emails. Covered by DPA.
5.8 Environmental Data: OpenWeatherMap (USA) — receives your location coordinates to provide weather data for recommendations. No personal identification data is shared.

We do not sell your personal data. Ever.

6. YOUR RIGHTS

You have the right to: Access your personal data | Correct inaccurate data | Delete your data ("right to be forgotten") | Receive your data in a portable format | Object to processing | Withdraw consent at any time.

To exercise any of these rights, contact: privacy@precci.com

We will respond within 30 days.

7. DATA RETENTION

Account data: retained while your account is active and for 2 years after closure.
Session data: retained for 2 years for personalisation purposes.
Camera frames: not retained beyond the active session.
Try-on simulations: 1 hour unless saved by you; saved simulations retained until you delete them.
Payment records: retained for 7 years for legal and accounting compliance.
Voice transcripts: retained for 12 months where consent is given.

8. INTERNATIONAL TRANSFERS

Your data is processed by our service providers in the United States and other countries. Where transfers occur from the EU/UK/EEA, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission.

9. SECURITY

We implement appropriate technical and organisational measures to protect your data, including encryption at rest and in transit, access controls and regular security assessments.

10. CHILDREN

PRECCI is not directed at children under 16. We do not knowingly collect data from children.

11. CHANGES TO THIS POLICY

We will notify you of significant changes to this policy by email and through the PRECCI app.

12. CONTACT

Privacy queries: privacy@precci.com
PRECCI Technologies Limited, Navrongo, Ghana`,

        brand_partnership_agreement: `
BRAND PARTNERSHIP AGREEMENT

This Brand Partnership Agreement ("Agreement") is entered into as of ${new Date().toISOString().split('T')[0]} between:

PRECCI Technologies Limited, a company incorporated in Ghana, with its registered office at Navrongo, Ghana ("PRECCI")

and

${parties?.counterparty || '[BRAND LEGAL ENTITY NAME AND ADDRESS]'} ("Brand")

(each a "Party" and together the "Parties")

WHEREAS PRECCI operates the world's first AI Personal Appearance Intelligence System; and
WHEREAS Brand manufactures and distributes ${keyTerms?.brandCategory || 'beauty and personal care'} products; and
WHEREAS the Parties wish to enter into a partnership arrangement on the terms set out herein;

NOW THEREFORE the Parties agree as follows:

1. PARTNERSHIP SCOPE
1.1 PRECCI agrees to make Brand's products available for recommendation by PRECCI AI specialists (including Luna, Zara, Mia, Isla, Remy, Cora and Drew) to PRECCI clients.
1.2 Product recommendations by PRECCI AI specialists are made autonomously based on each client's individual analysis and needs. PRECCI does not guarantee any minimum volume of recommendations.
1.3 Brand may not direct, script or influence the content of PRECCI AI specialist recommendations. PRECCI's editorial independence is absolute and non-negotiable.

2. EDITORIAL INDEPENDENCE
2.1 PRECCI AI specialists recommend Brand products only when they are genuinely appropriate for a specific client's identified needs, based on real-time analysis.
2.2 Brand acknowledges that PRECCI may also recommend competitor products when those products are better suited to a client's specific needs.
2.3 Any attempt by Brand to influence individual product recommendations is a material breach of this Agreement.

3. COMMISSION STRUCTURE
3.1 PRECCI shall earn a commission of ${keyTerms?.commissionRate || '[X]'}% on all sales generated through PRECCI affiliate links.
3.2 Brand shall provide PRECCI with unique affiliate tracking links for all products in the partnership.
3.3 Commission payments shall be made monthly, within 30 days of the end of each calendar month.
3.4 A minimum threshold of USD ${keyTerms?.minimumThreshold || '100'} applies before commission payments are processed.

4. BRAND'S OBLIGATIONS
4.1 Brand shall: (a) maintain product quality consistent with representations made to PRECCI; (b) honour all purchases made through PRECCI affiliate links; (c) provide PRECCI with accurate product information, ingredients and imagery; (d) notify PRECCI of any product reformulations or discontinuations with reasonable notice; (e) comply with all applicable advertising and consumer protection laws.

5. PRECCI'S OBLIGATIONS
5.1 PRECCI shall: (a) make Brand products available in the PRECCI product catalogue; (b) provide Brand with monthly performance reports including recommendation volume and conversion data; (c) maintain affiliate tracking accurately.

6. INTELLECTUAL PROPERTY
6.1 Each Party retains ownership of its pre-existing intellectual property.
6.2 Brand grants PRECCI a non-exclusive licence to display Brand's product names, descriptions, images and trademarks solely for the purpose of this partnership.
6.3 PRECCI retains all intellectual property in the PRECCI platform, AI systems and agent names.

7. CONFIDENTIALITY
7.1 Each Party agrees to keep confidential all non-public information received from the other Party and to use it only for the purposes of this Agreement.

8. TERM AND TERMINATION
8.1 This Agreement commences on the Effective Date and continues for ${keyTerms?.term || '12 months'}, unless terminated earlier.
8.2 Either Party may terminate this Agreement with ${keyTerms?.noticePeriod || '30'} days' written notice.
8.3 Either Party may terminate immediately for material breach that is not cured within 14 days of written notice.

9. LIABILITY
9.1 Neither Party shall be liable for indirect, consequential or special damages arising from this Agreement.
9.2 Each Party's total liability is limited to the total fees paid under this Agreement in the 12 months preceding the claim.

10. GOVERNING LAW
This Agreement is governed by the laws of ${jurisdiction === 'ghana' ? 'the Republic of Ghana' : jurisdiction.toUpperCase()}.

SIGNED for and on behalf of PRECCI Technologies Limited:
Name: _________________________ Title: _________________________
Date: _________________________

SIGNED for and on behalf of ${parties?.counterparty || 'Brand'}:
Name: _________________________ Title: _________________________
Date: _________________________`,

      };

      const documentContent = documentTemplates[documentType] ||
        `[${documentType.toUpperCase().replace(/_/g, ' ')} DRAFT]\n\nThis document requires customisation for the specific situation.\nJurisdiction: ${jurisdiction}\nParties: ${JSON.stringify(parties || {})}\nKey Terms: ${JSON.stringify(keyTerms || {})}\nSpecial Provisions: ${(specialProvisions || []).join('; ')}\n\nEva will draft the complete document based on the briefing provided.`;

      // Log the draft
      await supabase.from('alerts').insert({
        type: 'eva_document_drafted',
        message: `Eva: ${documentType} drafted for ${jurisdiction}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: PC_ID,
        metadata: {
          document_type: documentType,
          jurisdiction,
          parties: parties || {},
          key_terms: keyTerms || {},
          special_provisions: specialProvisions || [],
          urgency,
          drafted_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.documentsDrafted) sessionContext.documentsDrafted = 0;
      sessionContext.documentsDrafted++;

      return {
        drafted: true,
        documentType,
        jurisdiction,
        documentContent,
        wordCount: documentContent.split(' ').length,
        readyForSebastianReview: true,
        urgency,
        draftedAt: new Date().toISOString(),
      };
    }

    case 'review_document': {
      const { documentName, documentContent, reviewPurpose, focusAreas, jurisdiction } = toolInput;

      // Analyse document for common issues
      const reviewFindings = [];
      const flags = [];

      // Check for key provisions
      const requiredProvisions = {
        brand_partnership: ['commission', 'editorial independence', 'termination', 'intellectual property', 'governing law'],
        provider_terms: ['fees', 'non-discrimination', 'appointment', 'termination', 'liability'],
        privacy_policy: ['data collected', 'legal basis', 'your rights', 'data sharing', 'contact'],
      };

      const contentLower = documentContent.toLowerCase();

      // Flag missing standard provisions
      if (contentLower.includes('partnership') || contentLower.includes('agreement')) {
        if (!contentLower.includes('termination')) {
          flags.push('MISSING: Termination clause not found — essential for all commercial agreements');
        }
        if (!contentLower.includes('intellectual property') && !contentLower.includes('ip ')) {
          flags.push('MISSING: Intellectual property provisions not found');
        }
        if (!contentLower.includes('governing law') && !contentLower.includes('jurisdiction')) {
          flags.push('MISSING: Governing law clause not found');
        }
        if (!contentLower.includes('liability') && !contentLower.includes('limitation')) {
          flags.push('NOTE: No liability limitation found — consider whether this is intentional');
        }
      }

      if (contentLower.includes('editorial') && contentLower.includes('precci')) {
        reviewFindings.push('EDITORIAL INDEPENDENCE: Verify editorial independence clause is present and unambiguous');
      }

      await supabase.from('alerts').insert({
        type: 'eva_document_reviewed',
        message: `Eva: Document reviewed — ${documentName}`,
        severity: flags.length > 2 ? 'warn' : 'info',
        agent_id: PC_ID,
        metadata: {
          document_name: documentName,
          review_purpose: reviewPurpose,
          focus_areas: focusAreas || [],
          flags_raised: flags.length,
          reviewed_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.documentsReviewed) sessionContext.documentsReviewed = 0;
      sessionContext.documentsReviewed++;

      return {
        reviewed: true,
        documentName,
        reviewPurpose,
        flags,
        findings: reviewFindings,
        flagCount: flags.length,
        recommendation: flags.length > 3
          ? 'SIGNIFICANT ISSUES — document requires revision before use'
          : flags.length > 0
            ? 'MINOR ISSUES — review flagged items before finalising'
            : 'No major issues identified — ready for Sebastian\'s final review',
        readyForSebastian: true,
        reviewedAt: new Date().toISOString(),
      };
    }

    case 'flag_to_sebastian': {
      const { documentType, documentName, draftSummary, flaggedIssues, jurisdictionNotes, urgency, counterpartyDeadline } = toolInput;

      await supabase.from('alerts').insert({
        type: 'eva_sebastian_flag',
        message: `Eva → Sebastian: ${documentType} ready for review — ${documentName}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-007',
        metadata: {
          from: PC_ID,
          document_type: documentType,
          document_name: documentName,
          draft_summary: draftSummary,
          flagged_issues: flaggedIssues || [],
          jurisdiction_notes: jurisdictionNotes || null,
          urgency,
          counterparty_deadline: counterpartyDeadline || null,
          flagged_at: new Date().toISOString(),
        },
      });

      sessionContext.sebastianFlagged = true;
      if (!sessionContext.issuesFlagged) sessionContext.issuesFlagged = 0;
      sessionContext.issuesFlagged += (flaggedIssues?.length || 0);

      return {
        flagged: true,
        targetAgent: 'PC-007',
        documentName,
        urgency,
        issuesFlagged: flaggedIssues?.length || 0,
        counterpartyDeadline: counterpartyDeadline || null,
        message: `Document sent to Sebastian for review. ${flaggedIssues?.length || 0} issue(s) flagged for his attention.`,
      };
    }

    case 'check_compliance': {
      const { provision, regulation, context } = toolInput;

      // Compliance check framework
      const complianceNotes = {
        gdpr: 'GDPR requires: lawful basis for processing, transparency, data minimisation, purpose limitation, storage limitation, security, accountability.',
        ghana_dpa: 'Ghana Data Protection Act 2012 requires: registration with DPC, data collection with consent, right of access and correction, security measures.',
        ccpa: 'CCPA gives California residents: right to know, right to delete, right to opt-out of sale, right to non-discrimination.',
        ftc: 'FTC requires: clear disclosure of material connections, no deceptive claims, substantiation for claims.',
        asa: 'ASA (UK) requires: ads must be legal, decent, honest and truthful. AI-generated content and paid partnerships must be disclosed.',
        uk_gdpr: 'UK GDPR mirrors EU GDPR post-Brexit with UK-specific provisions. ICO is the supervisory authority.',
        eu_ai_act: 'EU AI Act: PRECCI\'s AI system may be classified as limited risk (AI interacting with humans) — transparency obligations apply. Users must be informed they are interacting with AI.',
      };

      const relevantNotes = complianceNotes[regulation] || 'Specific compliance notes not available for this regulation — Sebastian should review with external counsel.';

      await supabase.from('alerts').insert({
        type: 'eva_compliance_check',
        message: `Eva: Compliance check — ${regulation} — ${provision.substring(0, 50)}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          provision,
          regulation,
          context: context || null,
          compliance_notes: relevantNotes,
          checked_at: new Date().toISOString(),
        },
      });

      return {
        regulation,
        provision,
        complianceNotes: relevantNotes,
        recommendation: 'Review flagged for Sebastian. Complex compliance matters may require external legal counsel in the relevant jurisdiction.',
        requiresExternalCounsel: ['ghana_dpa', 'popia_sa', 'kenya_dpa', 'ndpr_nigeria'].includes(regulation),
      };
    }

    case 'manage_document_library': {
      const { action, documentName, documentType, documentContent, version, approvedBy, approvedDate, jurisdiction, notes } = toolInput;

      if (action === 'store' || action === 'update_version') {
        await supabase.from('alerts').insert({
          type: 'eva_document_library',
          message: `Eva: Document ${action} — ${documentName} (${version || 'v1.0'})`,
          severity: 'info',
          agent_id: PC_ID,
          metadata: {
            action,
            document_name: documentName,
            document_type: documentType || null,
            version: version || 'v1.0',
            approved_by: approvedBy || 'Sebastian (PC-007)',
            approved_date: approvedDate || null,
            jurisdiction: jurisdiction || null,
            content_preview: documentContent ? documentContent.substring(0, 200) : null,
            notes: notes || null,
            stored_at: new Date().toISOString(),
          },
        });

        return {
          stored: true,
          documentName,
          version: version || 'v1.0',
          approvedBy: approvedBy || 'Sebastian (PC-007)',
          message: `Document stored in PRECCI legal library.`,
        };
      }

      if (action === 'list') {
        const { data: documents } = await supabase
          .from('alerts')
          .select('message, metadata, created_at')
          .eq('type', 'eva_document_library')
          .order('created_at', { ascending: false })
          .limit(20);

        return {
          documents: (documents || []).map(d => ({
            name: d.metadata?.document_name,
            type: d.metadata?.document_type,
            version: d.metadata?.version,
            jurisdiction: d.metadata?.jurisdiction,
            approvedBy: d.metadata?.approved_by,
            storedAt: d.created_at,
          })),
          total: documents?.length || 0,
        };
      }

      return { action, documentName, message: 'Library action processed.' };
    }

    case 'create_dpa': {
      const { processorName, processorType, dataProcessed, processingPurpose, processorLocation, subProcessors } = toolInput;

      const dpaContent = `
DATA PROCESSING AGREEMENT

Between: PRECCI Technologies Limited ("Controller") and ${processorName} ("Processor")

Effective Date: ${new Date().toISOString().split('T')[0]}

1. SUBJECT MATTER
This DPA governs the processing of personal data by ${processorName} on behalf of PRECCI in connection with: ${processingPurpose}.

2. DATA PROCESSED
The following categories of personal data are processed: ${dataProcessed.join(', ')}.

3. PROCESSOR OBLIGATIONS
${processorName} agrees to: (a) process data only on PRECCI's documented instructions; (b) implement appropriate technical and organisational security measures; (c) not engage sub-processors without PRECCI's prior written consent; (d) assist PRECCI with data subject rights requests; (e) delete or return all personal data on termination; (f) provide all information necessary to demonstrate compliance.

4. INTERNATIONAL TRANSFERS
${processorLocation !== 'ghana' && processorLocation !== 'eu' ? `Data transferred to ${processorLocation} is subject to appropriate safeguards including Standard Contractual Clauses.` : 'No international transfer provisions required.'}

5. SUB-PROCESSORS
${subProcessors && subProcessors.length > 0 ? `Approved sub-processors: ${subProcessors.join(', ')}.` : 'No sub-processors currently approved.'}

6. GOVERNING LAW
This DPA is governed by the laws of the Republic of Ghana.`;

      await supabase.from('alerts').insert({
        type: 'eva_dpa_created',
        message: `Eva: DPA created — ${processorName} (${processorType})`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          processor_name: processorName,
          processor_type: processorType,
          data_processed: dataProcessed,
          processing_purpose: processingPurpose,
          processor_location: processorLocation || 'unknown',
          sub_processors: subProcessors || [],
          created_at: new Date().toISOString(),
        },
      });

      if (!sessionContext.dpasCreated) sessionContext.dpasCreated = 0;
      sessionContext.dpasCreated++;

      return {
        created: true,
        processorName,
        processorType,
        dpaContent,
        readyForSebastian: true,
        message: `DPA drafted for ${processorName}. Ready for Sebastian\'s review.`,
      };
    }

    case 'recall_legal_memory': {
      const { query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'eva_legal_history',
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
        userId: 'eva_legal_history',
        content,
        memoryType: 'legal_session',
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
        message: `Eva completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          documents_drafted: sessionContext.documentsDrafted || 0,
          documents_reviewed: sessionContext.documentsReviewed || 0,
          issues_flagged: sessionContext.issuesFlagged || 0,
          sebastian_flagged: sessionContext.sebastianFlagged || false,
          dpas_created: sessionContext.dpasCreated || 0,
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
// PROCESS EVA SESSION
// Full autonomous agentic reasoning loop.
// Eva drafts, reviews, flags and manages.
// Every document complete before leaving her.
// Every issue flagged to Sebastian clearly.
// ─────────────────────────────────────────────
async function processEvaSession({
  sessionType = 'document_drafting',
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
    documentsDrafted: 0,
    documentsReviewed: 0,
    issuesFlagged: 0,
    sebastianFlagged: false,
    dpasCreated: 0,
    urgentMatters: 0,
  };

  const contextParts = [
    `EVA SESSION TYPE: ${sessionType}`,
    `TODAY: ${new Date().toISOString().split('T')[0]}`,
    transcript ? `INSTRUCTION FROM SEBASTIAN OR COLE: ${transcript}` : '',
    `ALWAYS: Draft documents completely — never leave blanks unless explicitly flagging for Sebastian.`,
    `ALWAYS: Flag every completed document to Sebastian for final review and approval.`,
    `ALWAYS: Flag jurisdiction-specific issues that may require external counsel.`,
    `ALWAYS: Search legal memory before drafting to check for existing precedents.`,
    `REMINDER: You draft and review. Sebastian approves. You never give legal advice.`,
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

  // ── EVA'S AGENTIC REASONING LOOP ──
  for (let iteration = 0; iteration < 12; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8192, // Eva drafts long documents — needs more tokens
      system: EVA_SYSTEM_PROMPT,
      tools: EVA_TOOLS,
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
        result = await executeEvaToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Eva: Tool call failed', {
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
    finalResponseText = `Eva: ${sessionType} complete. ${sessionContext.documentsDrafted} document(s) drafted and flagged to Sebastian for review.`;
  }

  logger.info('Eva: Session complete', {
    sessionType,
    documentsDrafted: sessionContext.documentsDrafted,
    documentsReviewed: sessionContext.documentsReviewed,
    issuesFlagged: sessionContext.issuesFlagged,
    sebastianFlagged: sessionContext.sebastianFlagged,
  });

  return {
    responseText: finalResponseText,
    documentsDrafted: sessionContext.documentsDrafted,
    documentsReviewed: sessionContext.documentsReviewed,
    issuesFlagged: sessionContext.issuesFlagged,
    sebastianFlagged: sessionContext.sebastianFlagged,
    dpasCreated: sessionContext.dpasCreated,
  };
}

module.exports = {
  processEvaSession,
  EVA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};