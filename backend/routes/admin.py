from flask import Blueprint, request, jsonify
from functools import wraps
import requests
import os

admin_bp = Blueprint('admin', __name__)

# Decorador para proteger rutas solo para el admin autenticado con Supabase Auth
def supabase_token_required(f):
    # wraps para preservar la informacion de la funcion original
    @wraps(f)
    # kwargs y args para aceptar cualquier numero de argumentos
    def decorated(*args, **kwargs):
        print("🔍 [DEBUG BACKEND] Verificando token...")
        token = None
        #si el token esta en los headers, lo obtenemos
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(' ')
            # Bearer para autenticacion con token JWT
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
                print(f"🎫 [DEBUG BACKEND] Token encontrado: {token[:20]}...")
        if not token:
            print("❌ [ERROR BACKEND] No se encontró token en headers")
            return jsonify({'error': 'Token requerido'}), 401

        # Verificamos el token con Supabase Auth
        supabase_url = os.getenv('SUPABASE_URL')
        print(f"🌐 [DEBUG BACKEND] SUPABASE_URL: {supabase_url}")
        
        headers = {'Authorization': f'Bearer {token}', 'apikey': os.getenv('SUPABASE_KEY')}
        try:
            # Llamada a la API de Supabase para verificar el token
            print(f"📡 [DEBUG BACKEND] Verificando token con Supabase...")
            user_response = requests.get(f'{supabase_url}/auth/v1/user', headers=headers)
            print(f"📊 [DEBUG BACKEND] Status code: {user_response.status_code}")
            print(f"📦 [DEBUG BACKEND] Respuesta: {user_response.text}")
            
            if user_response.status_code != 200:
                print(f"❌ [ERROR BACKEND] Token inválido o expirado")
                return jsonify({'error': 'Token inválido o expirado'}), 401

            # Verificamos si el usuario es admin (aquí asumimos que el admin es el primer usuario creado)
            user = user_response.json()
            print(f"👤 [DEBUG BACKEND] Usuario obtenido: {user.get('email')}")
            
            admin_email = os.getenv('ADMIN_EMAIL')
            print(f"👑 [DEBUG BACKEND] ADMIN_EMAIL configurado: {admin_email}")
            
            if not admin_email or user.get('email') != admin_email:
                print(f"⛔ [ERROR BACKEND] Usuario no autorizado como admin")
                return jsonify({'error': 'No autorizado'}), 403
            
            print(f"✅ [SUCCESS BACKEND] Autenticación exitosa")

        except requests.exceptions.RequestException as e:
            print(f"❌ [ERROR BACKEND] Excepción al verificar token: {str(e)}")
            return jsonify({'error': 'Error al verificar el token', 'details': str(e)}), 500

        # Si todo está bien, llamamos a la función original 
        return f(*args, **kwargs)
    return decorated