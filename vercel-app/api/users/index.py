from http.server import BaseHTTPRequestHandler
import json
import os
from supabase import create_client
from _utils import get_cors_headers, get_user_from_request, hash_password

supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()

    def do_GET(self):
        user = get_user_from_request(self)
        if not user or user['role'] != 'admin':
            self._send_json({'detail': 'Admin access required'}, 403)
            return

        result = supabase.table('users').select('id, email, name, role').execute()
        self._send_json(result.data or [])

    def do_POST(self):
        user = get_user_from_request(self)
        if not user or user['role'] != 'admin':
            self._send_json({'detail': 'Admin access required'}, 403)
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}

        email = data.get('email', '').lower()
        password = data.get('password', '')
        name = data.get('name', '')

        if not email or not password or not name:
            self._send_json({'detail': 'Email, password, and name required'}, 400)
            return

        # Check if email exists
        existing = supabase.table('users').select('id').eq('email', email).execute()
        if existing.data:
            self._send_json({'detail': 'Email already exists'}, 400)
            return

        # Create user
        import uuid
        user_id = str(uuid.uuid4())
        new_user = {
            'id': user_id,
            'email': email,
            'password_hash': hash_password(password),
            'name': name,
            'role': 'user',
            'password_changed': False
        }

        supabase.table('users').insert(new_user).execute()

        self._send_json({
            'id': user_id,
            'email': email,
            'name': name,
            'role': 'user'
        })

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
