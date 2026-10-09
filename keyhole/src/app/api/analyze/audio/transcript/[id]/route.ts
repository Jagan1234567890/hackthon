import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisResult } from '@/lib/server/tempStorage';
import { AudioAnalysisReport } from '@/lib/server/audioEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('userId');
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    const format = req.nextUrl.searchParams.get('format') || 'srt'; // 'srt' | 'txt' | 'docx'

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId are required.' }, { status: 400 });
    }

    const report = await getAnalysisResult<AudioAnalysisReport>(userId, sessionId, id);
    if (!report) {
      return NextResponse.json({ error: 'Audio transcript not found.' }, { status: 404 });
    }

    if (format === 'txt' || format === 'docx') {
      const formatted = report.segments
        .map((s) => `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s] ${s.speaker}: ${s.text}`)
        .join('\n\n');
      return new NextResponse(formatted, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${id}_transcript.${format === 'docx' ? 'docx' : 'txt'}"`,
        },
      });
    }

    return new NextResponse(report.subtitlesSrt, {
      headers: {
        'Content-Type': 'application/x-subrip; charset=utf-8',
        'Content-Disposition': `attachment; filename="${id}_transcript.srt"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching audio transcript';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
