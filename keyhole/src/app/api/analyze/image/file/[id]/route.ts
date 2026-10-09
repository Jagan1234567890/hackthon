import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { TEMP_UPLOAD_DIR } from '@/lib/server/tempStorage';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = req.nextUrl.searchParams.get('sessionId') || '';

    if (fs.existsSync(TEMP_UPLOAD_DIR)) {
      const files = fs.readdirSync(TEMP_UPLOAD_DIR);
      for (const f of files) {
        if (f.includes(id) && (!sessionId || f.startsWith(sessionId))) {
          fs.unlinkSync(path.join(TEMP_UPLOAD_DIR, f));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `File ${id} deleted from temporary storage.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error deleting file';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
