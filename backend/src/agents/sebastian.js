// FILE: precci/backend/src/agents/sebastian.js
// Sebastian — PC-007 — Chief Legal Officer
// COMPLETE FULL BUILD — no simplification anywhere.
// Handles ALL partnership contracts, provider agreements,
// platform compliance, trademark protection and legal matters
// across ALL markets globally.
// All provider terms of service and booking contracts reviewed.
// Works with Eva on every document — Eva drafts, Sebastian approves.
// Works with Rafael on deal terms before contracts are drafted.
// Works with Cole on partnership compliance requirements.
// Works with Marcus on platform legal and data protection.
// Works with Celeste on financial compliance and audit trails.
// Reviews every document Eva produces before it goes out.
// Monitors legal landscape across all CUTEME LTD markets.
// Reports to Vivienne weekly. Nadia performance logging.
// Full agentic reasoning loop.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { storeAgentMemory, searchAgentMemory, buildMemoryContext } = require('../utils/embeddings');
const logger = require('../utils/logger');

const PC_ID = 'PC-007';
const AGENT_NAME = 'Sebastian';

// ─────────────────────────────────────────────
// SEBASTIAN'S COMPLETE SYSTEM PROMPT
// ─────────────────────────────────────────────
const SEBASTIAN_SYSTEM_PROMPT = `You are Sebastian, the Chief Legal Officer of CUTEME LTD.
Your ID is PC-007.

You are CUTEME LTD's legal guardian. Every contract, every
compliance requirement, every trademark filing, every platform
term — this is your domain. You are thorough, measured and
uncompromising on legal standards. You protect CUTEME LTD
in every market it operates in.

You work with Eva as your legal assistant. Eva drafts. You review,
refine and approve. Nothing leaves CUTEME LTD with legal
significance without your review. This is absolute.

You do not give legal advice to clients. You operate entirely
internally — protecting the company, structuring deals, ensuring
compliance and managing risk.

You speak with the quiet authority of someone who has read
every clause of every document in this company. You are not
alarmist. You are precise. When you flag a risk, it is real.
When you approve a document, it is sound.

YOUR LEGAL DOMAINS — COMPLETE:

1. COMMERCIAL CONTRACTS:
Brand partnership agreements: every deal Cole and Rafael close
  requires a contract you have approved. You review:
  - Commission structures and payment terms
  - Editorial independence clauses (non-negotiable for CUTEME LTD)
  - Intellectual property ownership — CUTEME LTD retains all AI IP
  - Exclusivity provisions and their market implications
  - Termination rights and post-termination obligations
  - Governing law selection — appropriate for the jurisdiction
  - Dispute resolution mechanisms

Influencer agreements: FTC/ASA compliance is mandatory.
  You verify every influencer contract includes:
  - Mandatory disclosure requirements by jurisdiction
  - Content approval rights for CUTEME LTD
  - Morality clause provisions
  - Usage rights clearly defined
  - Payment terms and invoicing procedures

Platform licensing agreements: B2B clients licensing CUTEME LTD's
  AI technology. You protect:
  - CUTEME LTD's AI intellectual property absolutely
  - API usage limitations and rate controls
  - Sub-licensing restrictions
  - Liability caps appropriate to deal size
  - Data handling obligations of licensees

2. PLATFORM LEGAL DOCUMENTS:
Client Terms of Service: you maintain and update the definitive
  version. Key provisions you protect:
  - AI disclosure — clients must know they are interacting with AI
  - Camera and voice data consent — explicit, informed, granular
  - Subscription billing terms — clear, enforceable, compliant
  - Limitation of liability — appropriate caps
  - Dispute resolution — fair, enforceable, cost-effective

Privacy Policy: GDPR-compliant, Ghana DPA compliant, with
  jurisdiction-specific provisions for all markets. You ensure:
  - All data processors named and DPAs in place
  - Data subject rights clearly explained and exercisable
  - Retention periods defined and justified
  - International transfer mechanisms in place
  - AI-specific disclosures (EU AI Act requirements)

Provider Terms of Service (CUTEME Connect): every provider
  accepts terms you have approved. You protect:
  - CUTEME LTD's right to remove underperforming providers
  - Non-discrimination obligations on all providers
  - Fee collection authority — automatic charges
  - Liability for service quality rests with provider
  - Appointment code system and verification obligations

3. INTELLECTUAL PROPERTY:
CUTEME LTD owns:
  - The CUTEME LTD brand name and logo
  - All agent names: Vivienne, Luna, Zara, Mia, Isla, Remy, Cora,
    Drew, Sage, Belle, Nova, Piper, Nina, Elton, Lena, Finn,
    Aurora, Cole, Eva, Grace, Brook — all protected
  - The AI appearance intelligence system and all technology
  - All Academy course content
  - The CUTEME LTD tagline: 'Your Personal AI Appearance
    Intelligence System'

You maintain trademark filing records and renewal schedules.
You flag to Vivienne when any competitor uses similar names
or descriptions that could infringe CUTEME LTD's IP.

4. DATA PROTECTION AND COMPLIANCE:
You oversee all data protection compliance globally:
Ghana: Data Protection Act 2012 — CUTEME LTD's primary jurisdiction
UK: UK GDPR — significant market, ICO oversight
EU: GDPR — any EU users trigger full GDPR compliance
  EU AI Act: CUTEME LTD's AI system interacts with humans —
  transparency obligations apply. Clients must know they
  interact with AI. This is already embedded in ToS and UX.
US: State privacy laws — CCPA for California users minimum
Nigeria: NDPR — major African market
Kenya: Kenya Data Protection Act 2019
South Africa: POPIA — premium beauty market

You ensure DPAs are in place with every data processor:
Anthropic (AI processing), Vapi (voice), ElevenLabs (voice
synthesis), Replicate (virtual try-on), Paystack (payments
Africa), Stripe (payments global), Supabase (database),
Resend (email), Twilio (SMS), Google Maps (location),
OpenWeatherMap (location data), Modash (influencer data).

5. CORPORATE GOVERNANCE:
You maintain CUTEME LTD's corporate standing in Ghana.
You ensure all required company filings are current.
You flag any corporate governance requirements to Vivienne.
You review any corporate structure changes.

6. RISK MANAGEMENT:
Before any major commercial decision, you assess legal risk:
- New market entry: what are the legal requirements?
- New revenue stream: what compliance obligations apply?
- New partnership: what is the contractual risk exposure?
- New technology: what IP and liability issues arise?

You present risk assessments in three levels:
LOW: Acceptable. Proceed with standard protections.
MEDIUM: Manageable. Proceed with specific provisions.
HIGH: Significant. Requires board-level discussion before proceeding.

WORKING WITH OTHER AGENTS:
Eva: your legal assistant. She drafts all documents. You review
  and approve every one. You brief Eva on what is needed.
  You never bypass Eva — every document goes through her first.
Rafael: you receive deal terms from Rafael after negotiation.
  You brief Eva to draft the contract. You review. You approve.
  You send to counterparty via Resend (Lena handles delivery).
Cole: you receive partnership pipeline updates from Cole.
  You assess legal risk on any partnership above $10,000.
  You flag IP conflicts before Rafael negotiates.
Marcus: you work with Marcus on platform legal requirements —
  data protection, API terms compliance, security standards.
  Marcus ensures technical implementation of legal requirements.
Celeste: you ensure financial operations are legally compliant.
  Subscription billing terms, refund policy, financial records
  retention — all reviewed with Celeste.
Lena: Lena sends approved contracts to counterparties via Resend.
  You brief Lena when a document is ready for delivery.
Nadia: you report performance to Nadia. You flag when legal
  workload is creating bottlenecks — Nadia coordinates.
Vivienne: you report to Vivienne. Any legal issue that could
  affect CUTEME LTD's ability to operate, any significant risk,
  any regulatory development that requires strategic response —
  goes to Vivienne immediately with your assessment and
  recommendation.

LEGAL STANDARDS YOU NEVER COMPROMISE:
- Editorial independence: no brand partner ever directs agent
  recommendations. This must be in every partnership contract.
- AI disclosure: every client must know they interact with AI.
  This is both legal obligation and brand principle.
- Non-discrimination: every provider must serve all genders,
  all backgrounds. Contractually required.
- Data consent: camera data, voice data — explicit informed
  consent. No exceptions.
- IP protection: CUTEME LTD's AI technology is its most
  valuable asset. Never licensed without watertight protections.

TOOLS AVAILABLE — USE ALL OF THEM:
- review_document: Review any legal document Eva has drafted
- approve_document: Formally approve a document for use
- flag_legal_risk: Flag a legal risk with assessment and recommendation
- check_compliance: Check a specific situation against applicable law
- manage_ip_registry: Maintain and review IP protection records
- brief_eva: Brief Eva on what needs to be drafted
- flag_to_rafael: Legal feedback on deal terms before contract
- flag_to_marcus: Data protection and platform legal requirements
- flag_to_celeste: Financial compliance requirements
- flag_to_lena: Send approved document for delivery
- flag_to_vivienne: Escalate significant legal matters
- compile_legal_status: Weekly legal status report
- recall_legal_memory: Search legal history and precedents
- store_session_memory: Save session context
- log_session_performance: Report to Nadia`;

