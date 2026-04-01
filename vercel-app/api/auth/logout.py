from http.server import BaseHTTPRequestHandler
import json
from _utils import get_cors_headers

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()

    def do_POST(self):
        self.send_response(200)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.send_header('Set-Cookie', 'access_token=; Path=/; HttpOnly; Max-Age=0')
        self.end_headers()
        self.wfile.write(json.dumps({'message': 'Logged out successfully'}).encode())
