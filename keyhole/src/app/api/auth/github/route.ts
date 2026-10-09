import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri =
    process.env.GITHUB_CALLBACK_URL ||
    'http://localhost:3000/api/auth/github/callback';

  if (!clientId) {
    // Development fallback mock authorization redirect
    return NextResponse.redirect(
      new URL('/api/auth/github/callback?code=mock_github_auth_code', redirectUri)
    );
  }

  const scope = encodeURIComponent('user:email read:user');
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}`;

  return NextResponse.redirect(githubAuthUrl);
}
