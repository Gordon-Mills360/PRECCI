// FILE: precci/backend/src/services/allergyChecker.service.js
// Complete allergy checking system for all PRECCI agents.
// Every product recommended by any agent passes through this check.
// Claude receives the result and reasons about how to handle it
// naturally in conversation — never mechanically.
// No product containing a known allergen is ever recommended
// without explicit client awareness and consent.

'use strict';

const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// COMPREHENSIVE INGREDIENT ALIAS MAP
// Many ingredients have multiple names.
// A client allergic to "fragrance" may not know
// that "parfum" is the same thing.
// This map ensures we catch all aliases.
// ─────────────────────────────────────────────
const INGREDIENT_ALIASES = {
  // Fragrance
  'fragrance': ['parfum', 'fragrance', 'perfume', 'aroma', 'scent', 'linalool', 'limonene', 'citronellol', 'geraniol', 'eugenol', 'cinnamal', 'benzyl alcohol', 'benzyl salicylate', 'coumarin', 'isoeugenol', 'farnesol', 'citral', 'anise alcohol', 'benzyl cinnamate'],

  // Parabens
  'paraben': ['methylparaben', 'propylparaben', 'butylparaben', 'ethylparaben', 'isobutylparaben', 'isopropylparaben', 'benzylparaben'],

  // Sulphates
  'sulphate': ['sulfate', 'sodium lauryl sulfate', 'sls', 'sodium laureth sulfate', 'sles', 'ammonium lauryl sulfate', 'ammonium laureth sulfate', 'sodium myreth sulfate'],

  // Silicones
  'silicone': ['dimethicone', 'cyclomethicone', 'cyclopentasiloxane', 'cyclotetrasiloxane', 'trimethicone', 'amodimethicone', 'phenyl trimethicone', 'dimethiconol'],

  // Alcohols
  'alcohol': ['ethanol', 'isopropyl alcohol', 'sd alcohol', 'denatured alcohol', 'alcohol denat'],

  // Nut allergens
  'nut': ['almond oil', 'prunus amygdalus', 'macadamia oil', 'macadamia ternifolia', 'walnut oil', 'juglans regia', 'hazelnut oil', 'corylus avellana', 'peanut oil', 'arachis hypogaea', 'shea butter', 'butyrospermum parkii', 'brazil nut oil', 'bertholletia excelsa'],

  // Gluten
  'gluten': ['wheat germ oil', 'triticum vulgare', 'hydrolyzed wheat protein', 'wheat starch', 'barley extract', 'hordeum vulgare', 'oat extract', 'avena sativa', 'rye extract'],

  // Lanolin (wool allergy)
  'lanolin': ['wool wax', 'wool fat', 'wool grease', 'adeps lanae', 'lanolin alcohol', 'laneth'],

  // Formaldehyde releasers
  'formaldehyde': ['dmdm hydantoin', 'imidazolidinyl urea', 'diazolidinyl urea', 'quaternium-15', 'bronopol', '2-bromo-2-nitropropane-1,3-diol', 'sodium hydroxymethylglycinate'],

  // Essential oils (common sensitisers)
  'essential oil': ['tea tree oil', 'melaleuca alternifolia', 'lavender oil', 'lavandula angustifolia', 'peppermint oil', 'mentha piperita', 'eucalyptus oil', 'eucalyptus globulus', 'clove oil', 'eugenia caryophyllus', 'cinnamon oil', 'cinnamomum zeylanicum'],

  // Retinol / Vitamin A derivatives
  'retinol': ['retinyl palmitate', 'retinyl acetate', 'retinaldehyde', 'retinoic acid', 'tretinoin', 'adapalene'],

  // AHAs
  'aha': ['glycolic acid', 'lactic acid', 'mandelic acid', 'malic acid', 'citric acid', 'tartaric acid'],

  // BHAs
  'bha': ['salicylic acid', 'beta hydroxy acid', 'willow bark extract', 'salix alba'],

  // Niacinamide
  'niacinamide': ['nicotinamide', 'vitamin b3', 'niacin'],

  // Vitamin C
  'vitamin c': ['ascorbic acid', 'l-ascorbic acid', 'ascorbyl glucoside', 'sodium ascorbyl phosphate', 'magnesium ascorbyl phosphate', 'ascorbyl tetraisopalmitate', 'ethyl ascorbic acid'],

  // Benzoyl peroxide
  'benzoyl peroxide': ['benzoyl peroxide', 'bzp', 'benzoyl oxide'],

  // Mineral oil
  'mineral oil': ['paraffinum liquidum', 'paraffin oil', 'white mineral oil', 'petrolatum', 'petroleum jelly', 'vaseline'],

  // Propylene glycol
  'propylene glycol': ['propylene glycol', 'pg', '1,2-propanediol'],

  // Shellac / Animal derivatives
  'shellac': ['lac-resin', 'lac', 'shellac wax'],
  'carmine': ['ci 75470', 'cochineal', 'crimson lake', 'natural red 4'],
  'collagen': ['hydrolyzed collagen', 'soluble collagen', 'marine collagen'],
};

