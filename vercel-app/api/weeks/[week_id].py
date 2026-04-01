from http.server import BaseHTTPRequestHandler
import json
import os
import uuid
from urllib.parse import urlparse, parse_qs
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

    def do_PUT(self):
        user = get_user_from_request(self)
        if not user:
            self._send_json({'detail': 'Not authenticated'}, 401)
            return

        # Get week_id from path
        path_parts = self.path.split('/')
        week_id = path_parts[-1].split('?')[0] if path_parts else None

        if not week_id:
            self._send_json({'detail': 'Week ID required'}, 400)
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}

        # Update week
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        
        if update_data:
            supabase.table('weeks').update(update_data).eq('id', week_id).execute()

        # Return updated week
        result = supabase.table('weeks').select('*').eq('id', week_id).execute()
        if result.data:
            week = result.data[0]
            tasks_result = supabase.table('tasks').select('*').eq('week_id', week_id).order('position').execute()
            week['tasks'] = tasks_result.data or []
            self._send_json(week)
        else:
            self._send_json({'detail': 'Week not found'}, 404)

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
