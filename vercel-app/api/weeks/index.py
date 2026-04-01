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

        # Get all weeks with tasks
        weeks_result = supabase.table('weeks').select('*').order('week_number').execute()
        weeks = weeks_result.data or []

        # Get tasks for each week
        for week in weeks:
            tasks_result = supabase.table('tasks').select('*').eq('week_id', week['id']).order('position').execute()
            tasks = tasks_result.data or []
            
            # Get comments for each task
            for task in tasks:
                comments_result = supabase.table('comments').select('*').eq('task_id', task['id']).order('created_at').execute()
                task['comments'] = comments_result.data or []
            
            week['tasks'] = tasks

        self._send_json(weeks)

    def _send_json(self, data, status=200):
        self.send_response(status)
        for key, value in get_cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
