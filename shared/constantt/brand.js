// FILE: precci/shared/constants/brand.js
// CUTEME LTD — Brand Constants
// Single source of truth for all brand identity values.
// Every component, agent file and config references this.
// Never hardcode brand values anywhere else.

'use strict';

const BRAND = {
  // ─── COMPANY IDENTITY ───
  companyName: 'CUTEME LTD',
  tagline: 'Your Personal AI Appearance Intelligence System',
  domain: 'cuteme.com',
  connectDomain: 'cuteme.com/connect',
  email: 'hello@cuteme.com',
  legalEmail: 'legal@cuteme.com',
  privacyEmail: 'privacy@cuteme.com',
  partnershipsEmail: 'partnerships@cuteme.com',
  supportEmail: 'support@cuteme.com',
  headquartersCity: 'Navrongo',
  headquartersCountry: 'Ghana',
  foundedBy: ['Precious Mills', 'Gordon Mills'],
  brandOwner: 'Precious Mills',
  technicalChairman: 'Gordon Mills',
  copyright: `© ${new Date().getFullYear()} CUTEME LTD. All Rights Reserved.`,
  legalEntity: 'CUTEME Technologies Limited',

  // ─── COLOUR PALETTE ───
  // Source of truth: CUTEME LTD Master Specification Part 1
  colours: {
    roseGold: '#C4A494',
    blushPink: '#F2B5B0',
    warmGold: '#D4A853',
    ivoryCream: '#F7F0E8',
    deepRose: '#8B3A3A',
    champagne: '#F5DEB3',
    midnight: '#1A0A0F',
    pureWhite: '#FFFFFF',
  },

  // ─── SPECIALIST AGENT COLOURS ───
  agentColours: {
    'PC-008': { name: 'Luna', colour: '#C4A494', label: 'Rose Gold' },     // Skin
    'PC-009': { name: 'Zara', colour: '#D4A853', label: 'Warm Gold' },     // Hair
    'PC-010': { name: 'Mia', colour: '#F2B5B0', label: 'Blush Pink' },     // Makeup
    'PC-011': { name: 'Isla', colour: '#F5DEB3', label: 'Champagne' },     // Style
    'PC-012': { name: 'Remy', colour: '#8B3A3A', label: 'Deep Rose' },     // Fragrance
    'PC-013': { name: 'Cora', colour: '#F7F0E8', label: 'Ivory Cream' },   // Body
    'PC-014': { name: 'Drew', colour: '#3B82F6', label: 'Steel Blue' },    // Grooming
    'PC-015': { name: 'Sage', colour: '#4ECDC4', label: 'Teal Glow' },     // Environment
    'PC-016': { name: 'Belle', colour: '#00C8ED', label: 'Electric Cyan' }, // Try-On
    'PC-017': { name: 'Nova', colour: '#F5A623', label: 'Solar Gold' },    // Commerce
    'PC-018': { name: 'Piper', colour: '#C4A494', label: 'Rose Gold' },    // Academy
    'PC-019': { name: 'Nina', colour: '#F2B5B0', label: 'Blush Pink' },    // Social
    'PC-020': { name: 'Elton', colour: '#D4A853', label: 'Warm Gold' },    // Analytics
    'PC-021': { name: 'Lena', colour: '#F7F0E8', label: 'Ivory Cream' },   // Support
    'PC-022': { name: 'Finn', colour: '#8B3A3A', label: 'Deep Rose' },     // Ads
    'PC-023': { name: 'Aurora', colour: '#F5DEB3', label: 'Champagne' },   // Community
    'PC-024': { name: 'Cole', colour: '#3B82F6', label: 'Steel Blue' },    // Partnerships
    'PC-025': { name: 'Eva', colour: '#4ECDC4', label: 'Teal Glow' },     // Legal
    'PC-026': { name: 'Grace', colour: '#00C8ED', label: 'Electric Cyan' }, // Reception
    'PC-027': { name: 'Brook', colour: '#F5A623', label: 'Solar Gold' },   // Connect
    'PC-001': { name: 'Vivienne', colour: '#C4A494', label: 'Rose Gold' }, // CEO
    'PC-002': { name: 'Celeste', colour: '#D4A853', label: 'Warm Gold' },  // CFO
    'PC-003': { name: 'Marcus', colour: '#F2B5B0', label: 'Blush Pink' },  // CTO
    'PC-004': { name: 'Sienna', colour: '#F5DEB3', label: 'Champagne' },   // CMO
    'PC-005': { name: 'Rafael', colour: '#8B3A3A', label: 'Deep Rose' },   // CSO
    'PC-006': { name: 'Nadia', colour: '#F7F0E8', label: 'Ivory Cream' },  // COO
    'PC-007': { name: 'Sebastian', colour: '#3B82F6', label: 'Steel Blue' }, // CLO
  },

  // ─── BOARD DIRECTOR BORDER COLOURS ───
  // Per CUTEME LTD spec section 3.4
  boardColours: {
    'PC-002': '#D4A853', // Celeste — Warm Gold
    'PC-003': '#F2B5B0', // Marcus — Blush Pink
    'PC-004': '#F5DEB3', // Sienna — Champagne
    'PC-005': '#8B3A3A', // Rafael — Deep Rose
    'PC-006': '#F7F0E8', // Nadia — Ivory Cream
    'PC-007': '#3B82F6', // Sebastian — Steel Blue
  },

  // ─── STATUS COLOURS ───
  status: {
    online: '#22c55e',
    busy: '#f97316',
    waiting: '#eab308',
    error: '#ef4444',
    offline: '#64748b',
  },

  // ─── TYPOGRAPHY ───
  fonts: {
    primary: 'Inter, system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  // ─── SUBSCRIPTION TIERS ───
  tiers: {
    free: { name: 'Free', price: 0, colour: '#64748b' },
    glow: { name: 'Glow', price: 9.99, colour: '#C4A494' },
    pro: { name: 'Pro', price: 19.99, colour: '#D4A853' },
    elite: { name: 'Elite', price: 29.99, colour: '#F5DEB3' },
  },

  // ─── REVENUE STREAMS ───
  revenueStreams: [
    { id: 1, name: 'App Subscription', type: 'CORE RECURRING', agent: 'Celeste' },
    { id: 2, name: 'Freemium Upgrades', type: 'CONVERSION', agent: 'Vivienne' },
    { id: 3, name: 'AI Appearance Analysis', type: 'PAY-PER-USE', agent: 'Luna/Zara/Mia' },
    { id: 4, name: 'Virtual Try-On Feature', type: 'PREMIUM FEATURE', agent: 'Belle' },
    { id: 5, name: 'Product Recommendations', type: 'AFFILIATE PASSIVE', agent: 'Nova' },
    { id: 6, name: 'AI Styling Consultations', type: 'PREMIUM SERVICE', agent: 'Mia/Isla/Remy' },
    { id: 7, name: 'Beauty Academy & Courses', type: 'SCALABLE DIGITAL', agent: 'Piper' },
    { id: 8, name: 'Brand Partnerships', type: 'B2B INCOME', agent: 'Cole/Rafael' },
    { id: 9, name: 'Inner Circle Membership', type: 'RECURRING', agent: 'Aurora' },
    { id: 10, name: 'Digital Guides & Ebooks', type: 'PASSIVE', agent: 'Piper' },
    { id: 11, name: 'In-App Advertising', type: 'PASSIVE', agent: 'Finn' },
    { id: 12, name: 'AI Platform Licensing', type: 'B2B RECURRING', agent: 'Marcus' },
    { id: 13, name: 'Provider Registration Fee', type: 'CONNECT ONE-TIME', agent: 'Brook' },
    { id: 14, name: 'Provider Monthly Subscription', type: 'CONNECT RECURRING', agent: 'Brook' },
    { id: 15, name: 'Featured Placement', type: 'CONNECT ADD-ON', agent: 'Brook' },
    { id: 16, name: 'Per-Booking Referral Fee', type: 'CONNECT PER-USE', agent: 'Brook' },
  ],

  // ─── DASHBOARD NAVIGATION ───
  navigation: [
    { id: 'command-center', label: 'Command Center', icon: 'LayoutDashboard' },
    { id: 'executive-board', label: 'Executive Board', icon: 'Users' },
    { id: 'specialist-agents', label: 'Specialist Agents', icon: 'Bot' },
    { id: 'live-operations', label: 'Live Operations', icon: 'Activity' },
    { id: 'mission-board', label: 'Mission Board', icon: 'Kanban' },
    { id: 'communications', label: 'Communications', icon: 'MessageSquare' },
    { id: 'client-sessions', label: 'Client Sessions', icon: 'Camera' },
    { id: 'beauty-academy', label: 'Beauty Academy', icon: 'GraduationCap' },
    { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
    { id: 'revenue', label: 'Orders & Revenue', icon: 'DollarSign' },
    { id: 'system-health', label: 'System Intelligence', icon: 'Cpu' },
    { id: 'settings', label: 'Settings & Controls', icon: 'Settings' },
  ],

  // ─── AGENT ROSTER — ALL 28 ───
  agents: {
    executive: [
      { pcId: 'PC-001', name: 'Vivienne', role: 'AI Chief Executive Officer', gender: 'Female', division: 'executive' },
      { pcId: 'PC-002', name: 'Celeste', role: 'Chief Finance Officer', gender: 'Female', division: 'executive' },
      { pcId: 'PC-003', name: 'Marcus', role: 'Chief Technology Officer', gender: 'Male', division: 'executive' },
      { pcId: 'PC-004', name: 'Sienna', role: 'Chief Marketing Officer', gender: 'Female', division: 'executive' },
      { pcId: 'PC-005', name: 'Rafael', role: 'Chief Sales Officer', gender: 'Male', division: 'executive' },
      { pcId: 'PC-006', name: 'Nadia', role: 'Chief Operations Officer', gender: 'Female', division: 'executive' },
      { pcId: 'PC-007', name: 'Sebastian', role: 'Chief Legal Officer', gender: 'Male', division: 'executive' },
    ],
    beautySpecialists: [
      { pcId: 'PC-026', name: 'Grace', role: 'Reception & Client Routing', gender: 'Female', division: 'core' },
      { pcId: 'PC-008', name: 'Luna', role: 'AI Skin Analyst', gender: 'Female', division: 'core' },
      { pcId: 'PC-009', name: 'Zara', role: 'Hair Expert', gender: 'Female', division: 'core' },
      { pcId: 'PC-010', name: 'Mia', role: 'Makeup & Grooming', gender: 'Female', division: 'core' },
      { pcId: 'PC-011', name: 'Isla', role: 'Style & Outfit Advisor', gender: 'Female', division: 'core' },
      { pcId: 'PC-012', name: 'Remy', role: 'Fragrance Advisor', gender: 'Male', division: 'core' },
      { pcId: 'PC-013', name: 'Cora', role: 'Body Care Specialist', gender: 'Female', division: 'core' },
      { pcId: 'PC-014', name: 'Drew', role: 'Male Grooming Specialist', gender: 'Male', division: 'core' },
    ],
    operations: [
      { pcId: 'PC-015', name: 'Sage', role: 'Environmental Intelligence', gender: 'Female', division: 'core' },
      { pcId: 'PC-016', name: 'Belle', role: 'Virtual Try-On', gender: 'Female', division: 'core' },
      { pcId: 'PC-017', name: 'Nova', role: 'Commerce & Products', gender: 'Female', division: 'core' },
      { pcId: 'PC-018', name: 'Piper', role: 'Academy & Content', gender: 'Female', division: 'core' },
      { pcId: 'PC-019', name: 'Nina', role: 'Social Media & Influencers', gender: 'Female', division: 'core' },
      { pcId: 'PC-020', name: 'Elton', role: 'Data Analyst', gender: 'Male', division: 'core' },
      { pcId: 'PC-021', name: 'Lena', role: 'Customer Support', gender: 'Female', division: 'core' },
    ],
    growth: [
      { pcId: 'PC-022', name: 'Finn', role: 'Paid Advertising', gender: 'Male', division: 'core' },
      { pcId: 'PC-023', name: 'Aurora', role: 'Community & Membership', gender: 'Female', division: 'core' },
      { pcId: 'PC-024', name: 'Cole', role: 'Brand Partnerships', gender: 'Male', division: 'core' },
      { pcId: 'PC-025', name: 'Eva', role: 'Legal Assistant', gender: 'Female', division: 'core' },
      { pcId: 'PC-027', name: 'Brook', role: 'Connect Manager', gender: 'Female', division: 'connect' },
    ],
  },

  // ─── FINANCIAL PROJECTIONS ───
  projections: {
    startupCost: 5000,
    breakEvenMonth: 2,
    year1Revenue: 419200,
    year1Profit: 308900,
    year2Profit: 2500000,
    year3Profit: 11430000,
    totalThreeYearProfit: 14238900,
  },
};

module.exports = BRAND;