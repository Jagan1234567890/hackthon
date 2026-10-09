import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisResult } from '@/lib/server/tempStorage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('userId');
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'userId and sessionId are required.' },
        { status: 400 }
      );
    }

    const report = await getAnalysisResult(userId, sessionId, id);
    if (!report) {
      return NextResponse.json(
        { error: 'Analysis result not found or expired from temporary storage.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching result';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
