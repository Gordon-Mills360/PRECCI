// FILE: precci/backend/src/services/belle.service.js
// Belle's virtual try-on service.
// SECURITY: All Replicate calls server-side only.
// Simulation URLs proxied through PRECCI backend.
// Raw Replicate URLs never exposed to any client.
// Camera frames never stored permanently without consent.

'use strict';

const { runPrediction, proxySimulationUrl } = require('../config/replicate');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// REPLICATE MODEL VERSION
// SDXL with ControlNet for face-preserving generation
// ─────────────────────────────────────────────
const SDXL_CONTROLNET_VERSION =
  'diffusers/controlnet-canny-sdxl-1.0';

// ─────────────────────────────────────────────
// BUILD LOOK PROMPT
// Constructs precise prompts for different look types
// Negative prompts always preserve client identity
// ─────────────────────────────────────────────
function buildLookPrompt(lookData) {
  const { lookType, description, skinTone, hairType } = lookData;

  const baseNegativePrompt = [
    'distort face',
    'change facial features',
    'change ethnicity',
    'change skin tone',
    'change identity',
    'ugly',
    'blurry',
    'low quality',
    'deformed',
    'mutation',
    'watermark',
  ].join(', ');

  const prompts = {
    hairstyle: {
      positive: `Professional beauty photo, ${description}, ${hairType || ''} hair texture preserved, photorealistic, high quality salon photography, natural lighting`,
      negative: baseNegativePrompt + ', change hair texture type',
      strength: 0.65,
    },
    makeup: {
      positive: `Professional beauty photo, ${description}, ${skinTone || ''} skin tone preserved, flawless makeup application, photorealistic, beauty editorial lighting`,
      negative: baseNegativePrompt,
      strength: 0.70,
    },
    outfit: {
      positive: `Professional fashion photo, ${description}, photorealistic, studio lighting, full body shot, fashion editorial quality`,
      negative: baseNegativePrompt + ', change body proportions',
      strength: 0.72,
    },
    beard: {
      positive: `Professional portrait, ${description}, ${skinTone || ''} skin tone preserved, realistic beard texture, photorealistic, natural lighting`,
      negative: baseNegativePrompt + ', feminine features',
      strength: 0.65,
    },
    haircolour: {
      positive: `Professional beauty photo, ${description}, same hairstyle preserved, photorealistic colour change, salon quality`,
      negative: baseNegativePrompt + ', change hairstyle, change texture',
      strength: 0.60,
    },
  };

  return prompts[lookType] || {
    positive: `Professional beauty photo, ${description}, photorealistic, high quality`,
    negative: baseNegativePrompt,
    strength: 0.68,
  };
}

// ─────────────────────────────────────────────
// GENERATE SIMULATION
// Full pipeline: validate → Replicate → proxy → store → return
// ─────────────────────────────────────────────
async function generateSimulation({ frameBase64, lookData, userId, sessionId }) {
  const supabase = getServiceClient();

  // Verify camera consent
  const { data: user } = await supabase
    .from('users')
    .select('camera_consent, plan')
    .eq('id', userId)
    .single();

  if (!user?.camera_consent) {
    throw new Error('Camera consent required for virtual try-on');
  }

  const lookPrompt = buildLookPrompt(lookData);

  logger.info('Belle: Generating simulation', {
    lookType: lookData.lookType,
    userId,
  });

  // Call Replicate API
  const prediction = await runPrediction(SDXL_CONTROLNET_VERSION, {
    image: `data:image/jpeg;base64,${frameBase64}`,
    prompt: lookPrompt.positive,
    negative_prompt: lookPrompt.negative,
    controlnet_conditioning_scale: 0.8,
    strength: lookPrompt.strength,
    num_inference_steps: 30,
    guidance_scale: 7.5,
  });

  if (!prediction.output || !prediction.output[0]) {
    throw new Error('Belle: Replicate returned no simulation output');
  }

  const replicateUrl = Array.isArray(prediction.output)
    ? prediction.output[prediction.output.length - 1]
    : prediction.output;

  // Proxy the URL through PRECCI backend
  const { data: imageData, contentType } = await proxySimulationUrl(replicateUrl);

  // Store in Supabase Storage temporarily
  const fileName = `simulations/${userId}/${Date.now()}.jpg`;

  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('precci-simulations')
    .upload(fileName, imageData, {
      contentType,
      upsert: false,
    });

  if (storageError) {
    logger.error('Belle: Failed to store simulation', {
      error: storageError.message,
    });
    throw new Error('Failed to store simulation');
  }

  // Get proxied URL — expires in 1 hour
  const { data: signedUrl } = await supabase
    .storage
    .from('precci-simulations')
    .createSignedUrl(fileName, 3600);

  const proxiedUrl = signedUrl?.signedUrl;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // Log to try_on_history
  const { data: historyRecord } = await supabase
    .from('try_on_history')
    .insert({
      user_id: userId,
      session_id: sessionId || null,
      agent_id: lookData.agentId || 'PC-016',
      look_type: lookData.lookType,
      look_description: lookData.description,
      look_data: lookData,
      simulation_url: null, // Never store Replicate URL
      proxied_url: proxiedUrl,
      saved: false,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  logger.info('Belle: Simulation generated successfully', {
    userId,
    lookType: lookData.lookType,
    historyId: historyRecord?.id,
  });

  return {
    proxiedUrl,
    historyId: historyRecord?.id,
    expiresAt,
    lookType: lookData.lookType,
    description: lookData.description,
  };
}

// ─────────────────────────────────────────────
// SAVE SIMULATION
// Client saves a simulation they like
// ─────────────────────────────────────────────
async function saveSimulation(historyId, userId) {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('try_on_history')
    .update({ saved: true })
    .eq('id', historyId)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to save simulation');
  }

  return { saved: true };
}

// ─────────────────────────────────────────────
// DELETE EXPIRED SIMULATIONS
// Runs hourly via cron — cleans up storage
// ─────────────────────────────────────────────
async function deleteExpiredSimulations() {
  const supabase = getServiceClient();

  try {
    // Get expired simulations
    const { data: expired } = await supabase
      .from('try_on_history')
      .select('id, proxied_url')
      .lt('expires_at', new Date().toISOString())
      .eq('saved', false);

    if (!expired || expired.length === 0) return;

    // Delete from storage
    const fileNames = expired
      .map(r => {
        try {
          const url = new URL(r.proxied_url || '');
          return url.pathname.split('/precci-simulations/')[1];
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (fileNames.length > 0) {
      await supabase.storage
        .from('precci-simulations')
        .remove(fileNames);
    }

    // Update records
    await supabase
      .from('try_on_history')
      .update({ proxied_url: null })
      .in('id', expired.map(r => r.id));

    logger.info('Belle: Cleaned up expired simulations', {
      count: expired.length,
    });
  } catch (error) {
    logger.error('Belle: Cleanup failed', { error: error.message });
  }
}

module.exports = {
  generateSimulation,
  saveSimulation,
  deleteExpiredSimulations,
  buildLookPrompt,
};