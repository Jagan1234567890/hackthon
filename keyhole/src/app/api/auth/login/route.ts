import { NextRequest, NextResponse } from 'next/server';
import { loginLocalUser } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const deviceInfo = req.headers.get('user-agent') || 'Browser Client';
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const { user, accessToken, refreshToken } = await loginLocalUser({
      email,
      password,
      deviceInfo,
      ipAddress,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        authProvider: user.auth_provider,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
      accessToken,
    });

    // Store refresh token in httpOnly cookie
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
    response.cookies.set('keyhole_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed.';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
