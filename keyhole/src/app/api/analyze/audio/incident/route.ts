import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  recordIncident,
  getSessionIncidents,
  getPromptModifierKey,
  buildIncidentResponse,
  type TrainingIncident,
  type AnalysisType,
  type IncidentSeverity,
} from '@/lib/server/incidentTraining';
import { redis } from '@/lib/server/tempStorage';

/**
 * POST /api/analyze/audio/incident
 * 
 * Records a user correction (incident) to the real-time training system.
 * Immediately updates the session's prompt modifier for in-session learning.
 * 
 * Body:
 *   userId, sessionId, analysisType, originalOutput, correctedOutput,
 *   audioTimestamp?, severity?, audioCharacteristics?
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      sessionId,
      analysisType = 'transcription',
      originalOutput,
      correctedOutput,
      audioTimestamp,
      severity = 'moderate',
      audioCharacteristics,
    } = body;

    if (!userId || !sessionId || !originalOutput || !correctedOutput) {
      return NextResponse.json(
        { error: 'userId, sessionId, originalOutput, and correctedOutput are required.' },
        { status: 400 }
      );
    }

    const incident: TrainingIncident = {
      incidentId: uuidv4(),
      sessionId,
      userId,
      analysisType: analysisType as AnalysisType,
      originalOutput: String(originalOutput).slice(0, 500),
      correctedOutput: String(correctedOutput).slice(0, 500),
      audioTimestamp: typeof audioTimestamp === 'number' ? audioTimestamp : undefined,
      severity: severity as IncidentSeverity,
      modelVersion: 'keyhole-1.0.0',
      audioCharacteristics: audioCharacteristics || {},
      recordedAt: new Date().toISOString(),
      applied: true,
    };

    await recordIncident(incident);

    // Get updated modifier for response
    const modifierKey = getPromptModifierKey(userId, sessionId);
    const modifier = redis.get(modifierKey) as {
      corrections: unknown[];
    } | null;

    const response = buildIncidentResponse(incident, {
      corrections: ((modifier?.corrections as any[]) || []).map((c) => ({
        type: c.analysisType || c.type || 'general',
        original: c.originalOutput || c.original || '',
        corrected: c.correctedOutput || c.corrected || '',
        timestamp: c.audioTimestamp || c.timestamp,
      })),
      domainVocabulary: [],
      languageHints: [],
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to record incident';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/analyze/audio/incident
 * 
 * Returns all recorded incidents for a session.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!userId || !sessionId) {
    return NextResponse.json({ error: 'userId and sessionId are required.' }, { status: 400 });
  }

  const incidents = await getSessionIncidents(userId, sessionId);

  return NextResponse.json({
    success: true,
    sessionId,
    incidentCount: incidents.length,
    incidents: incidents.slice(-50), // Return last 50
    accuracyImprovementEstimate:
      incidents.length > 0
        ? Math.min(0.15, incidents.length * 0.012) // Estimated improvement
        : 0,
  });
}
