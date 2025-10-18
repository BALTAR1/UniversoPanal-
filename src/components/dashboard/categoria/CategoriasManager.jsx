// Importa los hooks de React para manejar estado y efectos secundarios
import { useState, useEffect } from 'react';
// Importa el componente de tabla reutilizable para mostrar datos
import DataTable from '../../ui/DataTable.jsx';
// Importa el componente Modal para formularios emergentes
import Modal from '../../ui/Modal.jsx';
// Importa el componente Button para botones estilizados
import Button from '../../ui/Button.jsx';
// Importa el servicio de categorías para interactuar con la API
import { categoriasService } from '../../../services/apiServices.js';

// Componente principal para gestionar categorías
export default function CategoriasManager() {
    // Estado para almacenar la lista de categorías
    const [categorias, setCategorias] = useState([]);
    // Estado para mostrar el spinner de carga
    const [loading, setLoading] = useState(true);
    // Estado para controlar la apertura/cierre del modal
    const [modalOpen, setModalOpen] = useState(false);
    // Estado para saber si se está editando una categoría (null si es nueva)
    const [editingCategoria, setEditingCategoria] = useState(null);
    // Estado para los datos del formulario (crear/editar)
    const [formData, setFormData] = useState({
        nombre: '', // Nombre de la categoría
        descripcion: '', // Descripción de la categoría
        activo: true, // Estado de visibilidad en la tienda
    });

    // Configuración de las columnas para la tabla de categorías
    const columns = [
        { key: 'categoria_id', label: 'ID' }, // Muestra el ID único de la categoría
        { key: 'nombre', label: 'Nombre' }, // Muestra el nombre de la categoría
        { 
            key: 'descripcion', // Muestra la descripción o un placeholder si está vacía
            label: 'Descripción',
            render: (value) => value || <span className="text-gray-400">Sin descripción</span>
        },
        {
            key: 'activo', // Muestra el estado activo/inactivo con badge de color
            label: 'Estado',
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    value 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {value ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'created_at', // Muestra la fecha de creación en formato local
            label: 'Creado',
            render: (value) => value ? new Date(value).toLocaleDateString('es-AR') : '-'
        },
    ];

    // Efecto que carga las categorías al montar el componente
    useEffect(() => {
        cargarDatos(); // Llama a la función para cargar las categorías desde la API
    }, []); // Solo se ejecuta una vez al montar

    // Función asíncrona para cargar las categorías desde la API
    async function cargarDatos() {
        try {
            setLoading(true); // Activa el spinner de carga
            const data = await categoriasService.obtenerTodas(); // Obtiene todas las categorías desde el backend
            setCategorias(data); // Actualiza el estado con los datos obtenidos
        } catch (error) {
            console.error('Error al cargar categorías:', error); // Muestra el error en consola
            alert('Error al cargar las categorías: ' + error.message); // Alerta al usuario
        } finally {
            setLoading(false); // Desactiva el spinner
        }
    }

    // Maneja los cambios en los campos del formulario
    function handleInputChange(e) {
        const { name, value } = e.target; // Obtiene el nombre y valor del campo
        setFormData((prev) => ({ ...prev, [name]: value })); // Actualiza el estado del formulario
    }

    // Abre el modal para crear una nueva categoría
    function handleCreate() {
        setEditingCategoria(null); // No hay categoría en edición
        setFormData({ 
            nombre: '', // Limpia el campo nombre
            descripcion: '', // Limpia la descripción
            activo: true, // Por defecto activa
        });
        setModalOpen(true); // Abre el modal
    }

    // Abre el modal para editar una categoría existente
    function handleEdit(categoria) {
        setEditingCategoria(categoria); // Establece la categoría en edición
        setFormData({
            nombre: categoria.nombre, // Rellena el nombre
            descripcion: categoria.descripcion || '', // Rellena la descripción
            activo: categoria.activo !== undefined ? categoria.activo : true, // Estado activo
        });
        setModalOpen(true); // Abre el modal
    }

    // Elimina una categoría después de confirmar
    async function handleDelete(categoria) {
        if (!confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`)) {
            return; // Si el usuario cancela, no hace nada
        }

        try {
            await categoriasService.eliminar(categoria.categoria_id); // Elimina la categoría por ID
            alert('Categoría eliminada correctamente'); // Mensaje de éxito
            cargarDatos(); // Recarga los datos
        } catch (error) {
            console.error('Error al eliminar categoría:', error); // Error en consola
            alert('Error al eliminar la categoría: ' + error.message); // Alerta al usuario
        }
    }

    // Maneja el envío del formulario para crear o actualizar una categoría
    async function handleSubmit(e) {
        e.preventDefault(); // Previene el comportamiento por defecto

        try {
            if (editingCategoria) {
                await categoriasService.actualizar(editingCategoria.categoria_id, formData); // Actualiza la categoría existente
                alert('Categoría actualizada correctamente'); // Mensaje de éxito
            } else {
                await categoriasService.crear(formData); // Crea una nueva categoría
                alert('Categoría creada correctamente'); // Mensaje de éxito
            }
            setModalOpen(false); // Cierra el modal
            cargarDatos(); // Recarga los datos
        } catch (error) {
            console.error('Error al guardar categoría:', error); // Error en consola
            alert('Error al guardar la categoría: ' + error.message); // Alerta al usuario
        }
    }

    // Si está cargando, muestra un spinner animado
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div> {/* Spinner de carga */}
            </div>
        );
    }

    // Renderiza el componente principal del manager de categorías
    return (
        <div>
            {/* Header con título y botón de nueva categoría */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Categorías</h2> {/* Título de la sección */}
                <Button onClick={handleCreate}>+ Nueva Categoría</Button> {/* Botón para crear */}
            </div>

            {/* Tabla de categorías con acciones de editar/eliminar */}
            <DataTable
                columns={columns} // Configuración de columnas
                data={categorias} // Datos de la API
                onEdit={handleEdit} // Acción editar
                onDelete={handleDelete} // Acción eliminar
            />

            {/* Modal para crear/editar categoría */}
            <Modal
                isOpen={modalOpen} // Estado de apertura
                onClose={() => setModalOpen(false)} // Acción cerrar
                title={editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'} // Título dinámico
            >
                <form onSubmit={handleSubmit} className="space-y-4"> {/* Formulario de categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre} // Valor del campo nombre
                            onChange={handleInputChange} // Actualiza estado
                            required // Campo obligatorio
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion} // Valor del campo descripción
                            onChange={handleInputChange} // Actualiza estado
                            rows={3}
                            placeholder="Descripción detallada de la categoría (opcional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="activo"
                                checked={formData.activo} // Estado activo/inactivo
                                onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))} // Actualiza estado
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Categoría activa (visible en la tienda)
                            </span>
                        </label>
                    </div>

                    {/* Botones de acción del formulario */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <Button variant="outline" onClick={() => setModalOpen(false)} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingCategoria ? 'Actualizar Categoría' : 'Crear Categoría'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
