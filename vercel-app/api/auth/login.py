from http.server import BaseHTTPRequestHandler
import json
import os
from supabase import create_client
from _utils import (
    get_cors_headers, hash_password, verify_password,
    create_access_token, get_user_from_request,
    json_response, error_response
)

supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}

        email = data.get('email', '').lower()
        password = data.get('password', '')

        if not email or not password:
            self._send_json({'detail': 'Email and password required'}, 400)
            return

        # Get user from Supabase
        result = supabase.table('users').select('*').eq('email', email).execute()
        
        if not result.data:
            self._send_json({'detail': 'Invalid email or password'}, 401)
            return

        user = result.data[0]
        
        if not verify_password(password, user['password_hash']):
            self._send_json({'detail': 'Invalid email or password'}, 401)
            return

        # Create token
        token = create_access_token(user['id'], email)
        
        # Check first login
        password_changed = user.get('password_changed', False)
        is_first_login = user['role'] != 'admin' and not password_changed

        response_data = {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'role': user['role'],
            'password_changed': password_changed,
            'is_first_login': is_first_login
        }

        self.send_response(200)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.send_header('Set-Cookie', f'access_token={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
