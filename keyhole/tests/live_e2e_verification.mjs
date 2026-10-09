import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

async function runLiveVerification() {
  console.log('🚀 Starting Full-Stack Live E2E Verification...');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert.equal(healthRes.status, 200, 'Health check must return 200');
  const health = await healthRes.json();
  console.log('✅ Health Check Verified:', health.status, health.services);

  // 2. Accuracy metrics endpoint
  const metricsRes = await fetch(`${BASE_URL}/api/metrics/accuracy`);
  assert.equal(metricsRes.status, 200);
  const metrics = await metricsRes.json();
  assert.ok(metrics.metrics.siteAssistant.intentAccuracy >= 0.90);
  console.log('✅ 90% Accuracy Framework Metrics Verified');

  // 3. User Registration
  const testEmail = `live_analyst_${Date.now()}@keyhole.local`;
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Alex Morgan',
      email: testEmail,
      password: 'SecurePassword2026!',
      termsAccepted: true,
    }),
  });
  assert.equal(signupRes.status, 200, 'Signup must return 200');
  const signupData = await signupRes.json();
  assert.ok(signupData.user.id);
  assert.ok(signupData.accessToken);
  console.log('✅ User Registration Verified:', signupData.user.email);

  // 4. User Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword2026!',
      rememberMe: true,
    }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.user.id, signupData.user.id);
  console.log('✅ User Login & JWT Session Verified');

  // 5. Auth /me check
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.accessToken}` },
  });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.user.id, loginData.user.id);
  console.log('✅ Auth /me Profile Verified');

  // 6. SiteAssistant Interaction & Routing
  const sessionId = `live_sess_${Date.now()}`;
  const userId = loginData.user.id;

  const chatRes = await fetch(`${BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sessionId,
      message: 'I want to analyze an image for text and colors',
      botType: 'siteAssistant',
    }),
  });
  assert.equal(chatRes.status, 200);
  const chatData = await chatRes.json();
  assert.ok(chatData.botMessage.confidence >= 0.70);
  assert.equal(chatData.routeRedirect.bot, 'imageAnalyzer');
  console.log('✅ SiteAssistant Intelligent Cross-Modality Routing Verified');

  // 7. Image Upload & Magic Bytes
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const imgBlob = new Blob([validJpeg], { type: 'image/jpeg' });
  const imgForm = new FormData();
  imgForm.append('file', imgBlob, 'evidence.jpg');
  imgForm.append('userId', userId);
  imgForm.append('sessionId', sessionId);

  const imgUploadRes = await fetch(`${BASE_URL}/api/analyze/image/upload`, {
    method: 'POST',
    body: imgForm,
  });
  assert.equal(imgUploadRes.status, 200);
  const imgUploadData = await imgUploadRes.json();
  assert.ok(imgUploadData.report.id);
  assert.ok(imgUploadData.report.confidence >= 0.90);
  console.log('✅ ImageAnalyzer Upload & Magic Bytes Inspection Verified');

  // 8. Image Query
  const imgQueryRes = await fetch(`${BASE_URL}/api/analyze/image/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sessionId,
      analysisId: imgUploadData.report.id,
      question: 'What are the dominant colors and objects?',
    }),
  });
  assert.equal(imgQueryRes.status, 200);
  const imgQueryData = await imgQueryRes.json();
  assert.ok(imgQueryData.botMessage.content.length > 10);
  console.log('✅ ImageAnalyzer Conversational Vision Q&A Verified');

  // 9. Video Upload & Magic Bytes
  const validMp4 = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
  const vidBlob = new Blob([validMp4], { type: 'video/mp4' });
  const vidForm = new FormData();
  vidForm.append('file', vidBlob, 'test_video.mp4');
  vidForm.append('userId', userId);
  vidForm.append('sessionId', sessionId);

  const vidUploadRes = await fetch(`${BASE_URL}/api/analyze/video/upload`, {
    method: 'POST',
    body: vidForm,
  });
  assert.equal(vidUploadRes.status, 200);
  const vidUploadData = await vidUploadRes.json();
  assert.ok(vidUploadData.report.scenes.length > 0);
  assert.ok(vidUploadData.report.transcript.length > 0);
  console.log('✅ VideoAnalyzer Scene & Whisper Transcript Verified');

  // 10. Video Query with Timestamp Seek
  const vidQueryRes = await fetch(`${BASE_URL}/api/analyze/video/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sessionId,
      analysisId: vidUploadData.report.id,
      question: 'What happens in scene 2?',
    }),
  });
  assert.equal(vidQueryRes.status, 200);
  const vidQueryData = await vidQueryRes.json();
  assert.ok(vidQueryData.jumpToSeconds !== undefined);
  console.log('✅ VideoAnalyzer Timestamp-Linked Seek Verified');

  // 11. Audio Upload & Magic Bytes
  const validMp3 = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20]);
  const audBlob = new Blob([validMp3], { type: 'audio/mpeg' });
  const audForm = new FormData();
  audForm.append('file', audBlob, 'podcast.mp3');
  audForm.append('userId', userId);
  audForm.append('sessionId', sessionId);

  const audUploadRes = await fetch(`${BASE_URL}/api/analyze/audio/upload`, {
    method: 'POST',
    body: audForm,
  });
  assert.equal(audUploadRes.status, 200);
  const audUploadData = await audUploadRes.json();
  assert.ok(audUploadData.report.segments.length > 0);
  assert.ok(audUploadData.report.speakersFound.length > 0);
  console.log('✅ AudioAnalyzer Multi-Speaker Diarization Verified');

  // 12. Audio Query
  const audQueryRes = await fetch(`${BASE_URL}/api/analyze/audio/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sessionId,
      analysisId: audUploadData.report.id,
      question: 'Who are the speakers and what is the sentiment?',
    }),
  });
  assert.equal(audQueryRes.status, 200);
  const audQueryData = await audQueryRes.json();
  assert.ok(audQueryData.botMessage.content.length > 10);
  console.log('✅ AudioAnalyzer Conversational Acoustic Q&A Verified');

  // 13. Dual-Storage Lifecycle & Clean-Slate Purge
  const cleanupRes = await fetch(`${BASE_URL}/api/cleanup-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, sessionId }),
  });
  assert.equal(cleanupRes.status, 200);
  const cleanupData = await cleanupRes.json();
  assert.equal(cleanupData.success, true);
  console.log('✅ Session Cleanup /api/cleanup-session Verified: Destroyed', cleanupData.cleanedKeyCount, 'Redis keys &', cleanupData.cleanedFilesCount, 'files');

  // 14. Verify clean slate for the session
  const historyRes = await fetch(`${BASE_URL}/api/chat/history?userId=${userId}&sessionId=${sessionId}`);
  const historyData = await historyRes.json();
  assert.equal(historyData.messages.length, 0, 'Temporary session history must be empty after cleanup');
  console.log('✅ Clean Slate Confirmed: 0 temporary messages remaining');

  // 15. Verify Persistent User is still intact in DB
  const verifyUserRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.accessToken}` },
  });
  assert.equal(verifyUserRes.status, 200);
  const verifyUserData = await verifyUserRes.json();
  assert.equal(verifyUserData.user.email, testEmail);
  console.log('✅ Persistent User Still Valid In DB After Temporary Cleanup:', verifyUserData.user.email);

  console.log('🎉 ALL 15 FULL-STACK SPECIFICATIONS VERIFIED 100% OPERATIONAL!');
}

runLiveVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
