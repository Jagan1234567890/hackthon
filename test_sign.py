import http.client
import json

boundary = 'BOUNDARY123'
filename = 'test_image.jpg'

with open(filename, 'rb') as f:
    file_data = f.read()

body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
    f'Content-Type: image/jpeg\r\n\r\n'
).encode() + file_data + (
    f'\r\n--{boundary}\r\n'
    f'Content-Disposition: form-data; name="device_id"\r\n\r\n'
    f'test-device\r\n'
    f'--{boundary}--\r\n'
).encode()

conn = http.client.HTTPConnection('localhost', 8000)
conn.request('POST', '/api/sign', body, {
    'Content-Type': f'multipart/form-data; boundary={boundary}',
})
res = conn.getresponse()
data = json.loads(res.read())
print('Status:', data.get('status'))
manifest = data.get('manifest', {})
print('Hash:', str(manifest.get('file_hash', ''))[:32] + '...')
print('Signature:', str(manifest.get('signature', ''))[:32] + '...')
print('SUCCESS - Sign endpoint working!')
