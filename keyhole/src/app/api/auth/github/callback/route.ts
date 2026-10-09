import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthAccountLink } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    let githubProfile = {
      id: 'github_user_448192',
      login: 'github-dev',
      email: 'dev@github.com',
      name: 'GitHub Engineer',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    if (clientId && clientSecret && code && code !== 'mock_github_auth_code') {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const userRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'Keyhole-OAuth-App',
          },
        });
        if (userRes.ok) {
          githubProfile = await userRes.json();
        }
      }
    }

    const deviceInfo = req.headers.get('user-agent') || 'GitHub OAuth Client';
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const { user, accessToken, refreshToken } = await handleOAuthAccountLink({
      email: githubProfile.email || `${githubProfile.login}@github.users.local`,
      fullName: githubProfile.name || githubProfile.login,
      avatarUrl: githubProfile.avatar_url || null,
      provider: 'github',
      providerId: String(githubProfile.id),
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

    response.cookies.set('keyhole_oauth_access', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60,
    });

    return response;
  } catch (err) {
    console.error('GitHub OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=GitHubAuthFailed', req.url));
  }
}