// ─────────────────────────────────────────────
// EXPAND ALLERGEN TERMS
// Takes a client's stated allergy and expands it
// to all possible ingredient names it could appear as
// ─────────────────────────────────────────────
function expandAllergenTerms(allergen) {
  const allergenLower = allergen.toLowerCase().trim();
  const terms = new Set([allergenLower]);

  // Check direct alias matches
  for (const [key, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    if (
      allergenLower.includes(key) ||
      key.includes(allergenLower) ||
      aliases.some(a => a.includes(allergenLower) || allergenLower.includes(a))
    ) {
      aliases.forEach(a => terms.add(a.toLowerCase()));
      terms.add(key.toLowerCase());
    }
  }

  return Array.from(terms);
}

// ─────────────────────────────────────────────
// GET CLIENT ALLERGY PROFILE
// Loads and expands the client's known allergies
// ─────────────────────────────────────────────
async function getClientAllergyProfile(userId) {
  const supabase = getServiceClient();

  const { data: profile, error } = await supabase
    .from('beauty_profiles')
    .select('allergies')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    return {
      hasAllergies: false,
      allergies: [],
      expandedTerms: [],
      summary: 'No allergy profile on file for this client.',
    };
  }

  const allergies = profile.allergies || [];

  if (allergies.length === 0) {
    return {
      hasAllergies: false,
      allergies: [],
      expandedTerms: [],
      summary: 'No known allergies on file.',
    };
  }

  // Expand each allergen to all its possible names
  const expandedTerms = new Set();
  allergies.forEach(allergen => {
    expandAllergenTerms(allergen).forEach(term => expandedTerms.add(term));
  });

  return {
    hasAllergies: true,
    allergies,
    expandedTerms: Array.from(expandedTerms),
    summary: `Client has ${allergies.length} known allerg${allergies.length === 1 ? 'y' : 'ies'}: ${allergies.join(', ')}. Always verify products are free of these before recommending.`,
  };
}

// ─────────────────────────────────────────────
// CHECK SINGLE PRODUCT SAFETY
// Checks one product against client's allergy profile
// Returns detailed conflict information
// ─────────────────────────────────────────────
async function checkProductSafety(productId, userId) {
  const supabase = getServiceClient();

  // Get allergy profile
  const allergyProfile = await getClientAllergyProfile(userId);

  if (!allergyProfile.hasAllergies) {
    return {
      safe: true,
      conflicts: [],
      warnings: [],
      message: 'No known allergies — product is safe to recommend.',
      allergyProfile,
    };
  }

  // Get product ingredients
  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, brand, key_ingredients, description')
    .eq('id', productId)
    .single();

  if (error || !product) {
    return {
      safe: false,
      conflicts: [],
      warnings: ['Product not found in database — cannot verify safety'],
      message: 'Unable to verify product safety — product not found.',
      allergyProfile,
    };
  }

  const ingredients = (product.key_ingredients || []).map(i => i.toLowerCase());

  // If no ingredients listed, flag as unverifiable
  if (ingredients.length === 0) {
    return {
      safe: null, // Unknown — not confirmed safe or unsafe
      conflicts: [],
      warnings: ['No ingredient list available for this product — cannot verify allergen safety'],
      message: `${product.name} has no ingredient list available. Cannot confirm it is safe for this client's allergies. Consider recommending a product with a known full ingredient list.`,
      product: { id: product.id, name: product.name, brand: product.brand },
      allergyProfile,
    };
  }

  // Check each expanded allergen term against ingredients
  const conflicts = [];
  const expandedTerms = allergyProfile.expandedTerms;

  for (const allergen of allergyProfile.allergies) {
    const allergenTerms = expandAllergenTerms(allergen);

    const matchedIngredients = ingredients.filter(ing =>
      allergenTerms.some(term =>
        ing.includes(term) || term.includes(ing)
      )
    );

    if (matchedIngredients.length > 0) {
      conflicts.push({
        allergen,
        matchedIngredients,
        severity: getSeverity(allergen),
        explanation: buildConflictExplanation(allergen, matchedIngredients, product.name),
      });
    }
  }

  if (conflicts.length > 0) {
    const highSeverity = conflicts.some(c => c.severity === 'high');

    return {
      safe: false,
      conflicts,
      warnings: [],
      severity: highSeverity ? 'high' : 'moderate',
      message: buildUnsafeMessage(product, conflicts),
      product: { id: product.id, name: product.name, brand: product.brand },
      allergyProfile,
    };
  }

  return {
    safe: true,
    conflicts: [],
    warnings: [],
    message: `${product.name} has been checked against this client's allergies and is safe to recommend.`,
    product: { id: product.id, name: product.name, brand: product.brand },
    allergyProfile,
  };
}

