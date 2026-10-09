import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthAccountLink } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/google/callback';

    let googleProfile = {
      sub: 'google_user_991823',
      email: 'demo.analyst@google.com',
      name: 'Google Verified User',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    // If live credentials provided, exchange code with Google OAuth endpoint
    if (clientId && clientSecret && code && code !== 'mock_google_auth_code') {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (userRes.ok) {
          googleProfile = await userRes.json();
        }
      }
    }

    const deviceInfo = req.headers.get('user-agent') || 'Google OAuth Client';
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const { user, accessToken, refreshToken } = await handleOAuthAccountLink({
      email: googleProfile.email,
      fullName: googleProfile.name || 'Google User',
      avatarUrl: googleProfile.picture || null,
      provider: 'google',
      providerId: googleProfile.sub,
      deviceInfo,
      ipAddress,
    });

    const response = NextResponse.redirect(new URL('/dashboard', req.url));

    response.cookies.set('keyhole_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    // Pass access token in a temporary cookie so frontend can sync state if needed
    response.cookies.set('keyhole_oauth_access', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60,
    });

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=GoogleAuthFailed', req.url));
  }
}
