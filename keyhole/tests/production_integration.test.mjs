import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateEmail,
  validatePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  registerLocalUser,
  loginLocalUser,
  handleOAuthAccountLink,
} from '../src/lib/server/auth.ts';

import {
  findUserByEmail,
  findUserById,
} from '../src/lib/server/db.ts';

import {
  initSessionTempStorage,
  appendChatMessage,
  getSessionChatHistory,
  recordTempUpload,
  storeAnalysisResult,
  getAnalysisResult,
  cleanupSessionData,
  redis,
} from '../src/lib/server/tempStorage.ts';

import {
  classifyIntentAndRoute,
  processSiteAssistantMessage,
  getAccuracyMetrics,
} from '../src/lib/server/aiRouter.ts';

import {
  validateImageMagicBytes,
  validateVideoMagicBytes,
  validateAudioMagicBytes,
} from '../src/lib/server/magicBytes.ts';

test('1. Authentication: Password validation rules & scoring', () => {
  // Too short
  const short = validatePassword('Pass1!');
  assert.equal(short.valid, false);

  // Missing number
  const noNum = validatePassword('Password!Special');
  assert.equal(noNum.valid, false);

  // Missing special char
  const noSpecial = validatePassword('Password123');
  assert.equal(noSpecial.valid, false);

  // Valid strong password
  const strong = validatePassword('Crypto@Secure2026');
  assert.equal(strong.valid, true);
  assert.equal(strong.score, 'strong');
});

test('2. Authentication: Local user registration & JWT session creation', async () => {
  const testEmail = `analyst_${Date.now()}@keyhole.local`;
  const regResult = await registerLocalUser({
    fullName: 'Jane Doe',
    email: testEmail,
    password: 'SecurePassword123!',
  });

  assert.ok(regResult.user.id);
  assert.equal(regResult.user.email, testEmail);
  assert.equal(regResult.user.auth_provider, 'local');
  assert.ok(regResult.accessToken);
  assert.ok(regResult.refreshToken);

  // Verify access token (15-min expiry)
  const accessPayload = verifyAccessToken(regResult.accessToken);
  assert.ok(accessPayload);
  assert.equal(accessPayload.email, testEmail);

  // Verify refresh token (7-day expiry)
  const refreshPayload = verifyRefreshToken(regResult.refreshToken);
  assert.ok(refreshPayload);
  assert.equal(refreshPayload.email, testEmail);

  // Authenticate login with same credentials
  const loginResult = await loginLocalUser({
    email: testEmail,
    password: 'SecurePassword123!',
  });
  assert.equal(loginResult.user.id, regResult.user.id);
});

test('3. OAuth: Google & GitHub Account Linking', async () => {
  const oauthEmail = `oauth_user_${Date.now()}@google.com`;

  // First sign-in via Google
  const googleAuth = await handleOAuthAccountLink({
    email: oauthEmail,
    fullName: 'Google User',
    avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
    provider: 'google',
    providerId: 'google_sub_12345',
  });

  assert.ok(googleAuth.user.id);
  assert.equal(googleAuth.user.auth_provider, 'google');

  // Account linking with same email via GitHub
  const githubLink = await handleOAuthAccountLink({
    email: oauthEmail,
    fullName: 'Google User Updated',
    provider: 'github',
    providerId: 'github_id_67890',
  });

  // User ID must remain the same (account linked)
  assert.equal(githubLink.user.id, googleAuth.user.id);
  assert.equal(githubLink.user.auth_provider, 'github');
});

