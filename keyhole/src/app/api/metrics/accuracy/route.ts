import { NextRequest, NextResponse } from 'next/server';
import { getAccuracyMetrics, recordFeedback } from '@/lib/server/aiRouter';

export async function GET() {
  const metrics = getAccuracyMetrics();
  return NextResponse.json({
    success: true,
    targetAccuracy: 0.90, // 90% specification
    metrics,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { botType = 'siteAssistant', isPositive = true } = body;

    recordFeedback(botType, Boolean(isPositive));

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded for continuous learning framework.',
      currentMetrics: getAccuracyMetrics(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error recording feedback';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
