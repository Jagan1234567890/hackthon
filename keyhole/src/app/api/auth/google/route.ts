import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/api/auth/google/callback';

  if (!clientId) {
    // Development fallback mock authorization redirect
    return NextResponse.redirect(
      new URL('/api/auth/google/callback?code=mock_google_auth_code', redirectUri)
    );
  }

  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