// ─────────────────────────────────────────────
// CHECK MULTIPLE PRODUCTS
// Batch checks a list of products for a client
// Returns safe products, unsafe products and unknowns
// ─────────────────────────────────────────────
async function checkProductListSafety(productIds, userId) {
  const allergyProfile = await getClientAllergyProfile(userId);

  if (!allergyProfile.hasAllergies) {
    return {
      allSafe: true,
      safeProductIds: productIds,
      unsafeProductIds: [],
      unknownProductIds: [],
      conflicts: {},
      allergyProfile,
    };
  }

  const supabase = getServiceClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, key_ingredients')
    .in('id', productIds);

  if (error || !products) {
    return {
      allSafe: null,
      safeProductIds: [],
      unsafeProductIds: [],
      unknownProductIds: productIds,
      conflicts: {},
      allergyProfile,
      error: 'Failed to retrieve product data for allergy checking',
    };
  }

  const safeProductIds = [];
  const unsafeProductIds = [];
  const unknownProductIds = [];
  const conflicts = {};

  for (const product of products) {
    const ingredients = (product.key_ingredients || []).map(i => i.toLowerCase());

    if (ingredients.length === 0) {
      unknownProductIds.push(product.id);
      continue;
    }

    let hasConflict = false;
    const productConflicts = [];

    for (const allergen of allergyProfile.allergies) {
      const allergenTerms = expandAllergenTerms(allergen);
      const matched = ingredients.filter(ing =>
        allergenTerms.some(term => ing.includes(term) || term.includes(ing))
      );

      if (matched.length > 0) {
        hasConflict = true;
        productConflicts.push({
          allergen,
          matchedIngredients: matched,
          severity: getSeverity(allergen),
        });
      }
    }

    if (hasConflict) {
      unsafeProductIds.push(product.id);
      conflicts[product.id] = {
        productName: product.name,
        brand: product.brand,
        conflicts: productConflicts,
      };
    } else {
      safeProductIds.push(product.id);
    }
  }

  return {
    allSafe: unsafeProductIds.length === 0 && unknownProductIds.length === 0,
    safeProductIds,
    unsafeProductIds,
    unknownProductIds,
    conflicts,
    allergyProfile,
    summary: buildBatchSummary(safeProductIds.length, unsafeProductIds.length, unknownProductIds.length),
  };
}

// ─────────────────────────────────────────────
// CHECK INGREDIENT LIST DIRECTLY
// For when Claude Vision identifies a product
// and needs to check a raw ingredient list
// ─────────────────────────────────────────────
async function checkIngredientListSafety(ingredients, userId) {
  const allergyProfile = await getClientAllergyProfile(userId);

  if (!allergyProfile.hasAllergies) {
    return {
      safe: true,
      conflicts: [],
      message: 'No known allergies — ingredient list is clear.',
    };
  }

  const ingredientsLower = ingredients.map(i => i.toLowerCase().trim());
  const conflicts = [];

  for (const allergen of allergyProfile.allergies) {
    const allergenTerms = expandAllergenTerms(allergen);

    const matched = ingredientsLower.filter(ing =>
      allergenTerms.some(term => ing.includes(term) || term.includes(ing))
    );

    if (matched.length > 0) {
      conflicts.push({
        allergen,
        matchedIngredients: matched,
        severity: getSeverity(allergen),
      });
    }
  }

  return {
    safe: conflicts.length === 0,
    conflicts,
    message: conflicts.length > 0
      ? `This product contains ingredients that conflict with known allergies: ${conflicts.map(c => c.allergen).join(', ')}.`
      : 'Ingredient list checked — no known allergens detected.',
    allergyProfile,
  };
}

