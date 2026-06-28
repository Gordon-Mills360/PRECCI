// FILE: precci/backend/src/middleware/auth.js
// SECURITY: JWT verification, role-based access control, token refresh.
// Tokens are never logged. Role checks are strict.
// Access: 15 minutes. Refresh: 7 days.

'use strict';

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { PrecciError } = require('./errorHandler');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// VALID ROLES IN THE PRECCI SYSTEM
// ─────────────────────────────────────────────
const VALID_ROLES = ['precious_owner', 'client', 'provider', 'agent_service'];

const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
};

// ─────────────────────────────────────────────
// SUPABASE SERVICE CLIENT
// Used only to check token blacklist
// ─────────────────────────────────────────────
function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: { persistSession: false },
    }
  );
}

// ─────────────────────────────────────────────
// GENERATE ACCESS TOKEN
// ─────────────────────────────────────────────
function generateAccessToken(payload) {
  if (!VALID_ROLES.includes(payload.role)) {
    throw new PrecciError('AUTHORISATION_ERROR', 'Invalid role assignment', 403);
  }

  return jwt.sign(
    {
      sub: payload.userId,
      role: payload.role,
      email: payload.email,
      type: 'access',
    },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY.ACCESS }
  );
}

// ─────────────────────────────────────────────
// GENERATE REFRESH TOKEN
// ─────────────────────────────────────────────
function generateRefreshToken(payload) {
  return jwt.sign(
    {
      sub: payload.userId,
      role: payload.role,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: TOKEN_EXPIRY.REFRESH }
  );
}

// ─────────────────────────────────────────────
// VERIFY TOKEN MIDDLEWARE
// Validates JWT on every protected route
// Checks blacklist to prevent use of invalidated tokens
// ─────────────────────────────────────────────
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Malformed authorisation header', 401);
    }

    // Verify signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new PrecciError('AUTHENTICATION_ERROR', 'Token has expired', 401);
      }
      if (jwtError.name === 'JsonWebTokenError') {
        throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid token', 401);
      }
      throw new PrecciError('AUTHENTICATION_ERROR', 'Token verification failed', 401);
    }

    // Ensure it is an access token, not a refresh token
    if (decoded.type !== 'access') {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid token type', 401);
    }

    // Check token blacklist (for logged-out tokens)
    const supabase = getServiceClient();
    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const { data: blacklisted } = await supabase
      .from('token_blacklist')
      .select('id')
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (blacklisted) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Token has been invalidated', 401);
    }

    // Validate role
    if (!VALID_ROLES.includes(decoded.role)) {
      throw new PrecciError('AUTHORISATION_ERROR', 'Invalid role in token', 403);
    }

    // Attach user context to request — never the full token
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof PrecciError) {
      return next(error);
    }
    next(new PrecciError('AUTHENTICATION_ERROR', 'Authentication failed', 401));
  }
}

// ─────────────────────────────────────────────
// REQUIRE ROLE MIDDLEWARE
// Checks that the authenticated user has the required role(s)
// Usage: router.get('/path', verifyToken, requireRole(['precious_owner']), handler)
// ─────────────────────────────────────────────
function requireRole(allowedRoles) {
  return function roleCheckMiddleware(req, res, next) {
    if (!req.user) {
      return next(
        new PrecciError('AUTHENTICATION_ERROR', 'Authentication required', 401)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorised role access attempt', {
        requiredRoles: allowedRoles,
        userRole: req.user.role,
        path: req.originalUrl,
      });
      return next(
        new PrecciError('AUTHORISATION_ERROR', 'You do not have permission to access this resource', 403)
      );
    }

    next();
  };
}

// ─────────────────────────────────────────────
// REFRESH TOKEN HANDLER
// Issues a new access token from a valid refresh token
// Refresh token itself is verified separately
// ─────────────────────────────────────────────
async function refreshAccessToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'No refresh token provided', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid or expired refresh token', 401);
    }

    if (decoded.type !== 'refresh') {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid token type for refresh', 401);
    }

    // Issue new access token
    const newAccessToken = generateAccessToken({
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email || '',
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error instanceof PrecciError) {
      return next(error);
    }
    next(new PrecciError('AUTHENTICATION_ERROR', 'Token refresh failed', 401));
  }
}

// ─────────────────────────────────────────────
// INVALIDATE TOKEN (LOGOUT)
// Adds current token to blacklist until its natural expiry
// ─────────────────────────────────────────────
async function invalidateToken(token) {
  try {
    const supabase = getServiceClient();
    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Decode to get expiry (don't re-verify — caller already verified)
    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000).toISOString()
      : new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase.from('token_blacklist').insert({
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  } catch (error) {
    logger.error('Failed to blacklist token', { error: error.message });
    // Non-fatal — log and continue
  }
}

module.exports = {
  verifyToken,
  requireRole,
  refreshAccessToken,
  invalidateToken,
  generateAccessToken,
  generateRefreshToken,
};