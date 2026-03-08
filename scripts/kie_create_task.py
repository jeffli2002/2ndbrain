#!/usr/bin/env python3
import json, sys, urllib.request
from pathlib import Path

ENDPOINT = "https://api.kie.ai/api/v1/jobs/createTask"

def load_key():
    obj = json.loads(Path('/root/.openclaw/credentials/kie.json').read_text())
    return obj['api_key']

def main():
    if len(sys.argv) < 2:
        print('Usage: kie_create_task.py <prompt> [callback_url]', file=sys.stderr)
        sys.exit(2)
    prompt = sys.argv[1]
    callback = sys.argv[2] if len(sys.argv) > 2 else None
    body = {
        'model': 'nano-banana-2',
        'input': {
            'prompt': prompt,
            'aspect_ratio': '16:9',
            'google_search': False,
            'resolution': '1K',
            'output_format': 'png'
        }
    }
    if callback:
        body['callBackUrl'] = callback
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {load_key()}'
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        print(r.read().decode())

if __name__ == '__main__':
    main()
