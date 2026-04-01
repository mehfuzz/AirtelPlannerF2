import os
import json
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from http.cookies import SimpleCookie
from supabase import create_client, Client

# Supabase client
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret')
JWT_ALGORITHM = "HS256"

def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    }

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except:
        return None

def get_user_from_request(request):
    # Try cookie first
    cookie_header = request.headers.get('cookie', '')
    cookies = SimpleCookie()
    cookies.load(cookie_header)
    
    token = None
    if 'access_token' in cookies:
        token = cookies['access_token'].value
    
    # Try Authorization header
    if not token:
        auth_header = request.headers.get('authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
    
    if not token:
        return None
    
    payload = verify_token(token)
    if not payload:
        return None
    
    # Get user from Supabase
    result = supabase.table('users').select('*').eq('id', payload['sub']).execute()
    if result.data:
        user = result.data[0]
        return {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'role': user['role']
        }
    return None

def json_response(data, status=200, headers=None):
    response_headers = get_cors_headers()
    if headers:
        response_headers.update(headers)
    return {
        'statusCode': status,
        'headers': response_headers,
        'body': json.dumps(data)
    }

def error_response(message, status=400):
    return json_response({'detail': message}, status)
