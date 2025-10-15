from flask import Blueprint, request, jsonify
from supabase_client import supabase

categoria_bp = Blueprint('categoria', __name__)

# =========================
# Endpoint: Listar todas las categorías
# =========================
@categoria_bp.route('/categorias', methods=['GET'])
def listar_categorias():
    try:
        response = supabase.table('categorias').select('*').execute()
        print("DEBUG: Respuesta de Supabase (categorias):", response.data)  # Log para verificar datos
        return jsonify(response.data), 200
    except Exception as e:
        print("ERROR (categorias):", str(e))  # Log para errores
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Obtener categoría por ID
# =========================
@categoria_bp.route('/categorias/<int:categoria_id>', methods=['GET'])
def obtener_categoria(categoria_id):
    try:
        response = supabase.table('categorias').select('*').eq('categoria_id', categoria_id).execute()
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Categoría no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Crear categoría
# =========================
@categoria_bp.route('/categorias', methods=['POST'])
def crear_categoria():
    data = request.get_json()
    required_fields = ['nombre', 'activo']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'El campo {field} es obligatorio'}), 400
    if not isinstance(data['nombre'], str) or not data['nombre'].strip():
        return jsonify({'error': 'El nombre debe ser un texto no vacío'}), 400
    if not isinstance(data['activo'], bool):
        return jsonify({'error': 'El campo activo debe ser booleano'}), 400
    # descripcion es opcional
    categoria = {
        'nombre': data['nombre'],
        'descripcion': data.get('descripcion', None),
        'activo': data['activo']
    }
    try:
        response = supabase.table('categorias').insert(categoria).execute()
        if response.data:
            return jsonify({'msg': 'Categoría creada exitosamente'}), 201
        else:
            return jsonify({'error': 'Error al crear la categoría'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Actualizar categoría por ID
# =========================
@categoria_bp.route('/categorias/<int:categoria_id>', methods=['PUT'])
def actualizar_categoria(categoria_id):
    data = request.get_json()
    data.pop('categoria_id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    try:
        response = supabase.table('categorias').update(data).eq('categoria_id', categoria_id).execute()
        if response.data:
            return jsonify({'msg': 'Categoría actualizada'}), 200
        else:
            return jsonify({'error': 'Categoría no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Eliminar categoría por ID (hard delete)
# =========================
@categoria_bp.route('/categorias/<int:categoria_id>', methods=['DELETE'])
def eliminar_categoria(categoria_id):
    try:
        # Hard delete: elimina completamente la categoría
        response = supabase.table('categorias').delete().eq('categoria_id', categoria_id).execute()
        if response.data:
            return jsonify({'msg': 'Categoría eliminada correctamente'}), 200
        else:
            return jsonify({'error': 'Categoría no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
