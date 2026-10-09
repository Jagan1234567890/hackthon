import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionChatHistory,
  clearSessionChatHistory,
} from '@/lib/server/tempStorage';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'userId and sessionId parameters are required.' },
        { status: 400 }
      );
    }

    const history = await getSessionChatHistory(userId, sessionId);
    return NextResponse.json({
      success: true,
      sessionId,
      messages: history,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching history';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'userId and sessionId are required.' },
        { status: 400 }
      );
    }

    await clearSessionChatHistory(userId, sessionId);
    return NextResponse.json({
      success: true,
      message: 'Temporary chat history cleared for this session.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error clearing history';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
