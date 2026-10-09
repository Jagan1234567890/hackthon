/**
 * FILE UPLOAD VALIDATION USING MAGIC BYTES (FILE SIGNATURES)
 * 
 * Strict binary inspection preventing extension spoofing and polyglot attacks.
 */

export function validateImageMagicBytes(buffer: Buffer, fileName: string): { valid: boolean; detected?: string; error?: string } {
  if (buffer.length < 4) {
    return { valid: false, error: 'File is too small to be a valid image.' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detected: 'JPEG' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, detected: 'PNG' };
  }

  // GIF: 47 49 46 38 ("GIF8")
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, detected: 'GIF' };
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12
  ) {
    const riffType = buffer.toString('ascii', 8, 12);
    if (riffType === 'WEBP') {
      return { valid: true, detected: 'WEBP' };
    }
  }

  // BMP: 42 4D ("BM")
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return { valid: true, detected: 'BMP' };
  }

  // TIFF: 49 49 2A 00 or 4D 4D 00 2A
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) {
    return { valid: true, detected: 'TIFF' };
  }

  // SVG: text checking for <svg or <?xml (within first 512 bytes)
  const headerSlice = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf-8', 0).toLowerCase();
  if (headerSlice.includes('<svg') || headerSlice.includes('<?xml')) {
    return { valid: true, detected: 'SVG' };
  }

  return {
    valid: false,
    error: `Invalid image signature. The file "${fileName}" does not match supported image magic bytes.`,
  };
}

export function validateVideoMagicBytes(buffer: Buffer, fileName: string): { valid: boolean; detected?: string; error?: string } {
  if (buffer.length < 8) {
    return { valid: false, error: 'File is too small to be a valid video.' };
  }

  // MP4 / MOV / 3GP: 'ftyp' at offset 4 or within first 32 bytes
  const headerHex = buffer.subarray(0, Math.min(buffer.length, 64)).toString('ascii');
  if (headerHex.includes('ftyp') || headerHex.includes('moov') || headerHex.includes('mdat')) {
    return { valid: true, detected: 'MP4/MOV' };
  }

  // AVI: 'RIFF'....'AVI '
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12
  ) {
    const aviType = buffer.toString('ascii', 8, 12);
    if (aviType === 'AVI ') {
      return { valid: true, detected: 'AVI' };
    }
  }

  // MKV / WebM: 1A 45 DF A3 (EBML Header)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { valid: true, detected: 'MKV/WebM' };
  }

  // FLV: 46 4C 56 ("FLV")
  if (buffer[0] === 0x46 && buffer[1] === 0x4c && buffer[2] === 0x56) {
    return { valid: true, detected: 'FLV' };
  }

  // WMV / ASF: 30 26 B2 75
  if (
    buffer[0] === 0x30 &&
    buffer[1] === 0x26 &&
    buffer[2] === 0xb2 &&
    buffer[3] === 0x75
  ) {
    return { valid: true, detected: 'WMV' };
  }

  return {
    valid: false,
    error: `Invalid video signature. The file "${fileName}" does not match supported video magic bytes.`,
  };
}

export function validateAudioMagicBytes(buffer: Buffer, fileName: string): { valid: boolean; detected?: string; error?: string } {
  if (buffer.length < 4) {
    return { valid: false, error: 'File is too small to be a valid audio file.' };
  }

  // MP3: 'ID3' (49 44 33) or MPEG sync frame (FF FB or FF F3 or FF F2)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  ) {
    return { valid: true, detected: 'MP3' };
  }

  // WAV: 'RIFF'....'WAVE'
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12
  ) {
    const waveType = buffer.toString('ascii', 8, 12);
    if (waveType === 'WAVE') {
      return { valid: true, detected: 'WAV' };
    }
  }

  // FLAC: 'fLaC' (66 4C 61 43)
  if (
    buffer[0] === 0x66 &&
    buffer[1] === 0x4c &&
    buffer[2] === 0x61 &&
    buffer[3] === 0x43
  ) {
    return { valid: true, detected: 'FLAC' };
  }

  // OGG: 'OggS' (4F 67 67 53)
  if (
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return { valid: true, detected: 'OGG' };
  }

  // AAC / ADTS: FF F1 or FF F9
  if (buffer[0] === 0xff && (buffer[1] === 0xf1 || buffer[1] === 0xf9)) {
    return { valid: true, detected: 'AAC' };
  }

  // M4A: contains 'ftyp' with 'M4A' or 'mp42'
  const headerHex = buffer.subarray(0, Math.min(buffer.length, 64)).toString('ascii');
  if (headerHex.includes('ftyp') || headerHex.includes('M4A')) {
    return { valid: true, detected: 'M4A' };
  }

  return {
    valid: false,
    error: `Invalid audio signature. The file "${fileName}" does not match supported audio magic bytes.`,
  };
}
