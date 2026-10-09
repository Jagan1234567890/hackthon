import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisResult } from '@/lib/server/tempStorage';
import { VideoAnalysisReport } from '@/lib/server/videoEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('userId');
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    const format = req.nextUrl.searchParams.get('format') || 'srt'; // 'srt' | 'vtt' | 'txt'

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId are required.' }, { status: 400 });
    }

    const report = await getAnalysisResult<VideoAnalysisReport>(userId, sessionId, id);
    if (!report) {
      return NextResponse.json({ error: 'Transcript not found.' }, { status: 404 });
    }

    if (format === 'vtt') {
      return new NextResponse(report.subtitlesVtt, {
        headers: {
          'Content-Type': 'text/vtt; charset=utf-8',
          'Content-Disposition': `attachment; filename="${id}_subtitles.vtt"`,
        },
      });
    }

    if (format === 'txt') {
      const rawText = report.transcript.map((t) => t.text).join('\n');
      return new NextResponse(rawText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${id}_transcript.txt"`,
        },
      });
    }

    // Default: SRT
    return new NextResponse(report.subtitlesSrt, {
      headers: {
        'Content-Type': 'application/x-subrip; charset=utf-8',
        'Content-Disposition': `attachment; filename="${id}_subtitles.srt"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching transcript';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
