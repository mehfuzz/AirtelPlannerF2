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

    def do_PUT(self):
        user = get_user_from_request(self)
        if not user:
            self._send_json({'detail': 'Not authenticated'}, 401)
            return

        # Path: /api/weeks/[week_id]/tasks/reorder
        path_parts = self.path.split('/')
        week_id = path_parts[-3]

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}

        task_ids = data.get('task_ids', [])

        # Update positions
        for i, task_id in enumerate(task_ids):
            supabase.table('tasks').update({'position': i}).eq('id', task_id).execute()

        # Return updated tasks
        result = supabase.table('tasks').select('*').eq('week_id', week_id).order('position').execute()
        tasks = result.data or []
        
        for task in tasks:
            comments_result = supabase.table('comments').select('*').eq('task_id', task['id']).execute()
            task['comments'] = comments_result.data or []

        self._send_json({'message': 'Tasks reordered', 'tasks': tasks})

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
