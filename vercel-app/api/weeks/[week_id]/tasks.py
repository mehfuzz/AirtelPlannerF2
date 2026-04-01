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

        # Get week_id from path: /api/weeks/[week_id]/tasks
        path_parts = self.path.split('/')
        week_id = path_parts[-2] if len(path_parts) >= 2 else None

        if not week_id:
            self._send_json({'detail': 'Week ID required'}, 400)
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}

        # Get max position
        result = supabase.table('tasks').select('position').eq('week_id', week_id).order('position', desc=True).limit(1).execute()
        max_pos = result.data[0]['position'] if result.data else 0

        # Create task
        task_id = str(uuid.uuid4())
        new_task = {
            'id': task_id,
            'week_id': week_id,
            'title': data.get('title', ''),
            'completed': False,
            'due_date': data.get('due_date'),
            'position': max_pos + 1,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'created_by': user['id']
        }

        supabase.table('tasks').insert(new_task).execute()
        new_task['comments'] = []
        self._send_json(new_task)

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
