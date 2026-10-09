import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/lib/server/auth';
import { deleteUserSessions } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('keyhole_refresh_token')?.value;

    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload) {
        await deleteUserSessions(payload.userId);
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully. Session invalidated.',
    });

    // Invalidate cookie
    response.cookies.set('keyhole_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}
