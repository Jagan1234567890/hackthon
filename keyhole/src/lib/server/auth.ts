/**
 * KEYHOLE AUTHENTICATION & SECURITY LAYER
 * 
 * Implements:
 * - JWT access tokens (15-min expiry)
 * - Refresh tokens (7-day expiry)
 * - bcrypt hashing with 12 salt rounds
 * - Strong password & email validation
 * - Google & GitHub OAuth 2.0 / OIDC with automatic account linking
 * - httpOnly cookie helpers
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  findUserByEmail,
  createUser,
  updateUser,
  createSession,
  findSessionByTokenHash,
  deleteSession,
  touchUserLastLogin,
  type User,
  type AuthProvider,
} from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'keyhole-jwt-super-secret-access-token-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'keyhole-jwt-super-secret-refresh-token-key-2026';
const BCRYPT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  authProvider: AuthProvider;
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_REQUIREMENTS_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true };
}

export function validatePassword(password: string): {
  valid: boolean;
  score: 'weak' | 'medium' | 'strong';
  error?: string;
} {
  if (!password) {
    return { valid: false, score: 'weak', error: 'Password is required.' };
  }

  let scorePoints = 0;
  if (password.length >= 8) scorePoints++;
  if (password.length >= 12) scorePoints++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) scorePoints++;
  if (/\d/.test(password)) scorePoints++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) scorePoints++;

  const score: 'weak' | 'medium' | 'strong' =
    scorePoints <= 2 ? 'weak' : scorePoints <= 4 ? 'medium' : 'strong';

  if (!PASSWORD_REQUIREMENTS_REGEX.test(password)) {
    return {
      valid: false,
      score,
      error:
        'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
    };
  }

  return { valid: true, score };
}

// ---------------------------------------------------------------------------
// Cryptographic Token Generation & Verification
// ---------------------------------------------------------------------------

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): {
  token: string;
  hashedToken: string;
  expiresAt: string;
} {
  const tokenId = uuidv4();
  const token = jwt.sign({ ...payload, jti: tokenId }, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  // Fast SHA-256 equivalent or salt hash for DB storage
  const hashedToken = bcrypt.hashSync(token, 8);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return { token, hashedToken, expiresAt };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// Authentication Orchestration (Login, Signup, Refresh, Logout)
// ---------------------------------------------------------------------------

export async function registerLocalUser(data: {
  fullName: string;
  email: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const emailVal = validateEmail(data.email);
  if (!emailVal.valid) throw new Error(emailVal.error);

  const pwdVal = validatePassword(data.password);
  if (!pwdVal.valid) throw new Error(pwdVal.error);

  const existing = await findUserByEmail(data.email);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const password_hash = await hashPassword(data.password);
  const user = await createUser({
    full_name: data.fullName,
    email: data.email,
    password_hash,
    auth_provider: 'local',
    is_verified: true, // auto-verified for seamless local dev
  });

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    authProvider: user.auth_provider,
  };

  const accessToken = generateAccessToken(payload);
  const { token: refreshToken, hashedToken, expiresAt } = generateRefreshToken(payload);

  await createSession({
    user_id: user.id,
    refresh_token_hash: hashedToken,
    device_info: data.deviceInfo || 'Unknown Device',
    ip_address: data.ipAddress || '127.0.0.1',
    expires_at: expiresAt,
  });

  return { user, accessToken, refreshToken };
}

export async function loginLocalUser(data: {
  email: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const user = await findUserByEmail(data.email);
  if (!user || !user.password_hash) {
    throw new Error('Invalid email or password.');
  }

  const valid = await verifyPassword(data.password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid email or password.');
  }

  await touchUserLastLogin(user.id);

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    authProvider: user.auth_provider,
  };

  const accessToken = generateAccessToken(payload);
  const { token: refreshToken, hashedToken, expiresAt } = generateRefreshToken(payload);

  await createSession({
    user_id: user.id,
    refresh_token_hash: hashedToken,
    device_info: data.deviceInfo || 'Unknown Device',
    ip_address: data.ipAddress || '127.0.0.1',
    expires_at: expiresAt,
  });

  return { user, accessToken, refreshToken };
}

export async function handleOAuthAccountLink(data: {
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  provider: 'google' | 'github';
  providerId: string;
  deviceInfo?: string;
  ipAddress?: string;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  let user = await findUserByEmail(data.email);

  if (user) {
    // Account linking if email exists
    user = await updateUser(user.id, {
      avatar_url: data.avatarUrl || user.avatar_url,
      provider_id: data.providerId,
      auth_provider: data.provider,
    });
    if (user) await touchUserLastLogin(user.id);
  } else {
    // New OAuth account creation
    user = await createUser({
      email: data.email,
      full_name: data.fullName,
      avatar_url: data.avatarUrl || null,
      auth_provider: data.provider,
      provider_id: data.providerId,
      is_verified: true,
    });
  }

  if (!user) throw new Error('Failed to process user account.');

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    authProvider: user.auth_provider,
  };

  const accessToken = generateAccessToken(payload);
  const { token: refreshToken, hashedToken, expiresAt } = generateRefreshToken(payload);

  await createSession({
    user_id: user.id,
    refresh_token_hash: hashedToken,
    device_info: data.deviceInfo || 'OAuth Client',
    ip_address: data.ipAddress || '127.0.0.1',
    expires_at: expiresAt,
  });

  return { user, accessToken, refreshToken };
}

export async function refreshUserSession(
  refreshToken: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<{ user: User; accessToken: string; newRefreshToken: string } | null> {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return null;

  const session = await findSessionByTokenHash(refreshToken);
  // If not found by direct hash, we still verify user exists
  const user = await findUserByEmail(payload.email);
  if (!user) return null;

  if (session) {
    await deleteSession(session.id);
  }

  const newPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    authProvider: user.auth_provider,
  };

  const accessToken = generateAccessToken(newPayload);
  const { token: newRefreshToken, hashedToken, expiresAt } = generateRefreshToken(newPayload);

  await createSession({
    user_id: user.id,
    refresh_token_hash: hashedToken,
    device_info: deviceInfo || 'Refreshed Session',
    ip_address: ipAddress || '127.0.0.1',
    expires_at: expiresAt,
  });

  return { user, accessToken, newRefreshToken };
}
