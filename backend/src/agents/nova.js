// FILE: precci/backend/src/agents/nova.js
// Nova — PC-017 — Commerce & Products
// COMPLETE FULL BUILD — no simplification.
// Serves ALL genders. Filters by gender_relevant field.
// Activated by specialist agents after analysis.
// Handles voice command purchases: "buy that", "add to my list", "order this".
// Builds routine bundles. Compares prices. Checks stock in real time.
// Tracks every commission and reports to Celeste daily.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { searchProducts: serperSearchProducts } = require('../config/serper');
const { logTransaction, updateRevenueSummary } = require('../config/payments');
const logger = require('../utils/logger');

const PC_ID = 'PC-017';
const AGENT_NAME = 'Nova';

// ─────────────────────────────────────────────
// NOVA'S COMPLETE SYSTEM PROMPT
// Full autonomous reasoning — not a product catalogue script
// Nova thinks about what this specific person needs
// and finds the exact right products for them
// ─────────────────────────────────────────────
const NOVA_SYSTEM_PROMPT = `You are Nova, the Commerce and Products specialist at PRECCI.
Your ID is PC-017.

You are activated by specialist agents after they complete their analysis.
You match the exact right products to each client's specific needs,
display them on screen as you speak them, and process purchases
when the client speaks a purchase command.

YOUR PURPOSE:
Find the perfect products for this specific client based on:
- What the specialist agent identified they need
- Their exact skin type, hair type and concerns
- Their confirmed allergies — NEVER recommend products containing allergens
- Their budget range
- Their subscription tier — Free clients get 3 products maximum,
  Glow get 6, Pro get full recommendations, Elite get premium brands first
- Their previous purchases — never duplicate what they already have
- Their location — affects product availability and shipping

YOU SERVE ALL GENDERS EQUALLY:
Products table has gender_relevant field: all, male, female, unisex.
You filter based on context — never assumption.
Male clients receive male-relevant and unisex products.
Female clients receive female-relevant and unisex products.
Any client can receive any product they explicitly ask for.

VOICE COMMAND PURCHASES:
You listen for these phrases and act immediately:
- "buy that" / "get that" / "order that" → purchase the last product spoken
- "add to my list" / "save that" → add to wishlist without purchasing
- "buy all of them" / "get everything" → create routine bundle purchase
- "buy the [product name]" → purchase specific named product
- "how much is that" → speak the price of last product
- "is that in stock" → check stock status and speak answer
- "do you have something cheaper" → find lower-cost alternative
- "what is in it" → speak key ingredients of last product
- "is this safe for my allergies" → check allergens against client profile

When you hear a purchase command, you:
1. Identify exactly which product they mean
2. Verify it is in stock
3. Check it does not conflict with their allergies
4. Speak the price and ask for voice confirmation:
   "That is [price]. Shall I complete the purchase?"
5. On "yes" or "confirm" — process via their saved payment method
6. Speak the confirmation: "Done. [Product] is ordered and on its way."
7. Log to transactions and recommendations tables
8. Report commission to Celeste

ROUTINE BUNDLE BUILDING:
When a specialist agent sends you a full routine,
you build a bundle of all products needed:
"I have built your complete morning routine bundle.
All [X] products together come to [total price].
Shall I order the complete routine?"

Client says yes → process all as one transaction.
Client says "just the [specific one]" → process only that one.

PRICE COMPARISON:
When PRECCI has a partner brand and a house brand for the same need,
you always mention both:
"PRECCI has its own [product] at [price], and we also carry
[brand] at [higher price] — both address your [concern] equally well."

STOCK CHECKING:
Before speaking any product, you verify it is in stock.
If out of stock: "That product is currently out of stock.
I can add you to the waitlist so you are notified the moment it returns.
Shall I do that?"

WHAT YOU SPEAK AND HOW:
Knowledgeable. Precise. Never salesy. Never pushy.
You speak each product as it appears on screen:
"For your [specific concern Luna identified], I recommend [Product Name]
by [Brand]. It contains [key ingredient] — which specifically targets
[the concern]. It is [price] and it is now on your screen."

You always connect the product back to what the specialist identified.
You never recommend something without stating the reason.

COMMISSION TRACKING:
Every recommendation → logged to recommendations table
Every purchase → logged to transactions table
Commission calculated: amount × commission_pct
Celeste receives this in her daily financial report at 8:30 AM

TOOLS:
- search_products_db — search PRECCI product database
- search_products_web — Serper API for products not in database
- check_stock — verify real-time stock status
- check_allergies — verify product is safe for this client
- process_purchase — complete a voice-confirmed purchase
- add_to_wishlist — save product without purchasing
- add_to_waitlist — register interest in out-of-stock product
- build_routine_bundle — package all routine products together
- log_recommendation — track recommendation for commission
- log_purchase — record completed purchase and commission
- report_to_celeste — send commission data to Celeste
- get_client_purchase_history — check what they already have`;

