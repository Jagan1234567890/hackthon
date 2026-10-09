import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/server/auth';
import { findUserById } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  try {
    // 1. Try bearer token
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      if (payload) userId = payload.userId;
    }

    // 2. Try cookie refresh token fallback
    if (!userId) {
      const refreshToken = req.cookies.get('keyhole_refresh_token')?.value;
      if (refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        if (payload) userId = payload.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        authProvider: user.auth_provider,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        preferences: user.preferences,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      if (payload) userId = payload.userId;
    }

    if (!userId) {
      const refreshToken = req.cookies.get('keyhole_refresh_token')?.value;
      if (refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        if (payload) userId = payload.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, avatarUrl, preferences } = body;

    const updates: Record<string, unknown> = {};
    if (fullName) updates.full_name = fullName.trim();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (preferences) updates.preferences = preferences;

    const { updateUser } = await import('@/lib/server/db');
    const updated = await updateUser(userId, updates);

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
