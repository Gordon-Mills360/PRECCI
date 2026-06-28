// FILE: precci/backend/src/services/belleCleanup.service.js
// Belle simulation cleanup service.
// Runs hourly via node-cron to remove expired simulations
// from Supabase Storage and clear expired URLs from database.
// Saved simulations are never deleted.
// Logs all cleanup activity for Marcus's monitoring.

'use strict';

const cron = require('node-cron');
const { getServiceClient } = require('../config/supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// EXTRACT STORAGE PATH FROM SIGNED URL
// Signed URLs contain the storage path we need
// to delete the file from the bucket
// ─────────────────────────────────────────────
function extractStoragePathFromUrl(signedUrl) {
  if (!signedUrl) return null;

  try {
    const url = new URL(signedUrl);
    // Supabase signed URL path format:
    // /storage/v1/object/sign/precci-simulations/simulations/{userId}/{file}
    const pathParts = url.pathname.split('/precci-simulations/');
    if (pathParts.length < 2) return null;
    return pathParts[1].split('?')[0]; // Remove query params
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// DELETE EXPIRED SIMULATION FILES FROM STORAGE
// Fetches all expired unsaved records,
// deletes their files from Supabase Storage,
// then clears the URLs from the database
// ─────────────────────────────────────────────
async function deleteExpiredSimulations() {
  const supabase = getServiceClient();
  const startTime = Date.now();

  logger.info('Belle cleanup: Starting expired simulation cleanup');

  try {
    // Get all expired unsaved simulations that still have URLs
    const { data: expired, error: fetchError } = await supabase
      .from('try_on_history')
      .select('id, proxied_url, simulation_url, user_id, look_type, created_at')
      .lt('expires_at', new Date().toISOString())
      .eq('saved', false)
      .or('proxied_url.not.is.null,simulation_url.not.is.null')
      .limit(100); // Process in batches of 100

    if (fetchError) {
      logger.error('Belle cleanup: Failed to fetch expired records', {
        error: fetchError.message,
      });
      return { cleaned: 0, errors: 1 };
    }

    if (!expired || expired.length === 0) {
      logger.info('Belle cleanup: No expired simulations to clean');
      return { cleaned: 0, errors: 0 };
    }

    logger.info('Belle cleanup: Found expired simulations', {
      count: expired.length,
    });

    // Extract storage file paths
    const storagePathsToDelete = expired
      .map(record => extractStoragePathFromUrl(record.proxied_url))
      .filter(Boolean);

    let storageDeleteErrors = 0;

    // Delete from Supabase Storage in batches
    if (storagePathsToDelete.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from('precci-simulations')
        .remove(storagePathsToDelete);

      if (storageError) {
        logger.error('Belle cleanup: Storage deletion error', {
          error: storageError.message,
          paths: storagePathsToDelete.length,
        });
        storageDeleteErrors++;
      }
    }

    // Clear URLs from database records
    const expiredIds = expired.map(r => r.id);

    const { error: updateError } = await supabase
      .from('try_on_history')
      .update({
        proxied_url: null,
        simulation_url: null,
      })
      .in('id', expiredIds);

    if (updateError) {
      logger.error('Belle cleanup: Failed to clear expired URLs', {
        error: updateError.message,
      });
    }

    const duration = Date.now() - startTime;

    logger.info('Belle cleanup: Cleanup complete', {
      cleaned: expired.length,
      storageFilesDeleted: storagePathsToDelete.length,
      errors: storageDeleteErrors,
      durationMs: duration,
    });

    // Log to alerts for Marcus monitoring
    if (expired.length > 50) {
      await supabase.from('alerts').insert({
        type: 'belle_cleanup',
        message: `Belle cleaned ${expired.length} expired simulations`,
        severity: 'info',
        agent_id: 'PC-016',
        metadata: {
          cleaned: expired.length,
          storage_files_deleted: storagePathsToDelete.length,
          duration_ms: duration,
        },
      });
    }

    return {
      cleaned: expired.length,
      storageFilesDeleted: storagePathsToDelete.length,
      errors: storageDeleteErrors,
      durationMs: duration,
    };
  } catch (error) {
    logger.error('Belle cleanup: Unexpected error', { error: error.message });
    return { cleaned: 0, errors: 1, error: error.message };
  }
}

// ─────────────────────────────────────────────
// DELETE SIMULATIONS FOR SPECIFIC USER
// Called when a user deletes their account
// or explicitly requests data deletion
// ─────────────────────────────────────────────
async function deleteAllSimulationsForUser(userId) {
  const supabase = getServiceClient();

  try {
    // Get all user simulations
    const { data: userSimulations } = await supabase
      .from('try_on_history')
      .select('id, proxied_url')
      .eq('user_id', userId)
      .or('proxied_url.not.is.null,simulation_url.not.is.null');

    if (!userSimulations || userSimulations.length === 0) {
      return { deleted: 0 };
    }

    // Delete files from storage
    const paths = userSimulations
      .map(s => extractStoragePathFromUrl(s.proxied_url))
      .filter(Boolean);

    if (paths.length > 0) {
      await supabase.storage.from('precci-simulations').remove(paths);
    }

    // Delete all records
    await supabase
      .from('try_on_history')
      .delete()
      .eq('user_id', userId);

    logger.info('Belle cleanup: Deleted all simulations for user', {
      userId,
      count: userSimulations.length,
    });

    return { deleted: userSimulations.length };
  } catch (error) {
    logger.error('Belle cleanup: Failed to delete user simulations', {
      userId,
      error: error.message,
    });
    return { deleted: 0, error: error.message };
  }
}

// ─────────────────────────────────────────────
// GET STORAGE STATS
// For Marcus's infrastructure monitoring
// ─────────────────────────────────────────────
async function getStorageStats() {
  const supabase = getServiceClient();

  try {
    const { data: stats } = await supabase
      .from('try_on_history')
      .select('id, saved, expires_at, look_type, created_at');

    if (!stats) return null;

    const now = new Date();

    return {
      total: stats.length,
      saved: stats.filter(s => s.saved).length,
      active: stats.filter(s => new Date(s.expires_at) > now && !s.saved).length,
      expired: stats.filter(s => new Date(s.expires_at) <= now && !s.saved).length,
      byLookType: stats.reduce((acc, s) => {
        acc[s.look_type] = (acc[s.look_type] || 0) + 1;
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Belle cleanup: Failed to get storage stats', {
      error: error.message,
    });
    return null;
  }
}

// ─────────────────────────────────────────────
// SCHEDULE CLEANUP CRON JOB
// Runs every hour at minute 0
// Called once from index.js on server startup
// ─────────────────────────────────────────────
function scheduleBelleCleanup() {
  // Every hour at minute 0: 0 * * * *
  cron.schedule('0 * * * *', async () => {
    logger.info('Belle cleanup: Hourly cron triggered');
    await deleteExpiredSimulations();
  });

  // Also run daily at 3 AM for deeper cleanup
  // of any storage orphans that hourly missed
  cron.schedule('0 3 * * *', async () => {
    logger.info('Belle cleanup: Daily deep cleanup triggered');
    await deepStorageCleanup();
  });

  logger.info('Belle cleanup: Cron jobs scheduled — hourly + daily 3AM');
}

// ─────────────────────────────────────────────
// DEEP STORAGE CLEANUP
// Runs daily at 3 AM
// Removes any orphaned files in storage that
// have no matching database record
// ─────────────────────────────────────────────
async function deepStorageCleanup() {
  const supabase = getServiceClient();

  try {
    // List all files in storage
    const { data: storageFiles, error: listError } = await supabase
      .storage
      .from('precci-simulations')
      .list('simulations', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' },
      });

    if (listError || !storageFiles) {
      logger.error('Belle deep cleanup: Failed to list storage files', {
        error: listError?.message,
      });
      return;
    }

    if (storageFiles.length === 0) {
      logger.info('Belle deep cleanup: No files in storage');
      return;
    }

    // Get all valid proxied URLs from database
    const { data: validRecords } = await supabase
      .from('try_on_history')
      .select('proxied_url')
      .not('proxied_url', 'is', null);

    const validPaths = new Set(
      (validRecords || [])
        .map(r => extractStoragePathFromUrl(r.proxied_url))
        .filter(Boolean)
    );

    // Find storage files with no database record
    const orphanedFiles = storageFiles
      .filter(file => {
        const filePath = `simulations/${file.name}`;
        return !validPaths.has(filePath);
      })
      .map(file => `simulations/${file.name}`);

    if (orphanedFiles.length > 0) {
      await supabase.storage
        .from('precci-simulations')
        .remove(orphanedFiles);

      logger.info('Belle deep cleanup: Removed orphaned storage files', {
        count: orphanedFiles.length,
      });
    } else {
      logger.info('Belle deep cleanup: No orphaned files found');
    }
  } catch (error) {
    logger.error('Belle deep cleanup: Unexpected error', {
      error: error.message,
    });
  }
}

module.exports = {
  deleteExpiredSimulations,
  deleteAllSimulationsForUser,
  getStorageStats,
  scheduleBelleCleanup,
  deepStorageCleanup,
};