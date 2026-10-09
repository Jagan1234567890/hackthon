"""Full end-to-end test: sign → verify → tamper → re-verify"""
import http.client
import json
from PIL import Image, ImageDraw

def multipart_post(path, filename, file_data, content_type='image/jpeg'):
    boundary = 'TESTBOUNDARY456'
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f'Content-Type: {content_type}\r\n\r\n'
    ).encode() + file_data + (
        f'\r\n--{boundary}--\r\n'
    ).encode()
    conn = http.client.HTTPConnection('localhost', 8000)
    conn.request('POST', path, body, {
        'Content-Type': f'multipart/form-data; boundary={boundary}',
    })
    res = conn.getresponse()
    return json.loads(res.read())

# 1. Create original image
img = Image.new('RGB', (320, 180), color=(20, 80, 160))
d = ImageDraw.Draw(img)
d.rectangle([40, 60, 280, 120], fill=(255, 200, 0))
d.text((60, 75), 'ORIGINAL', fill=(0, 0, 0))
import io
buf = io.BytesIO(); img.save(buf, 'JPEG'); orig_bytes = buf.getvalue()

print("=" * 60)
print("TEST 1: Sign original image")
data = multipart_post('/api/sign', 'original.jpg', orig_bytes)
print(f"  Status:    {data['status']}")
orig_hash = data['manifest']['file_hash']
print(f"  Hash:      {orig_hash[:24]}...")
print(f"  Signature: {data['manifest']['signature'][:24]}...")
assert data['status'] in ('signed', 'already_signed'), f"Unexpected status: {data['status']}"

print()
print("TEST 2: Verify the same file -> should be AUTHENTIC")
data = multipart_post('/api/verify', 'original.jpg', orig_bytes)
print(f"  Verdict:   {data['verdict']}")
print(f"  Message:   {data['message'][:60]}...")
assert data['verdict'] == 'AUTHENTIC', f"Expected AUTHENTIC, got {data['verdict']}"
assert data['signature_valid'] == True

print()
print("TEST 3: Modify the image (tamper) and re-verify")
img_tampered = img.copy()
d2 = ImageDraw.Draw(img_tampered)
d2.rectangle([0, 0, 320, 180], fill=(255, 0, 0))
d2.text((100, 80), 'TAMPERED!', fill=(255, 255, 255))
buf2 = io.BytesIO(); img_tampered.save(buf2, 'JPEG'); tampered_bytes = buf2.getvalue()

data = multipart_post('/api/tamper-demo', 'tampered.jpg', tampered_bytes)
print(f"  Verdict:   {data['verdict']}")
print(f"  New hash:  {data['file_hash'][:24]}...")
print(f"  Different from original: {data['file_hash'] != orig_hash}")
assert data['verdict'] == 'TAMPERED_OR_UNSIGNED', f"Expected TAMPERED_OR_UNSIGNED, got {data['verdict']}"
assert data['file_hash'] != orig_hash, "Hashes should differ!"

print()
print("TEST 4: Check history")
conn = http.client.HTTPConnection('localhost', 8000)
conn.request('GET', '/api/history?limit=5')
history = json.loads(conn.getresponse().read())
print(f"  Recent verifications: {len(history)}")
assert len(history) >= 1

print()
print("=" * 60)
print("ALL TESTS PASSED ✓")
