import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  TEMP_UPLOAD_DIR,
  ensureTempUploadDir,
  recordTempUpload,
  storeAnalysisResult,
  UploadedFileRef,
} from '@/lib/server/tempStorage';
import {
  analyzeImageFile,
  isSupportedImageFormat,
  MAX_IMAGE_SIZE_BYTES,
} from '@/lib/server/imageEngine';
import { validateImageMagicBytes } from '@/lib/server/magicBytes';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = (formData.get('userId') as string) || 'anonymous';
    const sessionId = (formData.get('sessionId') as string) || uuidv4();

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded.' }, { status: 400 });
    }

    if (!isSupportedImageFormat(file.name)) {
      return NextResponse.json(
        { error: 'Unsupported format. Allowed: JPG, PNG, GIF, WebP, BMP, TIFF, SVG.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 25MB limit.' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Strict Magic Bytes validation (file signature check)
    const magicCheck = validateImageMagicBytes(fileBuffer, file.name);
    if (!magicCheck.valid) {
      return NextResponse.json({ error: magicCheck.error }, { status: 400 });
    }

    const fileId = uuidv4();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFileName = `${sessionId}_${fileId}_${safeName}`;
    const uploadDir = ensureTempUploadDir();
    const storedFilePath = path.join(uploadDir, storedFileName);

    // Write temporarily to disk with session prefix
    fs.writeFileSync(storedFilePath, fileBuffer);

    // Run Vision Pipeline
    const report = await analyzeImageFile(file.name, fileBuffer);

    // Save temporary reference to Redis
    const fileRef: UploadedFileRef = {
      fileId,
      originalName: file.name,
      savedPath: storedFilePath,
      mimeType: file.type || 'image/jpeg',
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      modality: 'image',
    };

    await recordTempUpload(userId, sessionId, fileRef);
    await storeAnalysisResult(userId, sessionId, report.id, report as unknown as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      fileRef,
      report,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Image upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