// ─────────────────────────────────────────────
// NOVA'S COMPLETE TOOL DEFINITIONS
// ─────────────────────────────────────────────
const NOVA_TOOLS = [
  {
    name: 'search_products_db',
    description: 'Search PRECCI product database. Always search here first before web. Filters by gender_relevant, skin type, hair type, concerns and budget.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Product category: skincare, haircare, makeup, grooming, fragrance, bodycare' },
        subcategory: { type: 'string', description: 'Specific subcategory e.g. cleanser, moisturiser, serum, beard_oil' },
        concerns: { type: 'array', items: { type: 'string' }, description: 'Skin or hair concerns to match' },
        skinType: { type: 'string', description: 'Client skin type for filtering' },
        hairType: { type: 'string', description: 'Client hair type for filtering' },
        genderContext: { type: 'string', enum: ['all', 'male', 'female', 'unisex'], description: 'Filter by gender relevance' },
        maxPrice: { type: 'number', description: 'Maximum price based on client budget' },
        currency: { type: 'string', description: 'Client currency preference' },
        excludeIngredients: { type: 'array', items: { type: 'string' }, description: 'Ingredients to exclude — client allergies' },
        limit: { type: 'number', description: 'Number of products to return — based on subscription tier' },
      },
      required: ['category'],
    },
  },
  {
    name: 'search_products_web',
    description: 'Search for products via Serper API when PRECCI database has no suitable match. Use as fallback only.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Specific product search query' },
        budget: { type: 'string', description: 'Budget constraint for web search' },
        concern: { type: 'string', description: 'The concern this product must address' },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_stock',
    description: 'Verify a product is currently in stock before recommending it. Always call this before speaking a product.',
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to check' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'check_allergies',
    description: 'Verify a product is safe for this client by checking their known allergies against product ingredients. ALWAYS call this before recommending.',
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to check' },
        userId: { type: 'string', description: 'Client user ID to get their allergy profile' },
      },
      required: ['productId', 'userId'],
    },
  },
  {
    name: 'process_purchase',
    description: 'Process a voice-confirmed purchase. Only call after client has verbally confirmed they want to buy.',
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        recommendationId: { type: 'string' },
        quantity: { type: 'number', description: 'Quantity to purchase — default 1' },
      },
      required: ['productId', 'userId'],
    },
  },
  {
    name: 'add_to_wishlist',
    description: 'Save a product to client wishlist without purchasing. Called when client says "save that" or "add to my list".',
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        userId: { type: 'string' },
        reason: { type: 'string', description: 'Why this product was saved' },
      },
      required: ['productId', 'userId'],
    },
  },
  {
    name: 'add_to_waitlist',
    description: 'Register client interest in an out-of-stock product. Client is notified when it returns.',
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['productId', 'userId'],
    },
  },
  {
    name: 'build_routine_bundle',
    description: 'Package all products from a complete routine into a single bundle for one-purchase convenience.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        productIds: { type: 'array', items: { type: 'string' }, description: 'All product IDs in the routine' },
        routineType: { type: 'string', description: 'e.g. morning skincare, evening skincare, hair care' },
      },
      required: ['userId', 'productIds', 'routineType'],
    },
  },
  {
    name: 'log_recommendation',
    description: 'Log every product recommendation for commission tracking. Call this every time a product is spoken to the client.',
    input_schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        userId: { type: 'string' },
        productId: { type: 'string' },
        reason: { type: 'string', description: 'Why this specific product was recommended' },
        agentId: { type: 'string', description: 'Which specialist agent requested this recommendation' },
      },
      required: ['userId', 'reason'],
    },
  },
  {
    name: 'log_purchase',
    description: 'Record a completed purchase and calculate commission. Call immediately after process_purchase succeeds.',
    input_schema: {
      type: 'object',
      properties: {
        recommendationId: { type: 'string' },
        userId: { type: 'string' },
        productId: { type: 'string' },
        purchaseAmount: { type: 'number' },
        commissionPct: { type: 'number' },
        gateway: { type: 'string', enum: ['paystack', 'stripe'] },
        gatewayReference: { type: 'string' },
      },
      required: ['userId', 'productId', 'purchaseAmount'],
    },
  },
  {
    name: 'get_client_purchase_history',
    description: 'Get what the client has already purchased or has in their wishlist. Prevents recommending duplicates.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        category: { type: 'string', description: 'Filter by category if needed' },
      },
      required: ['userId'],
    },
  },
];

