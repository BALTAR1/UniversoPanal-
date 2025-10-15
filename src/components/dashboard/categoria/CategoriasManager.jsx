import { useState, useEffect } from 'react'; // Importa hooks de React para manejar el estado y efectos secundarios.
import DataTable from '../ui/DataTable.jsx'; // Componente para mostrar datos en formato de tabla.
import Modal from '../ui/Modal.jsx'; // Componente para mostrar un modal emergente.
import Button from '../ui/Button.jsx'; // Componente reutilizable para botones.
import { categoriasService } from '../../../services/apiServices.js'; // Servicio para realizar operaciones relacionadas con categorías en la API.

export default function CategoriasManager() {
    // Hook para manejar el estado de las categorías.
    const [categorias, setCategorias] = useState([]); // Almacena la lista de categorías obtenidas de la API.
    const [loading, setLoading] = useState(true); // Indica si los datos están cargando.
    const [modalOpen, setModalOpen] = useState(false); // Controla si el modal está abierto o cerrado.
    const [editingCategoria, setEditingCategoria] = useState(null); // Almacena la categoría que se está editando (si aplica).
    const [formData, setFormData] = useState({ // Almacena los datos del formulario para crear/editar categorías.
        nombre: '', // Campo para el nombre de la categoría.
        descripcion: '', // Campo para la descripción de la categoría.
    });

    // Define las columnas que se mostrarán en la tabla de categorías.
    const columns = [
        { key: 'categoria_id', label: 'ID' }, // Columna para el ID de la categoría.
        { key: 'nombre', label: 'Nombre' }, // Columna para el nombre de la categoría.
        { key: 'descripcion', label: 'Descripción' }, // Columna para la descripción de la categoría.
    ];

    // Hook para cargar los datos al montar el componente.
    useEffect(() => {
        cargarDatos(); // Llama a la función para cargar las categorías desde la API.
    }, []); // El array vacío asegura que esto se ejecute solo una vez al montar el componente.

    // Función para cargar las categorías desde la API.
    async function cargarDatos() {
        try {
            setLoading(true); // Activa el estado de carga.
            const data = await categoriasService.obtenerTodas(); // Llama al servicio para obtener todas las categorías.
            setCategorias(data); // Actualiza el estado con los datos obtenidos.
        } catch (error) {
            console.error('Error al cargar categorías:', error); // Muestra el error en la consola.
            alert('Error al cargar las categorías: ' + error.message); // Muestra una alerta al usuario.
        } finally {
            setLoading(false); // Desactiva el estado de carga.
        }
    }

    // Maneja los cambios en los campos del formulario.
    function handleInputChange(e) {
        const { name, value } = e.target; // Obtiene el nombre y valor del campo que cambió.
        setFormData((prev) => ({ ...prev, [name]: value })); // Actualiza el estado del formulario.
    }

    // Abre el modal para crear una nueva categoría.
    function handleCreate() {
        setEditingCategoria(null); // Resetea la categoría en edición.
        setFormData({ nombre: '', descripcion: '' }); // Limpia los datos del formulario.
        setModalOpen(true); // Abre el modal.
    }

    // Abre el modal para editar una categoría existente.
    function handleEdit(categoria) {
        setEditingCategoria(categoria); // Establece la categoría en edición.
        setFormData({
            nombre: categoria.nombre, // Rellena el formulario con el nombre de la categoría.
            descripcion: categoria.descripcion || '', // Rellena la descripción o la deja vacía si no existe.
        });
        setModalOpen(true); // Abre el modal.
    }

    // Elimina una categoría después de confirmar.
    async function handleDelete(categoria) {
        if (!confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`)) {
            return; // Si el usuario cancela, no hace nada.
        }

        try {
            await categoriasService.eliminar(categoria.categoria_id); // Llama al servicio para eliminar la categoría.
            alert('Categoría eliminada correctamente'); // Muestra un mensaje de éxito.
            cargarDatos(); // Recarga los datos para reflejar los cambios.
        } catch (error) {
            console.error('Error al eliminar categoría:', error); // Muestra el error en la consola.
            alert('Error al eliminar la categoría: ' + error.message); // Muestra una alerta al usuario.
        }
    }

    // Maneja el envío del formulario para crear o actualizar una categoría.
    async function handleSubmit(e) {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario.

        try {
            if (editingCategoria) {
                await categoriasService.actualizar(editingCategoria.categoria_id, formData); // Actualiza la categoría existente.
                alert('Categoría actualizada correctamente'); // Muestra un mensaje de éxito.
            } else {
                await categoriasService.crear(formData); // Crea una nueva categoría.
                alert('Categoría creada correctamente'); // Muestra un mensaje de éxito.
            }
            setModalOpen(false); // Cierra el modal.
            cargarDatos(); // Recarga los datos para reflejar los cambios.
        } catch (error) {
            console.error('Error al guardar categoría:', error); // Muestra el error en la consola.
            alert('Error al guardar la categoría: ' + error.message); // Muestra una alerta al usuario.
        }
    }

    // Muestra un indicador de carga mientras se obtienen los datos.
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div> {/* Indicador de carga animado. */}
            </div>
        );
    }

    // Renderiza el componente principal.
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Categorías</h2> {/* Título de la sección. */}
                <Button onClick={handleCreate}>+ Nueva Categoría</Button> {/* Botón para crear una nueva categoría. */}
            </div>

            <DataTable
                columns={columns} // Define las columnas de la tabla.
                data={categorias} // Proporciona los datos de las categorías.
                onEdit={handleEdit} // Define la función para editar una categoría.
                onDelete={handleDelete} // Define la función para eliminar una categoría.
            />

            <Modal
                isOpen={modalOpen} // Controla si el modal está abierto.
                onClose={() => setModalOpen(false)} // Define la función para cerrar el modal.
                title={editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'} // Título dinámico según el contexto.
            >
                <form onSubmit={handleSubmit} className="space-y-4"> {/* Formulario para crear/editar categorías. */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre} // Valor del campo "nombre".
                            onChange={handleInputChange} // Maneja los cambios en el campo.
                            required // Campo obligatorio.
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion} // Valor del campo "descripción".
                            onChange={handleInputChange} // Maneja los cambios en el campo.
                            rows={3} // Define el número de filas del textarea.
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={() => setModalOpen(false)} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingCategoria ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
