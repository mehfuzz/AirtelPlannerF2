from http.server import BaseHTTPRequestHandler
import json
import os
from supabase import create_client
from _utils import get_cors_headers, get_user_from_request

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
        
        if not user:
            self._send_json({'detail': 'Not authenticated'}, 401)
            return

        # Get full user data
        result = supabase.table('users').select('*').eq('id', user['id']).execute()
        if result.data:
            db_user = result.data[0]
            password_changed = db_user.get('password_changed', False)
            is_first_login = user['role'] != 'admin' and not password_changed
            
            user['password_changed'] = password_changed
            user['is_first_login'] = is_first_login

        self._send_json(user)

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
