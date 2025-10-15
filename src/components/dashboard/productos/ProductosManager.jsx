// Importa los 'hooks' useState y useEffect desde React.
import { useState, useEffect } from 'react';

// Importa componentes de UI personalizados.
import DataTable from '../ui/DataTable.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ImageUploader from '../ui/ImageUploader.jsx';

// Importa los servicios de la API.
import { productosService, categoriasService, productoImagenesService } from '../../../services/apiServices.js';

export default function ProductosManager() {
    // ---- ESTADOS DEL COMPONENTE ----
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProducto, setEditingProducto] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        sku: '',
        stock: '',
        categoria_id: '',
        imagen_url: '', // Imagen principal (primera del array)
        peso_kg: '',
        activo: true,
        marca: '',
        modelo: '',
    });

    // --- NUEVO ESTADO ---
    // Almacena un array de URLs de imágenes para el producto. Cada producto puede tener múltiples imágenes.
    const [imagenesProducto, setImagenesProducto] = useState([]);
    
    // Almacena la URL de la imagen que se va a mostrar en grande. `null` si ninguna está ampliada.
    const [enlargedImageUrl, setEnlargedImageUrl] = useState(null);


    // ---- CONFIGURACIÓN DE LA TABLA ----
    // Se modifica la columna 'imagen_url' para renderizar la imagen y hacerla clickeable.
    const columns = [
        { key: 'producto_id', label: 'ID' },
        // --- COLUMNA DE IMÁGENES ---
        {
            key: 'imagen_url',
            label: 'Imágenes',
            render: (imageUrl, row) => {
                if (!imageUrl) return <span className="text-gray-400">N/A</span>;
                
                // Combinar imagen principal + imágenes adicionales
                const todasLasImagenes = [imageUrl];
                if (row.imagenes_adicionales && row.imagenes_adicionales.length > 0) {
                    todasLasImagenes.push(...row.imagenes_adicionales.map(img => img.url));
                }
                
                return (
                    <div className="flex items-center gap-1">
                        {/* Mostrar hasta 3 miniaturas */}
                        {todasLasImagenes.slice(0, 3).map((url, idx) => (
                            <img
                                key={idx}
                                src={url}
                                alt={`Producto ${idx + 1}`}
                                className="h-12 w-12 object-cover rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => setEnlargedImageUrl(url)}
                            />
                        ))}
                        {/* Badge si hay más de 3 imágenes */}
                        {todasLasImagenes.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                +{todasLasImagenes.length - 3}
                            </span>
                        )}
                    </div>
                );
            },
        },
        { key: 'nombre', label: 'Nombre' },
        { key: 'precio', label: 'Precio', render: (value) => `$${value}` },
        { key: 'stock', label: 'Stock' },
        { key: 'marca', label: 'Marca' },
        { key: 'modelo', label: 'Modelo' },
    ];

    // ---- EFECTOS SECUNDARIOS ----
    useEffect(() => {
        cargarDatos();
    }, []);

    // ---- FUNCIONES ----
    async function cargarDatos() {
        try {
            setLoading(true);
            const [productosData, categoriasData] = await Promise.all([
                productosService.obtenerTodos(),
                categoriasService.obtenerTodas(),
            ]);
            
            // Para cada producto, obtener sus imágenes adicionales
            const productosConImagenes = await Promise.all(
                productosData.map(async (producto) => {
                    try {
                        const imagenes = await productoImagenesService.obtenerPorProducto(producto.producto_id);
                        return {
                            ...producto,
                            imagenes_adicionales: imagenes || []
                        };
                    } catch (error) {
                        console.warn(`No se pudieron cargar imágenes para producto ${producto.producto_id}`);
                        return {
                            ...producto,
                            imagenes_adicionales: []
                        };
                    }
                })
            );
            
            setProductos(productosConImagenes);
            setCategorias(categoriasData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            alert('Error al cargar los datos: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    function handleCreate() {
        setEditingProducto(null);
        setFormData({
            nombre: '',
            descripcion: '',
            precio: '',
            sku: '',
            stock: '',
            categoria_id: '',
            imagen_url: '',
            peso_kg: '',
            activo: true,
            marca: '',
            modelo: '',
        });
        setImagenesProducto([]); // Limpia el array de imágenes
        setModalOpen(true);
    }

    function handleEdit(producto) {
        setEditingProducto(producto);
        setFormData({
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio: producto.precio,
            sku: producto.sku,
            stock: producto.stock,
            categoria_id: producto.categoria_id,
            imagen_url: producto.imagen_url || '',
            peso_kg: producto.peso_kg || '',
            activo: producto.activo !== undefined ? producto.activo : true,
            marca: producto.marca || '',
            modelo: producto.modelo || '',
        });
        // Carga las imágenes: imagen principal + imágenes adicionales de la tabla producto_imagenes
        const imagenes = [];
        if (producto.imagen_url) {
            imagenes.push(producto.imagen_url);
        }
        if (producto.imagenes_adicionales && producto.imagenes_adicionales.length > 0) {
            // Las imágenes adicionales vienen de la tabla producto_imagenes con estructura {imagen_id, producto_id, url, descripcion}
            imagenes.push(...producto.imagenes_adicionales.map(img => img.url || img));
        }
        setImagenesProducto(imagenes.filter(img => img)); // Filtra valores vacíos
        setModalOpen(true);
    }

    async function handleDelete(producto) {
        if (!confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
            return;
        }
        try {
            await productosService.eliminar(producto.producto_id);
            alert('Producto eliminado correctamente');
            cargarDatos();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('Error al eliminar el producto: ' + error.message);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            // Prepara los datos del producto (sin imagenes_adicionales, solo imagen_url principal)
            const dataToSubmit = {
                ...formData,
                imagen_url: imagenesProducto[0] || formData.imagen_url, // Primera imagen como principal
            };
            
            let productoId;
            
            if (editingProducto) {
                // ACTUALIZAR PRODUCTO EXISTENTE
                await productosService.actualizar(editingProducto.producto_id, dataToSubmit);
                productoId = editingProducto.producto_id;
                
                // Eliminar todas las imágenes adicionales existentes
                if (editingProducto.imagenes_adicionales && editingProducto.imagenes_adicionales.length > 0) {
                    await Promise.all(
                        editingProducto.imagenes_adicionales.map(img => 
                            productoImagenesService.eliminar(img.imagen_id)
                        )
                    );
                }
            } else {
                // CREAR PRODUCTO NUEVO
                const response = await productosService.crear(dataToSubmit);
                console.log('Respuesta del servidor al crear producto:', response);
                
                // Intentar obtener el ID del producto de diferentes maneras
                productoId = response?.producto_id || 
                             response?.id || 
                             response?.data?.producto_id ||
                             response?.data?.id ||
                             response?.data?.[0]?.producto_id ||
                             response?.[0]?.producto_id;
                
                if (!productoId) {
                    console.error('Respuesta completa del servidor:', JSON.stringify(response, null, 2));
                    throw new Error('No se pudo obtener el ID del producto creado. Verifica la respuesta del servidor.');
                }
                
                console.log('ID del producto creado:', productoId);
            }
            
            // Guardar imágenes adicionales (todas excepto la primera que ya está en imagen_url)
            const imagenesAdicionales = imagenesProducto.slice(1);
            if (imagenesAdicionales.length > 0) {
                await Promise.all(
                    imagenesAdicionales.map((url, index) => 
                        productoImagenesService.agregar({
                            producto_id: productoId,
                            url: url,
                            descripcion: `Imagen ${index + 2}` // Descripción opcional
                        })
                    )
                );
            }
            
            alert(editingProducto ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
            setModalOpen(false);
            cargarDatos();
        } catch (error) {
            console.error('Error al guardar producto:', error);
            alert('Error al guardar el producto: ' + error.message);
        }
    }

    /**
     * Agrega una nueva imagen al array de imágenes del producto.
     * @param {string} url - URL de la imagen subida.
     */
    function handleImagenAgregada(url) {
        setImagenesProducto(prev => [...prev, url]);
        // Si es la primera imagen, actualiza también imagen_url en formData
        if (imagenesProducto.length === 0) {
            setFormData(prev => ({ ...prev, imagen_url: url }));
        }
    }

    /**
     * Elimina una imagen del array de imágenes.
     * @param {number} index - Índice de la imagen a eliminar.
     */
    function handleEliminarImagen(index) {
        const nuevasImagenes = imagenesProducto.filter((_, i) => i !== index);
        setImagenesProducto(nuevasImagenes);
        // Si se elimina la primera imagen, actualiza imagen_url en formData
        if (index === 0 && nuevasImagenes.length > 0) {
            setFormData(prev => ({ ...prev, imagen_url: nuevasImagenes[0] }));
        } else if (nuevasImagenes.length === 0) {
            setFormData(prev => ({ ...prev, imagen_url: '' }));
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Cabecera y botón de crear */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
                <Button onClick={handleCreate}>+ Nuevo Producto</Button>
            </div>

            {/* Tabla de productos */}
            <DataTable
                columns={columns}
                data={productos}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modal del formulario de edición/creación */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo para el nombre del producto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Campo para la descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Campo para el SKU */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU (Código) *
                        </label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleInputChange}
                            required
                            placeholder="Ej: IP15PM-256-BLK"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Grid para precio y stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio *
                            </label>
                            <input
                                type="number"
                                name="precio"
                                value={formData.precio}
                                onChange={handleInputChange}
                                required
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock *
                            </label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleInputChange}
                                required
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Campo para el peso */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Peso (kg) *
                            </label>
                            <input
                                type="number"
                                name="peso_kg"
                                value={formData.peso_kg}
                                onChange={handleInputChange}
                                required
                                step="0.001"
                                min="0"
                                placeholder="0.500"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* --- SECCIÓN DE IMÁGENES MÚLTIPLES --- */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imágenes del Producto *
                        </label>
                        
                        {/* Componente para subir nueva imagen */}
                        <div className="mb-4">
                            <ImageUploader
                                currentImageUrl={null}
                                onImageUploaded={handleImagenAgregada}
                            />
                        </div>

                        {/* Galería de imágenes cargadas */}
                        {imagenesProducto.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Imágenes cargadas ({imagenesProducto.length})
                                    {imagenesProducto.length > 0 && <span className="ml-2 text-blue-600">(La primera será la imagen principal)</span>}
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {imagenesProducto.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Producto ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-all"
                                                onClick={() => setEnlargedImageUrl(url)}
                                            />
                                            {/* Badge de imagen principal */}
                                            {index === 0 && (
                                                <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                                                    Principal
                                                </span>
                                            )}
                                            {/* Botón para eliminar */}
                                            <button
                                                type="button"
                                                onClick={() => handleEliminarImagen(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                title="Eliminar imagen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Campo oculto para validación */}
                        <input
                            type="hidden"
                            value={imagenesProducto.length > 0 ? imagenesProducto[0] : ''}
                            required
                        />
                    </div>

                    {/* Campo para seleccionar categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría *
                        </label>
                        <select
                            name="categoria_id"
                            value={formData.categoria_id}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Selecciona una categoría</option>
                            {categorias.map((cat) => (
                                <option key={cat.categoria_id} value={cat.categoria_id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grid para marca y modelo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marca
                            </label>
                            <input
                                type="text"
                                name="marca"
                                value={formData.marca}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Modelo
                            </label>
                            <input
                                type="text"
                                name="modelo"
                                value={formData.modelo}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            type="button"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingProducto ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </Modal>
            
            {/* --- NUEVO --- */}
            {/* Modal para mostrar la imagen ampliada */}
            {enlargedImageUrl && (
                // Contenedor del modal (overlay)
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
                    // Al hacer clic en el fondo, se cierra la imagen.
                    onClick={() => setEnlargedImageUrl(null)}
                >
                    {/* Contenedor de la imagen para evitar que el clic en la imagen cierre el modal */}
                    <div className="relative p-4">
                        <img
                            src={enlargedImageUrl}
                            alt="Producto Ampliado"
                            className="max-w-4xl max-h-[80vh] rounded-lg shadow-lg"
                            // Detiene la propagación del clic para que no llegue al fondo.
                            onClick={(e) => e.stopPropagation()}
                        />
                         {/* Botón para cerrar */}
                        <button 
                            onClick={() => setEnlargedImageUrl(null)}
                            className="absolute top-0 right-0 mt-2 mr-2 text-white bg-black bg-opacity-50 rounded-full p-2 leading-none"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}