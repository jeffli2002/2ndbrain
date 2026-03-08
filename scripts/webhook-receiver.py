#!/usr/bin/env python3
"""Simple webhook receiver for KIE.ai callbacks"""
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

PORT = 9000
LOG_FILE = "/root/.openclaw/workspace/kie-callbacks.log"

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Log to file
        with open(LOG_FILE, "a") as f:
            f.write(f"\n=== {timestamp} ===\n")
            f.write(body)
            f.write("\n")
        
        # Try to parse and extract image URL
        try:
            data = json.loads(body)
            with open(LOG_FILE, "a") as f:
                f.write(f"Parsed: {json.dumps(data, indent=2)}\n")
        except:
            pass
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status": "received"}')
    
    def log_message(self, format, *args):
        pass  # Suppress logging

if __name__ == "__main__":
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f"Webhook receiver running on port {PORT}")
    print(f"Log file: {LOG_FILE}")
    server.serve_forever()
