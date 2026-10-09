import { NextRequest, NextResponse } from 'next/server';
import { refreshUserSession } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('keyhole_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token provided.' }, { status: 401 });
    }

    const deviceInfo = req.headers.get('user-agent') || 'Browser Client';
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const refreshed = await refreshUserSession(refreshToken, deviceInfo, ipAddress);
    if (!refreshed) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: refreshed.user.id,
        email: refreshed.user.email,
        fullName: refreshed.user.full_name,
        avatarUrl: refreshed.user.avatar_url,
        authProvider: refreshed.user.auth_provider,
        lastLogin: refreshed.user.last_login,
      },
      accessToken: refreshed.accessToken,
    });

    response.cookies.set('keyhole_refresh_token', refreshed.newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Refresh failed';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
