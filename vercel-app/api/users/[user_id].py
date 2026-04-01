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

    def do_DELETE(self):
        user = get_user_from_request(self)
        if not user or user['role'] != 'admin':
            self._send_json({'detail': 'Admin access required'}, 403)
            return

        # Get user_id from path
        path_parts = self.path.split('/')
        user_id = path_parts[-1].split('?')[0]

        if user_id == user['id']:
            self._send_json({'detail': 'Cannot delete yourself'}, 400)
            return

        supabase.table('users').delete().eq('id', user_id).execute()
        self._send_json({'message': 'User deleted'})

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
