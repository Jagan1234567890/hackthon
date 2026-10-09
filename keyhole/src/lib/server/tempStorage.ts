/**
 * KEYHOLE TEMPORARY STORAGE & REDIS LIFECYCLE LAYER
 * 
 * Manages all temporary session data strictly destroyed on site closure:
 * - Redis TTL of 2 hours for all temporary data
 * - Key patterns:
 *     temp:{userId}:{sessionId}:chat_history (list of messages)
 *     temp:{userId}:{sessionId}:uploads (list of file references)
 *     temp:{userId}:{sessionId}:analysis_results (hash of results)
 *     temp:{userId}:{sessionId}:bot_context (hash of bot state)
 * - Temporary file directory with session prefix and auto-deletion
 * - Cleanup API handler and 30-minute cron job for orphaned files
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  botType: 'siteAssistant' | 'imageAnalyzer' | 'videoAnalyzer' | 'audioAnalyzer';
  content: string;
  timestamp: string;
  messageType?: 'text' | 'code' | 'card' | 'links' | 'quickReplies';
  quickReplies?: string[];
  metadata?: Record<string, unknown>;
  confidence?: number;
}

export interface UploadedFileRef {
  fileId: string;
  originalName: string;
  savedPath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  modality: 'image' | 'video' | 'audio';
  thumbnailUrl?: string;
}

export interface BotState {
  messages: ChatMessage[];
  context: Record<string, unknown>;
  lastActive: string;
  uploadedFiles?: UploadedFileRef[];
  analysisResults?: Record<string, unknown>;
}

export interface MultiBotSessionState {
  sessionId: string;
  userId: string;
  activeBots: {
    siteAssistant: BotState;
    imageAnalyzer: BotState;
    videoAnalyzer: BotState;
    audioAnalyzer: BotState;
  };
  createdAt: string;
  expiresAt: string;
}

// Configurable Temp Directory with safe cross-platform fallback
export function getSafeTempUploadDir(): string {
  const envDir = process.env.TEMP_UPLOAD_DIR;
  if (envDir && process.platform !== 'win32') {
    return envDir;
  }
  return path.join(os.tmpdir(), 'chatbot-uploads');
}

export const TEMP_UPLOAD_DIR = getSafeTempUploadDir();

// Ensure temporary upload directory exists
export function ensureTempUploadDir(): string {
  const targetDir = getSafeTempUploadDir();
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create TEMP_UPLOAD_DIR:', err);
  }
  return targetDir;
}

// ---------------------------------------------------------------------------
// High-Performance In-Memory Redis Engine with 2-Hour TTL
// ---------------------------------------------------------------------------
interface RedisEntry {
  type: 'list' | 'hash' | 'string';
  value: unknown;
  expiresAt: number; // epoch ms
}

class MemoryRedisStore {
  private store = new Map<string, RedisEntry>();
  private defaultTTLMs = 2 * 60 * 60 * 1000; // 2 hours

  public getTTL(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return -2;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? Math.floor(remaining / 1000) : -2;
  }

  public set(key: string, value: unknown, ttlSeconds = 7200): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { type: 'string', value, expiresAt });
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  public rpush(key: string, item: unknown, ttlSeconds = 7200): number {
    const entry = this.store.get(key);
    const now = Date.now();
    let list: unknown[] = [];

    if (entry && entry.type === 'list' && now <= entry.expiresAt) {
      list = entry.value as unknown[];
    }
    list.push(item);
    this.store.set(key, {
      type: 'list',
      value: list,
      expiresAt: now + ttlSeconds * 1000,
    });
    return list.length;
  }

  public lrange<T>(key: string, start = 0, stop = -1): T[] {
    const entry = this.store.get(key);
    if (!entry || entry.type !== 'list') return [];
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return [];
    }
    const list = entry.value as T[];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  public hset(key: string, field: string, value: unknown, ttlSeconds = 7200): void {
    const entry = this.store.get(key);
    const now = Date.now();
    let hash: Record<string, unknown> = {};

    if (entry && entry.type === 'hash' && now <= entry.expiresAt) {
      hash = entry.value as Record<string, unknown>;
    }
    hash[field] = value;
    this.store.set(key, {
      type: 'hash',
      value: hash,
      expiresAt: now + ttlSeconds * 1000,
    });
  }

  public hget<T>(key: string, field: string): T | null {
    const entry = this.store.get(key);
    if (!entry || entry.type !== 'hash') return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    const hash = entry.value as Record<string, unknown>;
    return (hash[field] as T) ?? null;
  }

  public hgetall<T = Record<string, unknown>>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry || entry.type !== 'hash') return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  public delPattern(pattern: string): number {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  public cleanupExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  public size(): number {
    return this.store.size;
  }
}

export const redis = new MemoryRedisStore();

// ---------------------------------------------------------------------------
// Temporary Storage Key Helpers
// ---------------------------------------------------------------------------

export function getChatHistoryKey(userId: string, sessionId: string): string {
  return `temp:${userId}:${sessionId}:chat_history`;
}

export function getUploadsKey(userId: string, sessionId: string): string {
  return `temp:${userId}:${sessionId}:uploads`;
}

export function getAnalysisResultsKey(userId: string, sessionId: string): string {
  return `temp:${userId}:${sessionId}:analysis_results`;
}

export function getBotContextKey(userId: string, sessionId: string): string {
  return `temp:${userId}:${sessionId}:bot_context`;
}

// ---------------------------------------------------------------------------
// Temporary Data Lifecycle Operations
// ---------------------------------------------------------------------------

export async function initSessionTempStorage(
  userId: string,
  sessionId: string
): Promise<MultiBotSessionState> {
  const contextKey = getBotContextKey(userId, sessionId);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const initialState: MultiBotSessionState = {
    sessionId,
    userId,
    activeBots: {
      siteAssistant: { messages: [], context: {}, lastActive: now },
      imageAnalyzer: { messages: [], context: {}, uploadedFiles: [], analysisResults: {}, lastActive: now },
      videoAnalyzer: { messages: [], context: {}, uploadedFiles: [], analysisResults: {}, lastActive: now },
      audioAnalyzer: { messages: [], context: {}, uploadedFiles: [], analysisResults: {}, lastActive: now },
    },
    createdAt: now,
    expiresAt,
  };

  redis.set(contextKey, initialState, 7200);
  return initialState;
}

export async function appendChatMessage(
  userId: string,
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  const historyKey = getChatHistoryKey(userId, sessionId);
  redis.rpush(historyKey, message, 7200);

  // Update multi-bot session state
  const contextKey = getBotContextKey(userId, sessionId);
  const state = redis.get<MultiBotSessionState>(contextKey);
  if (state && state.activeBots[message.botType]) {
    state.activeBots[message.botType].messages.push(message);
    state.activeBots[message.botType].lastActive = new Date().toISOString();
    redis.set(contextKey, state, 7200);
  }
}

export async function getSessionChatHistory(
  userId: string,
  sessionId: string
): Promise<ChatMessage[]> {
  const historyKey = getChatHistoryKey(userId, sessionId);
  return redis.lrange<ChatMessage>(historyKey, 0, -1);
}

export async function clearSessionChatHistory(
  userId: string,
  sessionId: string
): Promise<void> {
  const historyKey = getChatHistoryKey(userId, sessionId);
  redis.delPattern(historyKey);
}

export async function recordTempUpload(
  userId: string,
  sessionId: string,
  fileRef: UploadedFileRef
): Promise<void> {
  const uploadsKey = getUploadsKey(userId, sessionId);
  redis.rpush(uploadsKey, fileRef, 7200);

  const contextKey = getBotContextKey(userId, sessionId);
  const state = redis.get<MultiBotSessionState>(contextKey);
  if (state) {
    const botMap = {
      image: state.activeBots.imageAnalyzer,
      video: state.activeBots.videoAnalyzer,
      audio: state.activeBots.audioAnalyzer,
    };
    const targetBot = botMap[fileRef.modality];
    if (targetBot) {
      targetBot.uploadedFiles = targetBot.uploadedFiles || [];
      targetBot.uploadedFiles.push(fileRef);
      targetBot.lastActive = new Date().toISOString();
      redis.set(contextKey, state, 7200);
    }
  }
}

export async function storeAnalysisResult(
  userId: string,
  sessionId: string,
  analysisId: string,
  result: Record<string, unknown>
): Promise<void> {
  const resultsKey = getAnalysisResultsKey(userId, sessionId);
  redis.hset(resultsKey, analysisId, result, 7200);
}

export async function getAnalysisResult<T = Record<string, unknown>>(
  userId: string,
  sessionId: string,
  analysisId: string
): Promise<T | null> {
  const resultsKey = getAnalysisResultsKey(userId, sessionId);
  return redis.hget<T>(resultsKey, analysisId);
}

// ---------------------------------------------------------------------------
// Session Cleanup Endpoint Logic (Destroys temp data, retains persistent)
// ---------------------------------------------------------------------------

export async function cleanupSessionData(
  userId: string,
  sessionId: string
): Promise<{ deletedKeys: number; deletedFiles: number }> {
  // 1. Delete all Redis keys matching temp:{userId}:{sessionId}:*
  const pattern = `temp:${userId}:${sessionId}:*`;
  const deletedKeys = redis.delPattern(pattern);

  // 2. Delete all uploaded files associated with this session
  let deletedFiles = 0;
  try {
    if (fs.existsSync(TEMP_UPLOAD_DIR)) {
      const files = fs.readdirSync(TEMP_UPLOAD_DIR);
      const prefix = `${sessionId}_`;
      for (const f of files) {
        if (f.startsWith(prefix)) {
          const filePath = path.join(TEMP_UPLOAD_DIR, f);
          try {
            fs.unlinkSync(filePath);
            deletedFiles++;
          } catch (e) {
            console.error(`Error deleting temp file ${filePath}:`, e);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error scanning TEMP_UPLOAD_DIR during cleanup:', err);
  }

  return { deletedKeys, deletedFiles };
}

// ---------------------------------------------------------------------------
// 30-Minute Orphan Cleanup Cron Job
// ---------------------------------------------------------------------------

export function cleanOrphanedTempData(): {
  expiredKeys: number;
  orphanedFiles: number;
} {
  const expiredKeys = redis.cleanupExpired();
  let orphanedFiles = 0;
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

  try {
    if (fs.existsSync(TEMP_UPLOAD_DIR)) {
      const files = fs.readdirSync(TEMP_UPLOAD_DIR);
      for (const f of files) {
        const filePath = path.join(TEMP_UPLOAD_DIR, f);
        try {
          const stats = fs.statSync(filePath);
          if (stats.mtimeMs < twoHoursAgo) {
            fs.unlinkSync(filePath);
            orphanedFiles++;
          }
        } catch {
          // ignore stat errors
        }
      }
    }
  } catch (err) {
    console.error('Error during orphaned temp data cleanup:', err);
  }

  return { expiredKeys, orphanedFiles };
}

// Automatically schedule the 30-minute cron interval
if (typeof setInterval !== 'undefined') {
  const cronTimer = setInterval(() => {
    cleanOrphanedTempData();
  }, 30 * 60 * 1000);
  if (cronTimer && typeof cronTimer.unref === 'function') {
    cronTimer.unref();
  }
}
