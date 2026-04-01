from http.server import BaseHTTPRequestHandler
import json
import os
import uuid
from datetime import datetime, timezone
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

    def do_POST(self):
        user = get_user_from_request(self)
        if not user:
            self._send_json({'detail': 'Not authenticated'}, 401)
            return

        # Path: /api/weeks/[week_id]/tasks/[task_id]/comments
        path_parts = self.path.split('/')
        task_id = path_parts[-2]

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}

        comment_id = str(uuid.uuid4())
        new_comment = {
            'id': comment_id,
            'task_id': task_id,
            'text': data.get('text', ''),
            'is_mentor_comment': data.get('is_mentor_comment', False),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'created_by': user['id'],
            'created_by_name': user['name']
        }

        supabase.table('comments').insert(new_comment).execute()
        self._send_json(new_comment)

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
