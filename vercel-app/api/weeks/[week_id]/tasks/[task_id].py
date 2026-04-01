from http.server import BaseHTTPRequestHandler
import json
import os
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

    def do_PUT(self):
        user = get_user_from_request(self)
        if not user:
            self._send_json({'detail': 'Not authenticated'}, 401)
            return

        # Path: /api/weeks/[week_id]/tasks/[task_id]
        path_parts = self.path.split('/')
        task_id = path_parts[-1].split('?')[0]
        week_id = path_parts[-3]

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}

        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'completed' in data:
            update_data['completed'] = data['completed']
        if 'due_date' in data:
            update_data['due_date'] = data['due_date']

        if update_data:
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            supabase.table('tasks').update(update_data).eq('id', task_id).execute()

        result = supabase.table('tasks').select('*').eq('id', task_id).execute()
        if result.data:
            task = result.data[0]
            comments_result = supabase.table('comments').select('*').eq('task_id', task_id).execute()
            task['comments'] = comments_result.data or []
            self._send_json(task)
        else:
            self._send_json({'detail': 'Task not found'}, 404)

    def do_DELETE(self):
        user = get_user_from_request(self)
        if not user:
            self._send_json({'detail': 'Not authenticated'}, 401)
            return

        path_parts = self.path.split('/')
        task_id = path_parts[-1].split('?')[0]

        # Delete comments first
        supabase.table('comments').delete().eq('task_id', task_id).execute()
        # Delete task
        supabase.table('tasks').delete().eq('id', task_id).execute()
        
        self._send_json({'message': 'Task deleted'})

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