// ─────────────────────────────────────────────
// SEBASTIAN'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const SEBASTIAN_TOOLS = [
  {
    name: 'review_document',
    description: 'Review any legal document Eva has drafted. Returns structured review with approved provisions, flagged issues and required amendments.',
    input_schema: {
      type: 'object',
      properties: {
        documentName: { type: 'string' },
        documentType: {
          type: 'string',
          enum: [
            'brand_partnership_agreement', 'influencer_agreement',
            'platform_licensing_agreement', 'provider_terms_of_service',
            'client_terms_of_service', 'privacy_policy', 'cookie_policy',
            'acceptable_use_policy', 'data_processing_agreement',
            'ip_assignment_agreement', 'nda', 'course_terms',
            'digital_guide_terms', 'general_agreement',
          ],
        },
        documentContent: { type: 'string', description: 'The document text to review' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
        dealValue: { type: 'number', description: 'Deal value if commercial agreement — higher value = more scrutiny' },
        jurisdiction: { type: 'string', description: 'Primary jurisdiction this document operates in' },
        counterparty: { type: 'string', description: 'The other party to this agreement' },
      },
      required: ['documentName', 'documentType', 'documentContent'],
    },
  },
  {
    name: 'approve_document',
    description: 'Formally approve a document for use after review is complete. Logs approval in legal registry.',
    input_schema: {
      type: 'object',
      properties: {
        documentName: { type: 'string' },
        documentType: { type: 'string' },
        version: { type: 'string' },
        approvalNotes: { type: 'string', description: 'Any conditions or notes on the approval' },
        validFor: { type: 'string', description: 'What this approval is valid for — specific deal or general use' },
        reviewedBy: { type: 'string', description: 'Always Sebastian (PC-007)' },
        expiresAt: { type: 'string', description: 'When this approval expires — for time-sensitive documents' },
      },
      required: ['documentName', 'documentType', 'version'],
    },
  },
  {
    name: 'flag_legal_risk',
    description: 'Flag a legal risk with formal risk assessment — LOW/MEDIUM/HIGH — and recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        riskTitle: { type: 'string', description: 'Brief title of the risk' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        riskDescription: { type: 'string', description: 'Full description of the legal risk' },
        potentialImpact: { type: 'string', description: 'What could happen if this risk materialises' },
        affectedArea: {
          type: 'string',
          enum: ['contracts', 'data_protection', 'ip', 'compliance', 'employment', 'financial', 'platform', 'provider_relations'],
        },
        recommendation: { type: 'string', description: 'Sebastian\'s recommendation for managing this risk' },
        requiresBoardDiscussion: { type: 'boolean' },
        requiresExternalCounsel: { type: 'boolean', description: 'Whether jurisdiction-specific external lawyers are needed' },
        jurisdiction: { type: 'string' },
      },
      required: ['riskTitle', 'riskLevel', 'riskDescription', 'recommendation'],
    },
  },
  {
    name: 'check_compliance',
    description: 'Check a specific business activity, document provision or data handling practice against applicable regulations.',
    input_schema: {
      type: 'object',
      properties: {
        activityOrProvision: { type: 'string', description: 'What is being checked' },
        applicableRegulations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which regulations apply: gdpr, uk_gdpr, ghana_dpa, ccpa, ftc, asa, eu_ai_act, ndpr, kenya_dpa, popia',
        },
        jurisdiction: { type: 'string' },
        businessContext: { type: 'string', description: 'What CUTEME LTD is doing in practice' },
      },
      required: ['activityOrProvision', 'applicableRegulations'],
    },
  },
  {
    name: 'manage_ip_registry',
    description: 'Maintain and review CUTEME LTD\'s intellectual property protection records — trademarks, copyrights, trade secrets.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['add', 'review', 'update_status', 'flag_renewal', 'query'] },
        ipType: { type: 'string', enum: ['trademark', 'copyright', 'trade_secret', 'patent', 'domain'] },
        ipName: { type: 'string', description: 'The IP being registered or reviewed' },
        jurisdiction: { type: 'string', description: 'Where protection is registered' },
        status: { type: 'string', enum: ['filed', 'pending', 'registered', 'renewal_due', 'expired', 'disputed'] },
        renewalDate: { type: 'string', description: 'When this protection needs renewal' },
        notes: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'brief_eva',
    description: 'Brief Eva on what legal document needs to be drafted. Full brief so Eva has everything she needs.',
    input_schema: {
      type: 'object',
      properties: {
        documentType: { type: 'string' },
        counterparty: { type: 'string' },
        jurisdiction: { type: 'string' },
        keyTermsFromRafael: { type: 'string', description: 'Deal terms Rafael has agreed — form the basis of the contract' },
        specialProvisions: { type: 'array', items: { type: 'string' }, description: 'Specific provisions Sebastian requires' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
        dealValue: { type: 'number' },
        context: { type: 'string', description: 'Full context Eva needs to draft accurately' },
      },
      required: ['documentType', 'urgency'],
    },
  },
  {
    name: 'flag_to_rafael',
    description: 'Legal feedback on deal terms before contract — flag issues Rafael needs to address in negotiation.',
    input_schema: {
      type: 'object',
      properties: {
        dealName: { type: 'string' },
        legalFeedback: { type: 'string', description: 'Sebastian\'s legal assessment of the proposed terms' },
        termsToAmend: { type: 'array', items: { type: 'string' }, description: 'Specific terms that need to change' },
        nonNegotiableProvisions: { type: 'array', items: { type: 'string' }, description: 'Provisions CUTEME LTD will not remove' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
      },
      required: ['dealName', 'legalFeedback'],
    },
  },
  {
    name: 'flag_to_marcus',
    description: 'Data protection and platform legal requirements for Marcus to implement technically.',
    input_schema: {
      type: 'object',
      properties: {
        requirement: { type: 'string', description: 'The legal requirement that needs technical implementation' },
        legalBasis: { type: 'string', description: 'Which regulation or contract provision requires this' },
        technicalAction: { type: 'string', description: 'What Marcus needs to implement' },
        deadline: { type: 'string', description: 'When this must be implemented' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
      },
      required: ['requirement', 'legalBasis', 'technicalAction', 'urgency'],
    },
  },
  {
    name: 'flag_to_celeste',
    description: 'Financial compliance requirements for Celeste — billing terms, refund obligations, audit trail requirements.',
    input_schema: {
      type: 'object',
      properties: {
        complianceRequirement: { type: 'string' },
        legalBasis: { type: 'string' },
        financialImpact: { type: 'string' },
        actionRequired: { type: 'string' },
      },
      required: ['complianceRequirement', 'legalBasis', 'actionRequired'],
    },
  },
  {
    name: 'flag_to_lena',
    description: 'Send approved document to Lena for delivery to counterparty via Resend.',
    input_schema: {
      type: 'object',
      properties: {
        documentName: { type: 'string' },
        documentType: { type: 'string' },
        recipientEmail: { type: 'string' },
        recipientName: { type: 'string' },
        deliveryInstructions: { type: 'string', description: 'Any specific delivery instructions for Lena' },
        urgency: { type: 'string', enum: ['normal', 'urgent'] },
        sebastianApproved: { type: 'boolean', description: 'Must be true — Sebastian has approved this document' },
      },
      required: ['documentName', 'recipientEmail', 'sebastianApproved'],
    },
  },
  {
    name: 'flag_to_vivienne',
    description: 'Escalate significant legal matters to Vivienne — risks requiring board discussion, regulatory developments, major IP issues.',
    input_schema: {
      type: 'object',
      properties: {
        issueType: {
          type: 'string',
          enum: ['legal_risk', 'regulatory_development', 'ip_threat', 'compliance_failure', 'contract_dispute', 'weekly_report'],
        },
        summary: { type: 'string' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        recommendation: { type: 'string' },
        requiresBoardDecision: { type: 'boolean' },
        urgency: { type: 'string', enum: ['normal', 'urgent', 'immediate'] },
      },
      required: ['issueType', 'summary', 'riskLevel', 'recommendation', 'urgency'],
    },
  },
  {
    name: 'compile_legal_status',
    description: 'Compile weekly legal status report — open contracts, pending reviews, IP status, compliance items, risk register.',
    input_schema: {
      type: 'object',
      properties: {
        weekEndingDate: { type: 'string' },
        includeOpenContracts: { type: 'boolean' },
        includePendingReviews: { type: 'boolean' },
        includeIPStatus: { type: 'boolean' },
        includeRiskRegister: { type: 'boolean' },
        includeComplianceCalendar: { type: 'boolean' },
      },
      required: ['weekEndingDate'],
    },
  },
  {
    name: 'recall_legal_memory',
    description: 'Search legal history — past contracts, precedents, risk assessments, compliance decisions.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'store_session_memory',
    description: 'Save legal session context.',
    input_schema: {
      type: 'object',
      properties: {
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
          enum: ['document_review', 'risk_assessment', 'compliance_check', 'ip_management', 'contract_approval', 'weekly_report', 'ad_hoc'],
        },
        documentsReviewed: { type: 'number' },
        documentsApproved: { type: 'number' },
        risksIdentified: { type: 'number' },
        risksHigh: { type: 'number' },
        evaBriefed: { type: 'boolean' },
        vivienneEscalated: { type: 'boolean' },
        jurisdictionsCovered: { type: 'array', items: { type: 'string' } },
      },
      required: ['sessionType'],
    },
  },
];

// ─────────────────────────────────────────────
// EXECUTE SEBASTIAN'S TOOL CALLS
// Every tool fully implemented
// ─────────────────────────────────────────────
async function executeSebastianToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'review_document': {
      const { documentName, documentType, documentContent, urgency, dealValue, jurisdiction, counterparty } = toolInput;

      const issues = [];
      const approved = [];
      const contentLower = documentContent.toLowerCase();

      // Check for non-negotiable CUTEME LTD provisions
      const requiredProvisions = {
        brand_partnership_agreement: [
          { check: 'editorial independence', label: 'Editorial Independence Clause', critical: true },
          { check: 'intellectual property', label: 'IP Ownership Clause', critical: true },
          { check: 'termination', label: 'Termination Rights', critical: true },
          { check: 'governing law', label: 'Governing Law', critical: true },
          { check: 'commission', label: 'Commission Structure', critical: false },
        ],
        provider_terms_of_service: [
          { check: 'non-discrimination', label: 'Non-Discrimination Obligation', critical: true },
          { check: 'appointment', label: 'Appointment Code System', critical: false },
          { check: 'termination', label: 'Termination Rights', critical: true },
          { check: 'fees', label: 'Fee Structure', critical: true },
          { check: 'liability', label: 'Liability Allocation', critical: true },
        ],
        client_terms_of_service: [
          { check: 'ai', label: 'AI Disclosure', critical: true },
          { check: 'camera', label: 'Camera Data Consent', critical: true },
          { check: 'subscription', label: 'Subscription Billing Terms', critical: true },
          { check: 'liability', label: 'Limitation of Liability', critical: true },
          { check: 'governing law', label: 'Governing Law', critical: true },
        ],
        privacy_policy: [
          { check: 'data collected', label: 'Data Collection Description', critical: true },
          { check: 'legal basis', label: 'Legal Basis for Processing', critical: true },
          { check: 'rights', label: 'Data Subject Rights', critical: true },
          { check: 'processors', label: 'Third-Party Processors', critical: true },
          { check: 'retention', label: 'Retention Periods', critical: true },
        ],
        influencer_agreement: [
          { check: 'disclosure', label: 'Disclosure/Ad Labelling Requirements', critical: true },
          { check: 'content approval', label: 'Content Approval Rights', critical: false },
          { check: 'exclusivity', label: 'Exclusivity Provisions', critical: false },
          { check: 'termination', label: 'Termination', critical: true },
          { check: 'payment', label: 'Payment Terms', critical: false },
        ],
      };

      const checks = requiredProvisions[documentType] || [];
      for (const provision of checks) {
        if (contentLower.includes(provision.check)) {
          approved.push(`✓ ${provision.label} — present`);
        } else {
          if (provision.critical) {
            issues.push(`CRITICAL MISSING: ${provision.label} — this is non-negotiable for ${documentType}`);
          } else {
            issues.push(`MISSING: ${provision.label} — should be included`);
          }
        }
      }

      // Check editorial independence specifically for brand deals
      if (documentType === 'brand_partnership_agreement') {
        if (!contentLower.includes('editorial') && !contentLower.includes('recommend')) {
          issues.push('CRITICAL: No editorial independence provision found. CUTEME LTD agents must retain absolute autonomy over recommendations. This is non-negotiable.');
        }
      }

      // Check AI disclosure for client-facing documents
      if (['client_terms_of_service', 'privacy_policy'].includes(documentType)) {
        if (!contentLower.includes('artificial intelligence') && !contentLower.includes('ai agent') && !contentLower.includes('ai system')) {
          issues.push('CRITICAL: AI disclosure insufficient. EU AI Act and platform best practice require clear disclosure that clients interact with AI. Must be explicit.');
        }
      }

      const criticalIssues = issues.filter(i => i.startsWith('CRITICAL'));
      const reviewOutcome = criticalIssues.length > 0 ? 'REQUIRES_AMENDMENT'
        : issues.length > 0 ? 'APPROVED_WITH_NOTES'
        : 'APPROVED';

      // Log the review
      await supabase.from('alerts').insert({
        type: 'sebastian_document_review',
        message: `Sebastian: Document reviewed — ${documentName} — ${reviewOutcome}`,
        severity: criticalIssues.length > 0 ? 'warn' : 'info',
        agent_id: PC_ID,
        metadata: {
          document_name: documentName,
          document_type: documentType,
          outcome: reviewOutcome,
          issues: issues,
          approved_provisions: approved,
          deal_value: dealValue || null,
          jurisdiction: jurisdiction || null,
          counterparty: counterparty || null,
          urgency,
          reviewed_at: new Date().toISOString(),
        },
      });

      sessionContext.documentsReviewed = (sessionContext.documentsReviewed || 0) + 1;
      if (reviewOutcome === 'APPROVED' || reviewOutcome === 'APPROVED_WITH_NOTES') {
        sessionContext.documentsApproved = (sessionContext.documentsApproved || 0) + 1;
      }

      return {
        documentName,
        documentType,
        reviewOutcome,
        criticalIssues: criticalIssues.length,
        totalIssues: issues.length,
        issues,
        approvedProvisions: approved,
        sebastianRecommendation: criticalIssues.length > 0
          ? `Return to Eva for amendment. Address ${criticalIssues.length} critical issue(s) before this document can be approved.`
          : issues.length > 0
            ? `Document is conditionally approved. Note the ${issues.length} non-critical item(s) for Eva to address in next version.`
            : `Document is approved. Proceed to execution.`,
        dealValue: dealValue || null,
      };
    }

    case 'approve_document': {
      const { documentName, documentType, version, approvalNotes, validFor, expiresAt } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sebastian_document_approved',
        message: `Sebastian: Document APPROVED — ${documentName} (${version || 'v1.0'})`,
        severity: 'info',
        agent_id: PC_ID,
        resolved: true,
        resolved_at: new Date().toISOString(),
        metadata: {
          document_name: documentName,
          document_type: documentType,
          version: version || 'v1.0',
          approval_notes: approvalNotes || null,
          valid_for: validFor || 'general_use',
          approved_by: PC_ID,
          approved_at: new Date().toISOString(),
          expires_at: expiresAt || null,
        },
      });

      return {
        approved: true,
        documentName,
        version: version || 'v1.0',
        approvedBy: 'Sebastian (PC-007)',
        approvedAt: new Date().toISOString(),
        validFor: validFor || 'general_use',
        message: `${documentName} formally approved by Sebastian. Ready for execution and delivery via Lena.`,
      };
    }

    case 'flag_legal_risk': {
      const { riskTitle, riskLevel, riskDescription, potentialImpact, affectedArea, recommendation, requiresBoardDiscussion, requiresExternalCounsel, jurisdiction } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sebastian_legal_risk',
        message: `Sebastian: LEGAL RISK [${riskLevel.toUpperCase()}] — ${riskTitle}`,
        severity: riskLevel === 'critical' || riskLevel === 'high' ? 'critical' : riskLevel === 'medium' ? 'warn' : 'info',
        agent_id: PC_ID,
        resolved: false,
        metadata: {
          risk_title: riskTitle,
          risk_level: riskLevel,
          risk_description: riskDescription,
          potential_impact: potentialImpact || null,
          affected_area: affectedArea || null,
          recommendation,
          requires_board_discussion: requiresBoardDiscussion || false,
          requires_external_counsel: requiresExternalCounsel || false,
          jurisdiction: jurisdiction || null,
          flagged_at: new Date().toISOString(),
        },
      });

      sessionContext.risksIdentified = (sessionContext.risksIdentified || 0) + 1;
      if (riskLevel === 'high' || riskLevel === 'critical') {
        sessionContext.risksHigh = (sessionContext.risksHigh || 0) + 1;
      }

      return {
        flagged: true,
        riskTitle,
        riskLevel,
        recommendation,
        requiresBoardDiscussion: requiresBoardDiscussion || false,
        requiresExternalCounsel: requiresExternalCounsel || false,
        message: riskLevel === 'high' || riskLevel === 'critical'
          ? `HIGH/CRITICAL risk flagged. Escalating to Vivienne. Board discussion ${requiresBoardDiscussion ? 'required' : 'recommended'}.`
          : `Risk logged at ${riskLevel} level. Managing within standard legal operations.`,
      };
    }

    case 'check_compliance': {
      const { activityOrProvision, applicableRegulations, jurisdiction, businessContext } = toolInput;

      const complianceNotes = {
        gdpr: {
          keyRequirements: ['Lawful basis for processing', 'Transparency and fair processing', 'Data minimisation', 'Purpose limitation', 'Storage limitation', 'Integrity and confidentiality', 'Accountability'],
          cutemeContext: 'GDPR applies to any EU resident using CUTEME LTD. Camera data and voice data require explicit consent (Article 6(1)(a)). AI processing disclosure required under Article 22.',
        },
        uk_gdpr: {
          keyRequirements: ['Same as EU GDPR with UK-specific provisions', 'ICO is the supervisory authority', 'UK GDPR Article 22 covers automated decision-making'],
          cutemeContext: 'UK users are covered by UK GDPR post-Brexit. Camera AI analysis constitutes automated processing — disclosure and opt-out required.',
        },
        ghana_dpa: {
          keyRequirements: ['Registration with Data Protection Commission', 'Consent required for sensitive data', 'Right of access and correction', 'Cross-border transfer restrictions'],
          cutemeContext: 'CUTEME LTD is incorporated in Ghana — full Ghana DPA compliance required as primary jurisdiction.',
        },
        ftc: {
          keyRequirements: ['No deceptive claims', 'Substantiation required for all claims', 'Clear disclosure of material connections', 'AI disclosure requirements emerging'],
          cutemeContext: 'US users and any US influencer marketing requires FTC compliance. All sponsored content must be disclosed.',
        },
        asa: {
          keyRequirements: ['Ads must be legal, decent, honest, truthful', 'Paid partnerships must be disclosed (#ad)', 'Claims must be substantiated'],
          cutemeContext: 'UK social media content by Nina and influencer partnerships require ASA compliance.',
        },
        eu_ai_act: {
          keyRequirements: ['Transparency to users interacting with AI', 'Limited risk AI systems (chatbots, recommendation) require disclosure', 'AI-generated content labelling'],
          cutemeContext: 'CUTEME LTD\'s AI agents interacting with EU users fall under EU AI Act limited risk category. Mandatory disclosure already in ToS and UX.',
        },
        ccpa: {
          keyRequirements: ['Right to know', 'Right to delete', 'Right to opt-out of sale', 'Right to non-discrimination'],
          cutemeContext: 'California users trigger CCPA. CUTEME LTD does not sell personal data. Privacy policy must include California-specific rights.',
        },
        ndpr: {
          keyRequirements: ['Consent for data processing', 'Data subject rights', 'Data breach notification', 'Transfer restrictions'],
          cutemeContext: 'Nigerian users covered by NDPR. Major African market — full compliance required.',
        },
      };

      const assessments = applicableRegulations.map(reg => ({
        regulation: reg,
        notes: complianceNotes[reg] || { keyRequirements: ['Refer to specific regulation text'], cutemeContext: 'Assessment requires external legal counsel for this jurisdiction' },
        requiresExternalCounsel: !complianceNotes[reg],
      }));

      return {
        activityOrProvision,
        jurisdiction: jurisdiction || 'multiple',
        assessments,
        overallAssessment: assessments.some(a => a.requiresExternalCounsel)
          ? 'EXTERNAL_COUNSEL_RECOMMENDED for some jurisdictions'
          : 'INTERNAL_ASSESSMENT_COMPLETE',
        sebastianRecommendation: `Review each regulation assessment. Where external counsel is flagged, engage local legal advisors before proceeding in that jurisdiction.`,
      };
    }

    case 'manage_ip_registry': {
      const { action, ipType, ipName, jurisdiction, status, renewalDate, notes } = toolInput;

      if (action === 'add' || action === 'update_status') {
        await supabase.from('alerts').insert({
          type: 'sebastian_ip_registry',
          message: `Sebastian: IP Registry ${action} — ${ipName || 'review'} (${ipType || 'general'})`,
          severity: status === 'renewal_due' || status === 'expired' ? 'warn' : 'info',
          agent_id: PC_ID,
          metadata: {
            action,
            ip_type: ipType,
            ip_name: ipName,
            jurisdiction: jurisdiction || null,
            status: status || null,
            renewal_date: renewalDate || null,
            notes: notes || null,
            actioned_at: new Date().toISOString(),
          },
        });

        return {
          recorded: true,
          action,
          ipName,
          ipType,
          status: status || 'filed',
          jurisdiction,
          renewalDate: renewalDate || null,
        };
      }

      if (action === 'query' || action === 'review') {
        const { data: ipRecords } = await supabase
          .from('alerts')
          .select('message, metadata, created_at')
          .eq('type', 'sebastian_ip_registry')
          .order('created_at', { ascending: false })
          .limit(20);

        const renewalDue = (ipRecords || []).filter(r => r.metadata?.status === 'renewal_due');

        return {
          totalRecords: ipRecords?.length || 0,
          renewalsDue: renewalDue.length,
          records: (ipRecords || []).map(r => ({
            name: r.metadata?.ip_name,
            type: r.metadata?.ip_type,
            status: r.metadata?.status,
            jurisdiction: r.metadata?.jurisdiction,
            renewalDate: r.metadata?.renewal_date,
          })),
          cutemeIpAssets: [
            'CUTEME LTD — brand name and logo',
            'All 28 agent names (Vivienne, Luna, Zara, Mia, Isla, Remy, Cora, Drew, Sage, Belle, Nova, Piper, Nina, Elton, Lena, Finn, Aurora, Cole, Eva, Grace, Brook, Celeste, Marcus, Sienna, Rafael, Nadia, Sebastian)',
            'Your Personal AI Appearance Intelligence System — tagline',
            'AI appearance intelligence system — core technology',
            'CUTEME Academy — education platform brand',
            'CUTEME Connect — marketplace brand',
            'Inner Circle — community brand',
          ],
        };
      }

      if (action === 'flag_renewal') {
        await supabase.from('alerts').insert({
          type: 'sebastian_ip_renewal',
          message: `Sebastian: IP RENEWAL DUE — ${ipName} (${ipType}) in ${jurisdiction}`,
          severity: 'warn',
          agent_id: 'PC-001',
          metadata: {
            ip_name: ipName,
            ip_type: ipType,
            jurisdiction,
            renewal_date: renewalDate,
            flagged_at: new Date().toISOString(),
          },
        });

        return {
          flagged: true,
          ipName,
          renewalDate,
          message: `Renewal flag raised to Vivienne. ${ipName} requires renewal by ${renewalDate}.`,
        };
      }

      return { action, message: 'IP registry action processed.' };
    }

    case 'brief_eva': {
      const { documentType, counterparty, jurisdiction, keyTermsFromRafael, specialProvisions, urgency, dealValue, context } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sebastian_eva_brief',
        message: `Sebastian → Eva: Draft required — ${documentType}${counterparty ? ` for ${counterparty}` : ''}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-025',
        metadata: {
          from: PC_ID,
          document_type: documentType,
          counterparty: counterparty || null,
          jurisdiction: jurisdiction || 'ghana',
          key_terms: keyTermsFromRafael || null,
          special_provisions: specialProvisions || [],
          urgency,
          deal_value: dealValue || null,
          context: context || null,
          non_negotiable_provisions: [
            'Editorial independence clause (if brand partnership)',
            'CUTEME LTD IP ownership protection',
            'AI disclosure (if client-facing)',
            'Non-discrimination obligation (if provider agreement)',
            'Governing law: Ghana (primary) with appropriate jurisdiction provisions',
          ],
          briefed_at: new Date().toISOString(),
        },
      });

      sessionContext.evaBriefed = true;

      return {
        briefed: true,
        targetAgent: 'PC-025',
        documentType,
        urgency,
        message: `Eva has been briefed to draft ${documentType}. Will return for Sebastian's review before any delivery.`,
      };
    }

    case 'flag_to_rafael': {
      const { dealName, legalFeedback, termsToAmend, nonNegotiableProvisions, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sebastian_rafael_feedback',
        message: `Sebastian → Rafael: Legal feedback on ${dealName}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-005',
        metadata: {
          from: PC_ID,
          deal_name: dealName,
          legal_feedback: legalFeedback,
          terms_to_amend: termsToAmend || [],
          non_negotiable: nonNegotiableProvisions || [
            'Editorial independence — non-negotiable',
            'CUTEME LTD IP retention — non-negotiable',
            'Governing law — Ghana preferred',
          ],
          urgency,
          sent_at: new Date().toISOString(),
        },
      });

      return {
        sent: true,
        targetAgent: 'PC-005',
        dealName,
        amendmentsRequired: termsToAmend?.length || 0,
        message: `Legal feedback sent to Rafael for ${dealName}. ${termsToAmend?.length || 0} term(s) require amendment before contract can proceed.`,
      };
    }

    case 'flag_to_marcus': {
      const { requirement, legalBasis, technicalAction, deadline, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sebastian_marcus_requirement',
        message: `Sebastian → Marcus: Legal technical requirement — ${requirement.substring(0, 60)}`,
        severity: urgency === 'immediate' ? 'critical' : urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-003',
        metadata: {
          from: PC_ID,
          requirement,
          legal_basis: legalBasis,
          technical_action: technicalAction,
          deadline: deadline || null,
          urgency,
          sent_at: new Date().toISOString(),
        },
      });

      return {
        sent: true,
        targetAgent: 'PC-003',
        requirement,
        technicalAction,
        deadline: deadline || 'As soon as practicable',
        message: `Legal technical requirement sent to Marcus.`,
      };
    }

    case 'flag_to_celeste': {
      const { complianceRequirement, legalBasis, financialImpact, actionRequired } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sebastian_celeste_compliance',
        message: `Sebastian → Celeste: Financial compliance requirement — ${complianceRequirement.substring(0, 60)}`,
        severity: 'info',
        agent_id: 'PC-002',
        metadata: {
          from: PC_ID,
          compliance_requirement: complianceRequirement,
          legal_basis: legalBasis,
          financial_impact: financialImpact || null,
          action_required: actionRequired,
          sent_at: new Date().toISOString(),
        },
      });

      return {
        sent: true,
        targetAgent: 'PC-002',
        complianceRequirement,
        actionRequired,
        message: `Financial compliance requirement sent to Celeste.`,
      };
    }

    case 'flag_to_lena': {
      const { documentName, documentType, recipientEmail, recipientName, deliveryInstructions, urgency, sebastianApproved } = toolInput;

      if (!sebastianApproved) {
        return {
          sent: false,
          error: 'Document must be approved by Sebastian before delivery. Run approve_document first.',
        };
      }

      await supabase.from('alerts').insert({
        type: 'sebastian_lena_delivery',
        message: `Sebastian → Lena: Deliver approved document — ${documentName} to ${recipientEmail}`,
        severity: urgency === 'urgent' ? 'warn' : 'info',
        agent_id: 'PC-021',
        metadata: {
          from: PC_ID,
          document_name: documentName,
          document_type: documentType,
          recipient_email: recipientEmail,
          recipient_name: recipientName || null,
          delivery_instructions: deliveryInstructions || 'Standard delivery — professional cover email',
          sebastian_approved: true,
          urgency,
          sent_at: new Date().toISOString(),
        },
      });

      return {
        sent: true,
        targetAgent: 'PC-021',
        documentName,
        recipientEmail,
        urgency,
        message: `Lena instructed to deliver ${documentName} to ${recipientEmail}.`,
      };
    }

    case 'flag_to_vivienne': {
      const { issueType, summary, riskLevel, recommendation, requiresBoardDecision, urgency } = toolInput;

      await supabase.from('alerts').insert({
        type: 'sebastian_vivienne_escalation',
        message: `Sebastian → Vivienne: ${issueType} [${riskLevel.toUpperCase()}] — ${summary.substring(0, 80)}`,
        severity: urgency === 'immediate' ? 'critical' : riskLevel === 'high' || riskLevel === 'critical' ? 'warn' : 'info',
        agent_id: 'PC-001',
        metadata: {
          from: PC_ID,
          issue_type: issueType,
          summary,
          risk_level: riskLevel,
          recommendation,
          requires_board_decision: requiresBoardDecision || false,
          urgency,
          escalated_at: new Date().toISOString(),
        },
      });

      sessionContext.vivienneEscalated = true;

      return {
        escalated: true,
        targetAgent: 'PC-001',
        issueType,
        riskLevel,
        requiresBoardDecision: requiresBoardDecision || false,
        message: `Legal matter escalated to Vivienne at ${riskLevel} risk level.`,
      };
    }

    case 'compile_legal_status': {
      const { weekEndingDate, includeOpenContracts, includePendingReviews, includeIPStatus, includeRiskRegister } = toolInput;

      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Open contracts (pending review or approval)
      const { data: pendingDocs } = await supabase
        .from('alerts')
        .select('message, metadata, created_at')
        .eq('type', 'sebastian_document_review')
        .gte('created_at', weekStart)
        .eq('resolved', false);

      // Approved documents
      const { data: approvedDocs } = await supabase
        .from('alerts')
        .select('message, metadata, created_at')
        .eq('type', 'sebastian_document_approved')
        .gte('created_at', weekStart);

      // Active risks
      const { data: activeRisks } = await supabase
        .from('alerts')
        .select('message, metadata, severity, created_at')
        .eq('type', 'sebastian_legal_risk')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      const highRisks = (activeRisks || []).filter(r => r.severity === 'critical' || r.severity === 'warn');

      // Eva briefs sent
      const { data: evaBriefs } = await supabase
        .from('alerts')
        .select('message, created_at')
        .eq('type', 'sebastian_eva_brief')
        .gte('created_at', weekStart);

      return {
        weekEnding: weekEndingDate,
        compiledAt: new Date().toISOString(),
        openContracts: includeOpenContracts ? {
          pendingReview: pendingDocs?.length || 0,
          awaitingEva: evaBriefs?.length || 0,
          approvedThisWeek: approvedDocs?.length || 0,
        } : null,
        riskRegister: includeRiskRegister ? {
          totalActiveRisks: activeRisks?.length || 0,
          highPriorityRisks: highRisks.length,
          risks: highRisks.map(r => ({
            title: r.metadata?.risk_title,
            level: r.metadata?.risk_level,
            recommendation: r.metadata?.recommendation,
          })),
        } : null,
        weeklyAssessment: highRisks.length > 2 ? 'LEGAL_ATTENTION_REQUIRED'
          : highRisks.length > 0 ? 'MONITOR_CLOSELY'
          : 'LEGAL_POSITION_SOUND',
      };
    }

    case 'recall_legal_memory': {
      const { query, limit } = toolInput;

      const memories = await searchAgentMemory({
        agentId: PC_ID,
        userId: 'sebastian_legal_history',
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
        userId: 'sebastian_legal_history',
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
        message: `Sebastian completed ${toolInput.sessionType} session`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          ...toolInput,
          documents_reviewed: sessionContext.documentsReviewed || 0,
          documents_approved: sessionContext.documentsApproved || 0,
          risks_identified: sessionContext.risksIdentified || 0,
          risks_high: sessionContext.risksHigh || 0,
          eva_briefed: sessionContext.evaBriefed || false,
          vivienne_escalated: sessionContext.vivienneEscalated || false,
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
// PROCESS SEBASTIAN SESSION
// Full autonomous agentic reasoning loop.
// Sebastian reviews, assesses, approves, protects.
// Nothing leaves CUTEME LTD legally unsound.
// ─────────────────────────────────────────────
async function processSebastianSession({
  sessionType = 'document_review',
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
    documentsReviewed: 0,
    documentsApproved: 0,
    risksIdentified: 0,
    risksHigh: 0,
    evaBriefed: false,
    vivienneEscalated: false,
  };

  const today = new Date();
  const isSunday = today.getDay() === 0;

  const contextParts = [
    `SEBASTIAN SESSION TYPE: ${sessionType}`,
    `TODAY: ${today.toISOString().split('T')[0]}`,
    transcript ? `INSTRUCTION OR DOCUMENT FOR REVIEW: ${transcript}` : '',
    isSunday ? 'SUNDAY: Compile complete weekly legal status report for Vivienne.' : '',
    `ALWAYS: Check alerts table for pending document reviews from Eva (type: eva_document_drafted).`,
    `ALWAYS: Check alerts table for contract handoffs from Rafael (type: rafael_sebastian_handoff).`,
    `ALWAYS: Every document reviewed must be formally approved or returned for amendment.`,
    `NON-NEGOTIABLE: Editorial independence, IP protection, AI disclosure, non-discrimination — in every relevant document.`,
    `STANDARD: High or critical risks escalate to Vivienne immediately.`,
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

  for (let iteration = 0; iteration < 12; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: SEBASTIAN_SYSTEM_PROMPT,
      tools: SEBASTIAN_TOOLS,
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
        result = await executeSebastianToolCall(
          toolUse.name,
          toolUse.input,
          sessionContext
        );
      } catch (toolError) {
        logger.error('Sebastian: Tool call failed', {
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
    finalResponseText = `Sebastian: ${sessionType} complete. ${sessionContext.documentsReviewed} document(s) reviewed. ${sessionContext.risksIdentified} risk(s) identified.`;
  }

  logger.info('Sebastian: Session complete', {
    sessionType,
    documentsReviewed: sessionContext.documentsReviewed,
    documentsApproved: sessionContext.documentsApproved,
    risksIdentified: sessionContext.risksIdentified,
    risksHigh: sessionContext.risksHigh,
    vivienneEscalated: sessionContext.vivienneEscalated,
  });

  return {
    responseText: finalResponseText,
    documentsReviewed: sessionContext.documentsReviewed,
    documentsApproved: sessionContext.documentsApproved,
    risksIdentified: sessionContext.risksIdentified,
    risksHigh: sessionContext.risksHigh,
    evaBriefed: sessionContext.evaBriefed,
    vivienneEscalated: sessionContext.vivienneEscalated,
  };
}

module.exports = {
  processSebastianSession,
  SEBASTIAN_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};