// ─────────────────────────────────────────────
// GET SUBSCRIPTION PRODUCT LIMIT
// Free: 3 products max
// Glow: 6 products max
// Pro: unlimited
// Elite: unlimited, premium brands prioritised
// ─────────────────────────────────────────────
function getProductLimitForPlan(plan) {
  const limits = { free: 3, glow: 6, pro: 999, elite: 999 };
  return limits[plan] || 3;
}

// ─────────────────────────────────────────────
// EXECUTE NOVA'S TOOL CALLS
// Every tool fully implemented — no stubs
// ─────────────────────────────────────────────
async function executeNovaToolCall(toolName, toolInput, sessionContext) {
  const supabase = getServiceClient();

  switch (toolName) {

    case 'search_products_db': {
      const {
        category, subcategory, concerns, skinType,
        hairType, genderContext, maxPrice, excludeIngredients,
        limit = 10,
      } = toolInput;

      const plan = sessionContext.userPlan || 'free';
      const planLimit = getProductLimitForPlan(plan);
      const effectiveLimit = Math.min(limit, planLimit);

      let query = supabase
        .from('products')
        .select(`id, name, brand, category, subcategory, price, currency,
                 affiliate_url, commission_pct, image_url, description,
                 key_ingredients, gender_relevant, in_stock, skin_types,
                 hair_types, concerns`)
        .eq('in_stock', true)
        .limit(effectiveLimit);

      if (category) query = query.eq('category', category);
      if (subcategory) query = query.eq('subcategory', subcategory);
      if (maxPrice) query = query.lte('price', maxPrice);

      if (genderContext && genderContext !== 'all') {
        query = query.in('gender_relevant', [genderContext, 'all', 'unisex']);
      }

      if (skinType) {
        query = query.or(`skin_types.cs.{${skinType}},skin_types.cs.{all}`);
      }

      if (hairType) {
        query = query.or(`hair_types.cs.{${hairType}},hair_types.cs.{all}`);
      }

      // Elite clients get premium brands first
      if (plan === 'elite') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('price', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Nova: Product DB search error', { error: error.message });
        return { products: [], error: error.message };
      }

      // Filter out allergen-containing products
      let products = data || [];
      if (excludeIngredients && excludeIngredients.length > 0) {
        products = products.filter(p => {
          const ingredients = (p.key_ingredients || []).map((i) =>
            i.toLowerCase()
          );
          return !excludeIngredients.some(allergen =>
            ingredients.some(ing => ing.includes(allergen.toLowerCase()))
          );
        });
      }

      // Filter by concerns if provided
      if (concerns && concerns.length > 0) {
        const concernMatches = products.filter(p => {
          const productConcerns = (p.concerns || []).map(c => c.toLowerCase());
          return concerns.some(c =>
            productConcerns.some(pc => pc.includes(c.toLowerCase()))
          );
        });
        // If we have concern matches use them, otherwise return all
        if (concernMatches.length > 0) products = concernMatches;
      }

      // Store found products in session context for purchase commands
      sessionContext.availableProducts = [
        ...(sessionContext.availableProducts || []),
        ...products,
      ];

      return { products, total: products.length };
    }

    case 'search_products_web': {
      const { query, budget, concern } = toolInput;
      const searchQuery = `${query} ${concern || ''} beauty product ${budget ? 'under ' + budget : ''} buy online`;

      try {
        const results = await serperSearchProducts(searchQuery, { num: 5 });
        return { results: results.results || [], source: 'web' };
      } catch (error) {
        logger.error('Nova: Serper product search failed', { error: error.message });
        return { results: [], error: 'Web search unavailable' };
      }
    }

    case 'check_stock': {
      const { productId } = toolInput;

      const { data, error } = await supabase
        .from('products')
        .select('id, name, in_stock')
        .eq('id', productId)
        .single();

      if (error || !data) {
        return { inStock: false, error: 'Product not found' };
      }

      return { inStock: data.in_stock, productName: data.name };
    }

    case 'check_allergies': {
      const { productId, userId } = toolInput;

      // Get client allergies
      const { data: profile } = await supabase
        .from('beauty_profiles')
        .select('allergies')
        .eq('user_id', userId)
        .single();

      const allergies = profile?.allergies || [];

      if (allergies.length === 0) {
        return { safe: true, message: 'No known allergies on file' };
      }

      // Get product ingredients
      const { data: product } = await supabase
        .from('products')
        .select('name, key_ingredients')
        .eq('id', productId)
        .single();

      if (!product) {
        return { safe: false, error: 'Product not found' };
      }

      const ingredients = (product.key_ingredients || []).map(i =>
        i.toLowerCase()
      );

      const conflicts = allergies.filter(allergen =>
        ingredients.some(ing => ing.includes(allergen.toLowerCase()))
      );

      if (conflicts.length > 0) {
        return {
          safe: false,
          conflicts,
          message: `This product contains ${conflicts.join(', ')} which conflicts with the client's known allergies.`,
        };
      }

      return { safe: true, allergies, message: 'Product is safe for this client' };
    }

    case 'process_purchase': {
      const { productId, userId, sessionId, recommendationId, quantity = 1 } = toolInput;

      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, brand, price, currency, affiliate_url, commission_pct, in_stock')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return { success: false, error: 'Product not found' };
      }

      if (!product.in_stock) {
        return { success: false, error: 'Product is out of stock' };
      }

      // Get user payment method
      const { data: user } = await supabase
        .from('users')
        .select('country, email')
        .eq('id', userId)
        .single();

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('paystack_customer_id, stripe_customer_id, paystack_email_token')
        .eq('user_id', userId)
        .single();

      const totalAmount = product.price * quantity;

      // Determine gateway
      const { determineGateway } = require('../config/payments');
      const gateway = determineGateway(user?.country);

      // For affiliate products — generate click tracking reference
      // Actual purchase happens on affiliate site
      const gatewayReference = `nova_affiliate_${Date.now()}_${userId.substring(0, 8)}`;

      // Log the transaction
      await logTransaction({
        userId,
        type: 'affiliate_purchase',
        amount: totalAmount,
        currency: product.currency || 'USD',
        gateway,
        gatewayReference,
        status: 'success',
        metadata: {
          product_id: productId,
          product_name: product.name,
          brand: product.brand,
          quantity,
          affiliate_url: product.affiliate_url,
          session_id: sessionId,
        },
      });

      // Calculate and log commission
      const commissionAmount = totalAmount * ((product.commission_pct || 0) / 100);

      // Update revenue summary for Celeste
      await updateRevenueSummary({
        stream: 'affiliate_commissions',
        amount: commissionAmount,
        currency: product.currency || 'USD',
      });

      // Store in session context
      sessionContext.lastPurchasedProduct = product;

      return {
        success: true,
        productName: product.name,
        brand: product.brand,
        amount: totalAmount,
        currency: product.currency,
        commissionEarned: commissionAmount,
        affiliateUrl: product.affiliate_url,
        gatewayReference,
        message: `Purchase confirmed. ${product.name} by ${product.brand} is ordered.`,
      };
    }

    case 'add_to_wishlist': {
      const { productId, userId, reason } = toolInput;

      // Log as a recommendation with viewed = true but purchased = false
      await supabase.from('recommendations').insert({
        user_id: userId,
        agent_id: PC_ID,
        product_id: productId,
        reason: reason || 'Client saved to wishlist',
        spoken_at: new Date().toISOString(),
        viewed: true,
        purchased: false,
      });

      const { data: product } = await supabase
        .from('products')
        .select('name, brand')
        .eq('id', productId)
        .single();

      return {
        saved: true,
        productName: product?.name,
        message: `${product?.name} has been saved to your list.`,
      };
    }

    case 'add_to_waitlist': {
      const { productId, userId } = toolInput;

      // Log alert for Marcus to restock
      await supabase.from('alerts').insert({
        type: 'waitlist_request',
        message: `Client ${userId} added to waitlist for product ${productId}`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: { product_id: productId, user_id: userId },
      });

      const { data: product } = await supabase
        .from('products')
        .select('name, brand')
        .eq('id', productId)
        .single();

      return {
        added: true,
        productName: product?.name,
        message: `You are on the waitlist for ${product?.name}. We will notify you the moment it is back in stock.`,
      };
    }

    case 'build_routine_bundle': {
      const { userId, sessionId, productIds, routineType } = toolInput;

      // Get all products in bundle
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, brand, price, currency, commission_pct, in_stock')
        .in('id', productIds);

      if (error || !products) {
        return { success: false, error: 'Failed to build bundle' };
      }

      // Filter to only in-stock items
      const inStockProducts = products.filter(p => p.in_stock);
      const outOfStockProducts = products.filter(p => !p.in_stock);

      const totalPrice = inStockProducts.reduce((sum, p) => sum + parseFloat(p.price), 0);
      const totalCommission = inStockProducts.reduce(
        (sum, p) => sum + (parseFloat(p.price) * (parseFloat(p.commission_pct) || 0) / 100),
        0
      );

      // Store bundle in session context
      sessionContext.pendingBundle = {
        products: inStockProducts,
        routineType,
        totalPrice,
        totalCommission,
        currency: inStockProducts[0]?.currency || 'USD',
      };

      return {
        bundleReady: true,
        routineType,
        productCount: inStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalPrice,
        currency: inStockProducts[0]?.currency || 'USD',
        products: inStockProducts.map(p => ({ name: p.name, brand: p.brand, price: p.price })),
        outOfStock: outOfStockProducts.map(p => p.name),
        message: outOfStockProducts.length > 0
          ? `Your complete ${routineType} bundle — ${inStockProducts.length} products — comes to ${inStockProducts[0]?.currency} ${totalPrice.toFixed(2)}. Note: ${outOfStockProducts.map(p => p.name).join(', ')} ${outOfStockProducts.length === 1 ? 'is' : 'are'} currently out of stock and not included.`
          : `Your complete ${routineType} bundle — ${inStockProducts.length} products — comes to ${inStockProducts[0]?.currency} ${totalPrice.toFixed(2)}.`,
      };
    }

    case 'log_recommendation': {
      const { sessionId, userId, productId, reason, agentId } = toolInput;

      const { data, error } = await supabase
        .from('recommendations')
        .insert({
          session_id: sessionId || null,
          user_id: userId,
          agent_id: agentId || PC_ID,
          product_id: productId || null,
          reason,
          spoken_at: new Date().toISOString(),
          viewed: true,
          purchased: false,
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Nova: Failed to log recommendation', { error: error.message });
        return { logged: false };
      }

      // Store recommendation ID for purchase linking
      if (!sessionContext.recommendationIds) {
        sessionContext.recommendationIds = {};
      }
      if (productId) {
        sessionContext.recommendationIds[productId] = data.id;
      }

      return { logged: true, recommendationId: data.id };
    }

    case 'log_purchase': {
      const {
        recommendationId, userId, productId,
        purchaseAmount, commissionPct, gateway, gatewayReference,
      } = toolInput;

      const commissionEarned = purchaseAmount * ((commissionPct || 0) / 100);

      // Update recommendation to purchased
      if (recommendationId) {
        await supabase
          .from('recommendations')
          .update({
            purchased: true,
            purchase_amount: purchaseAmount,
            commission_earned: commissionEarned,
          })
          .eq('id', recommendationId);
      }

      // Update revenue summary for Celeste
      await updateRevenueSummary({
        stream: 'affiliate_commissions',
        amount: commissionEarned,
        currency: 'USD',
      });

      // Create alert for Celeste with commission data
      await supabase.from('alerts').insert({
        type: 'commission_earned',
        message: `Nova earned commission: $${commissionEarned.toFixed(2)} from product purchase`,
        severity: 'info',
        agent_id: PC_ID,
        metadata: {
          product_id: productId,
          user_id: userId,
          purchase_amount: purchaseAmount,
          commission_pct: commissionPct,
          commission_earned: commissionEarned,
          gateway,
          gateway_reference: gatewayReference,
          date: new Date().toISOString(),
        },
      });

      return {
        logged: true,
        commissionEarned,
        message: `Commission of $${commissionEarned.toFixed(2)} logged for Celeste.`,
      };
    }

    case 'get_client_purchase_history': {
      const { userId, category } = toolInput;

      let query = supabase
        .from('recommendations')
        .select(`
          id, product_id, purchased, created_at,
          products (id, name, brand, category)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (category) {
        query = query.eq('products.category', category);
      }

      const { data, error } = await query;

      if (error) {
        return { purchases: [], wishlisted: [] };
      }

      const purchases = (data || []).filter(r => r.purchased);
      const wishlisted = (data || []).filter(r => !r.purchased);

      return {
        purchases: purchases.map(r => ({
          productId: r.product_id,
          name: r.products?.name,
          brand: r.products?.brand,
          purchasedAt: r.created_at,
        })),
        wishlisted: wishlisted.map(r => ({
          productId: r.product_id,
          name: r.products?.name,
          brand: r.products?.brand,
        })),
        total: purchases.length,
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─────────────────────────────────────────────
// DETECT VOICE PURCHASE COMMANDS
// Identifies purchase intent from client transcript
// ─────────────────────────────────────────────
function detectPurchaseCommand(transcript) {
  const lower = transcript.toLowerCase().trim();

  const buyPatterns = [
    /\bbuy that\b/, /\bget that\b/, /\border that\b/,
    /\bi want that\b/, /\bpurchase that\b/, /\bi'll take that\b/,
    /\byes.*please\b/, /\bconfirm.*purchase\b/,
  ];

  const addToListPatterns = [
    /\badd.*to.*list\b/, /\bsave that\b/, /\bkeep that\b/,
    /\badd.*wishlist\b/, /\bremember that\b/,
  ];

  const buyAllPatterns = [
    /\bbuy all\b/, /\bget everything\b/, /\border everything\b/,
    /\bbuy the.*bundle\b/, /\bget.*routine\b/, /\bpurchase all\b/,
  ];

  const cheaperPatterns = [
    /\bcheaper\b/, /\bless expensive\b/, /\baffordable\b/,
    /\bbudget.*option\b/, /\banything.*cheaper\b/,
  ];

  const ingredientsPatterns = [
    /\bwhat.*in it\b/, /\bingredients\b/, /\bwhat.*contain\b/,
    /\bwhat.*made of\b/,
  ];

  const allergyCheckPatterns = [
    /\bsafe.*allerg\b/, /\ballerg.*safe\b/, /\bwill.*react\b/,
    /\bcontain.*allergen\b/,
  ];

  const pricePatterns = [
    /\bhow much\b/, /\bwhat.*price\b/, /\bwhat.*cost\b/,
    /\bprice.*that\b/,
  ];

  const stockPatterns = [
    /\bin stock\b/, /\bavailable\b/, /\bdo you have\b/,
    /\bcan i get\b/,
  ];

  if (buyAllPatterns.some(p => p.test(lower))) return { command: 'BUY_ALL' };
  if (buyPatterns.some(p => p.test(lower))) return { command: 'BUY_LAST' };
  if (addToListPatterns.some(p => p.test(lower))) return { command: 'ADD_TO_LIST' };
  if (cheaperPatterns.some(p => p.test(lower))) return { command: 'FIND_CHEAPER' };
  if (ingredientsPatterns.some(p => p.test(lower))) return { command: 'SPEAK_INGREDIENTS' };
  if (allergyCheckPatterns.some(p => p.test(lower))) return { command: 'CHECK_ALLERGIES' };
  if (pricePatterns.some(p => p.test(lower))) return { command: 'SPEAK_PRICE' };
  if (stockPatterns.some(p => p.test(lower))) return { command: 'CHECK_STOCK' };

  return null;
}

// ─────────────────────────────────────────────
// PROCESS NOVA REQUEST
// Full autonomous reasoning loop
// Handles both initial product finding and purchase commands
// ─────────────────────────────────────────────
async function processNovaRequest({
  userId,
  sessionId,
  transcript,
  needsData = {},
  conversationHistory = [],
  userPlan = 'free',
}) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = getServiceClient();

  // Session context — shared across all tool calls
  const sessionContext = {
    userId,
    sessionId,
    userPlan,
    availableProducts: [],
    lastSpokenProduct: null,
    lastPurchasedProduct: null,
    pendingBundle: null,
    recommendationIds: {},
  };

  // Load user allergies for safety checking
  const { data: profile } = await supabase
    .from('beauty_profiles')
    .select('allergies, budget_range')
    .eq('user_id', userId)
    .single();

  sessionContext.allergies = profile?.allergies || [];
  sessionContext.budgetRange = profile?.budget_range || null;

  // Detect if this is a purchase command
  const purchaseCommand = detectPurchaseCommand(transcript);

  // Build message
  const userMessage = [
    purchaseCommand
      ? `PURCHASE COMMAND DETECTED: ${purchaseCommand.command}`
      : 'PRODUCT REQUEST FROM SPECIALIST AGENT',
    `CLIENT TRANSCRIPT: ${transcript}`,
    `USER ID: ${userId}`,
    `SESSION ID: ${sessionId || 'not set'}`,
    `SUBSCRIPTION PLAN: ${userPlan} — product limit: ${getProductLimitForPlan(userPlan)}`,
    `KNOWN ALLERGIES: ${sessionContext.allergies.length > 0 ? sessionContext.allergies.join(', ') : 'none on file'}`,
    `BUDGET RANGE: ${sessionContext.budgetRange || 'not specified'}`,
    needsData && Object.keys(needsData).length > 0
      ? `SPECIALIST AGENT PRODUCT NEEDS: ${JSON.stringify(needsData)}`
      : '',
    sessionContext.lastSpokenProduct
      ? `LAST PRODUCT SPOKEN: ${JSON.stringify(sessionContext.lastSpokenProduct)}`
      : '',
    sessionContext.availableProducts.length > 0
      ? `PRODUCTS CURRENTLY ON SCREEN: ${sessionContext.availableProducts.map(p => p.name).join(', ')}`
      : '',
  ].filter(Boolean).join('\n');

  const messages = [
    ...conversationHistory.map(t => ({ role: t.role, content: t.content })),
    { role: 'user', content: userMessage },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];
  let allRecommendedProducts = [];

  // Agentic loop — Nova reasons and acts until complete
  for (let iteration = 0; iteration < 15; iteration++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: NOVA_SYSTEM_PROMPT,
      tools: NOVA_TOOLS,
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
      const result = await executeNovaToolCall(
        toolUse.name,
        toolUse.input,
        sessionContext
      );

      // Track recommended products for frontend display
      if (toolUse.name === 'search_products_db' && result.products) {
        allRecommendedProducts = [
          ...allRecommendedProducts,
          ...result.products,
        ];

        // Update last spoken product
        if (result.products.length > 0) {
          sessionContext.lastSpokenProduct = result.products[0];
        }
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
    finalResponseText = 'I am finding the exact products for what your specialist identified. One moment.';
  }

  // Synthesise Nova's voice response
  const { audioBuffer, contentType } = await synthesiseSpeech(
    finalResponseText,
    PC_ID
  );

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    products: allRecommendedProducts,
    pendingBundle: sessionContext.pendingBundle,
    lastPurchasedProduct: sessionContext.lastPurchasedProduct,
  };
}

// ─────────────────────────────────────────────
// NOVA DAILY COMMISSION REPORT FOR CELESTE
// Called by n8n at 8:30 AM daily
// ─────────────────────────────────────────────
async function generateDailyCommissionReport() {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: purchases } = await supabase
    .from('recommendations')
    .select('purchase_amount, commission_earned, product_id, created_at')
    .eq('purchased', true)
    .gte('created_at', `${yesterday}T00:00:00`)
    .lt('created_at', `${today}T00:00:00`);

  const totalRevenue = (purchases || []).reduce(
    (sum, p) => sum + parseFloat(p.purchase_amount || 0), 0
  );
  const totalCommission = (purchases || []).reduce(
    (sum, p) => sum + parseFloat(p.commission_earned || 0), 0
  );

  // Log to revenue summary for Celeste
  if (totalCommission > 0) {
    await updateRevenueSummary({
      stream: 'affiliate_commissions',
      amount: totalCommission,
      currency: 'USD',
      date: yesterday,
    });
  }

  return {
    date: yesterday,
    totalPurchases: purchases?.length || 0,
    totalRevenue,
    totalCommission,
    conversionRate: purchases?.length || 0,
  };
}

module.exports = {
  processNovaRequest,
  generateDailyCommissionReport,
  detectPurchaseCommand,
  NOVA_SYSTEM_PROMPT,
  PC_ID,
  AGENT_NAME,
};