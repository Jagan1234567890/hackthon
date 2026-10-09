import { NextRequest, NextResponse } from 'next/server';
import { registerLocalUser } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, termsAccepted } = body;

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'You must accept the Terms of Service to create an account.' },
        { status: 400 }
      );
    }

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required.' },
        { status: 400 }
      );
    }

    const deviceInfo = req.headers.get('user-agent') || 'Browser Client';
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const { user, accessToken, refreshToken } = await registerLocalUser({
      fullName,
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

    // Store refresh token in httpOnly cookie with 7-day expiry
    response.cookies.set('keyhole_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