// ─────────────────────────────────────────────
// ADD ALLERGY TO CLIENT PROFILE
// Called when Grace or any agent learns of a new allergy
// during conversation
// ─────────────────────────────────────────────
async function addAllergyToProfile(userId, newAllergen) {
  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from('beauty_profiles')
    .select('allergies')
    .eq('user_id', userId)
    .single();

  const currentAllergies = profile?.allergies || [];

  // Check if already recorded
  const allergenLower = newAllergen.toLowerCase().trim();
  const alreadyExists = currentAllergies.some(
    a => a.toLowerCase() === allergenLower
  );

  if (alreadyExists) {
    return { added: false, message: 'Allergy already on file', allergies: currentAllergies };
  }

  const updatedAllergies = [...currentAllergies, newAllergen.trim()];

  const { error } = await supabase
    .from('beauty_profiles')
    .upsert(
      {
        user_id: userId,
        allergies: updatedAllergies,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    logger.error('AllergyChecker: Failed to add allergy', {
      userId,
      error: error.message,
    });
    return { added: false, error: error.message };
  }

  logger.info('AllergyChecker: New allergy added to profile', {
    userId,
    allergen: newAllergen,
  });

  return {
    added: true,
    allergen: newAllergen,
    allergies: updatedAllergies,
    message: `${newAllergen} has been added to this client's allergy profile. All future product recommendations will be checked against this.`,
  };
}

// ─────────────────────────────────────────────
// REMOVE ALLERGY FROM PROFILE
// Called when client clarifies they no longer have
// or never had a particular allergy
// ─────────────────────────────────────────────
async function removeAllergyFromProfile(userId, allergen) {
  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from('beauty_profiles')
    .select('allergies')
    .eq('user_id', userId)
    .single();

  const currentAllergies = profile?.allergies || [];
  const allergenLower = allergen.toLowerCase().trim();

  const updatedAllergies = currentAllergies.filter(
    a => a.toLowerCase() !== allergenLower
  );

  await supabase
    .from('beauty_profiles')
    .update({
      allergies: updatedAllergies,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return {
    removed: true,
    allergen,
    allergies: updatedAllergies,
    message: `${allergen} has been removed from this client's allergy profile.`,
  };
}

// ─────────────────────────────────────────────
// BUILD ALLERGY CONTEXT FOR AGENTS
// Returns a natural language summary agents inject
// into their reasoning context before recommending
// ─────────────────────────────────────────────
async function buildAllergyContextForAgent(userId) {
  const allergyProfile = await getClientAllergyProfile(userId);

  if (!allergyProfile.hasAllergies) {
    return {
      hasAllergies: false,
      contextForAgent: 'No known allergies on file for this client. Standard recommendations apply.',
      allergyProfile,
    };
  }

  const contextForAgent = [
    `ALLERGY ALERT: This client has ${allergyProfile.allergies.length} known allerg${allergyProfile.allergies.length === 1 ? 'y' : 'ies'}: ${allergyProfile.allergies.join(', ')}.`,
    `Before recommending ANY product, you must verify it does not contain these allergens or any of their chemical aliases.`,
    `Common aliases to watch for: ${allergyProfile.expandedTerms.slice(0, 10).join(', ')}${allergyProfile.expandedTerms.length > 10 ? '...' : ''}.`,
    `Use the check_allergies tool before speaking any product recommendation.`,
    `If a product conflicts with their allergies, do NOT recommend it. Find an alternative.`,
    `If the client mentions a new allergy during conversation, add it to their profile immediately using add_allergy.`,
  ].join(' ');

  return {
    hasAllergies: true,
    contextForAgent,
    allergyProfile,
  };
}

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────
function getSeverity(allergen) {
  const high = ['nut', 'peanut', 'latex', 'bee', 'lanolin', 'formaldehyde'];
  const allergenLower = allergen.toLowerCase();
  return high.some(h => allergenLower.includes(h)) ? 'high' : 'moderate';
}

function buildConflictExplanation(allergen, matchedIngredients, productName) {
  return `${productName} contains ${matchedIngredients.join(', ')} — which ${matchedIngredients.length === 1 ? 'is' : 'are'} a form of ${allergen} that this client is allergic to.`;
}

function buildUnsafeMessage(product, conflicts) {
  const allergenNames = conflicts.map(c => c.allergen).join(', ');
  const ingredients = conflicts.flatMap(c => c.matchedIngredients).join(', ');
  const hasHigh = conflicts.some(c => c.severity === 'high');

  return [
    `${product.name} by ${product.brand} is NOT safe for this client.`,
    `It contains ${ingredients} — which ${conflicts.length === 1 ? 'conflicts' : 'conflict'} with their known ${allergenNames} allerg${conflicts.length === 1 ? 'y' : 'ies'}.`,
    hasHigh
      ? 'This is a high-severity conflict. Do not recommend this product under any circumstances.'
      : 'Find an alternative product without these ingredients.',
  ].join(' ');
}

function buildBatchSummary(safeCount, unsafeCount, unknownCount) {
  const parts = [];
  if (safeCount > 0) parts.push(`${safeCount} product${safeCount === 1 ? '' : 's'} safe to recommend`);
  if (unsafeCount > 0) parts.push(`${unsafeCount} product${unsafeCount === 1 ? '' : 's'} contain known allergens — excluded`);
  if (unknownCount > 0) parts.push(`${unknownCount} product${unknownCount === 1 ? '' : 's'} have no ingredient list — safety unverifiable`);
  return parts.join(', ') + '.';
}

module.exports = {
  getClientAllergyProfile,
  checkProductSafety,
  checkProductListSafety,
  checkIngredientListSafety,
  addAllergyToProfile,
  removeAllergyFromProfile,
  buildAllergyContextForAgent,
  expandAllergenTerms,
};