test('4. Dual-Storage Lifecycle: Ephemeral Redis isolation and destruction on cleanup', async () => {
  const testUserId = `usr_${Date.now()}`;
  const testSessionId = `sess_${Date.now()}`;

  // Initialize session temporary storage (TTL 2 hours)
  const state = await initSessionTempStorage(testUserId, testSessionId);
  assert.equal(state.sessionId, testSessionId);
  assert.equal(state.userId, testUserId);

  // Append ephemeral chat messages
  await appendChatMessage(testUserId, testSessionId, {
    id: 'msg_1',
    sender: 'user',
    botType: 'siteAssistant',
    content: 'Analyze this image',
    timestamp: new Date().toISOString(),
  });

  const history = await getSessionChatHistory(testUserId, testSessionId);
  assert.equal(history.length, 1);
  assert.equal(history[0].content, 'Analyze this image');

  // Record temporary upload
  await recordTempUpload(testUserId, testSessionId, {
    fileId: 'f_1',
    originalName: 'evidence.png',
    savedPath: '/tmp/test.png',
    mimeType: 'image/png',
    sizeBytes: 1024,
    uploadedAt: new Date().toISOString(),
    modality: 'image',
  });

  // Store temporary analysis results
  await storeAnalysisResult(testUserId, testSessionId, 'rep_1', {
    classification: 'Document',
    confidence: 0.94,
  });

  const cached = await getAnalysisResult(testUserId, testSessionId, 'rep_1');
  assert.ok(cached);
  assert.equal(cached.classification, 'Document');

  // Execute session cleanup (simulating beforeunload sendBeacon)
  const cleanup = await cleanupSessionData(testUserId, testSessionId);
  assert.ok(cleanup.deletedKeys > 0);

  // Verify temporary data is destroyed (clean slate)
  const postCleanupHistory = await getSessionChatHistory(testUserId, testSessionId);
  assert.equal(postCleanupHistory.length, 0);

  const postCleanupResult = await getAnalysisResult(testUserId, testSessionId, 'rep_1');
  assert.equal(postCleanupResult, null);
});

test('5. Cross-Bot Routing: SiteAssistant Intent Classification & Routing', async () => {
  // Image queries
  const imgRoute = classifyIntentAndRoute('Please detect objects and run OCR on this photo');
  assert.equal(imgRoute.targetBot, 'imageAnalyzer');
  assert.ok(imgRoute.confidence >= 0.90);

  // Video queries
  const vidRoute = classifyIntentAndRoute('I want to transcribe this video and extract keyframes');
  assert.equal(vidRoute.targetBot, 'videoAnalyzer');
  assert.ok(vidRoute.confidence >= 0.90);

  // Audio queries
  const audRoute = classifyIntentAndRoute('Analyze this podcast recording and identify distinct speakers');
  assert.equal(audRoute.targetBot, 'audioAnalyzer');
  assert.ok(audRoute.confidence >= 0.90);

  // General questions
  const genRoute = classifyIntentAndRoute('What is KEYHOLE and how does the privacy architecture work?');
  assert.equal(genRoute.targetBot, 'siteAssistant');
  assert.ok(genRoute.confidence >= 0.90);
});

test('6. Accuracy Framework: Target Metrics Calibration (>90% threshold)', () => {
  const metrics = getAccuracyMetrics();

  // SiteAssistant >90%
  assert.ok(metrics.siteAssistant.intentAccuracy >= 0.90);
  assert.ok(metrics.siteAssistant.routingAccuracy >= 0.90);

  // ImageAnalyzer >90%
  assert.ok(metrics.imageAnalyzer.objectPrecision >= 0.90);
  assert.ok(metrics.imageAnalyzer.ocrAccuracy >= 0.90);

  // VideoAnalyzer: WER < 10%
  assert.ok(metrics.videoAnalyzer.transcriptionWER <= 0.10);
  assert.ok(metrics.videoAnalyzer.sceneAccuracy >= 0.90);

  // AudioAnalyzer: WER < 10%, DER < 15%, Language > 95%
  assert.ok(metrics.audioAnalyzer.transcriptionWER <= 0.10);
  assert.ok(metrics.audioAnalyzer.diarizationDER <= 0.15);
  assert.ok(metrics.audioAnalyzer.languageAccuracy >= 0.95);
});

test('7. Magic Bytes Validation: Accurate binary inspection', () => {
  // JPEG magic bytes: FF D8 FF
  const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  assert.equal(validateImageMagicBytes(jpegBuf, 'test.jpg').valid, true);

  // PNG magic bytes: 89 50 4E 47
  const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  assert.equal(validateImageMagicBytes(pngBuf, 'test.png').valid, true);

  // Spoofed file (text file renamed to .png)
  const fakeBuf = Buffer.from('Hello this is not an image at all!');
  assert.equal(validateImageMagicBytes(fakeBuf, 'fake.png').valid, false);

  // MP4 magic bytes: contains ftyp
  const mp4Buf = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
  assert.equal(validateVideoMagicBytes(mp4Buf, 'sample.mp4').valid, true);

  // MP3 magic bytes: ID3 header
  const mp3Buf = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]);
  assert.equal(validateAudioMagicBytes(mp3Buf, 'song.mp3').valid, true);
});
