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
  analyzeAudioFile,
  isSupportedAudioFormat,
  MAX_AUDIO_SIZE_BYTES,
} from '@/lib/server/audioEngine';
import { validateAudioMagicBytes } from '@/lib/server/magicBytes';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = (formData.get('userId') as string) || 'anonymous';
    const sessionId = (formData.get('sessionId') as string) || uuidv4();

    if (!file) {
      return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 });
    }

    if (!isSupportedAudioFormat(file.name)) {
      return NextResponse.json(
        { error: 'Unsupported format. Allowed: MP3, WAV, FLAC, AAC, OGG, WMA, M4A, OPUS.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 100MB limit.' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Strict Magic Bytes validation (file signature check)
    const magicCheck = validateAudioMagicBytes(fileBuffer, file.name);
    if (!magicCheck.valid) {
      return NextResponse.json({ error: magicCheck.error }, { status: 400 });
    }

    const fileId = uuidv4();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFileName = `${sessionId}_${fileId}_${safeName}`;
    const uploadDir = ensureTempUploadDir();
    const storedFilePath = path.join(uploadDir, storedFileName);

    fs.writeFileSync(storedFilePath, fileBuffer);

    // Run Audio Multimodal Pipeline
    const report = await analyzeAudioFile(file.name, fileBuffer);

    const fileRef: UploadedFileRef = {
      fileId,
      originalName: file.name,
      savedPath: storedFilePath,
      mimeType: file.type || 'audio/mpeg',
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      modality: 'audio',
    };

    await recordTempUpload(userId, sessionId, fileRef);
    await storeAnalysisResult(userId, sessionId, report.id, report as unknown as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      fileRef,
      report,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Audio upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
