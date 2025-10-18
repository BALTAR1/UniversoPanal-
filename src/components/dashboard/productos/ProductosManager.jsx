import { useState, useEffect } from 'react';
import DataTable from '../../ui/DataTable.jsx';
import Modal from '../../ui/Modal.jsx';
import Button from '../../ui/Button.jsx';
import ImageUploader from '../../ui/ImageUploader.jsx';
import { productosService, categoriasService, productoImagenesService } from '../../../services/apiServices.js';

export default function ProductosManager() {
    // Estados
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingProducto, setEditingProducto] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        marca: '',
        modelo: '',
        descripcion: '',
        precio: '',
        sku: '',
        stock: '',
        categoria_id: '',
        imagen_url: '',
        peso_kg: '',
        activo: true,
        es_destacado: false,
    });
    const [imagenesProducto, setImagenesProducto] = useState([]);

    // Columnas de la tabla
    const columns = [
        { key: 'producto_id', label: 'ID' },
        {
            key: 'imagen_url',
            label: 'Imagen',
            render: (imageUrl, row) => {
                if (!imageUrl) return <span className="text-gray-400">Sin imagen</span>;
                
                const todasLasImagenes = [imageUrl];
                if (row.imagenes_adicionales && row.imagenes_adicionales.length > 0) {
                    todasLasImagenes.push(...row.imagenes_adicionales.map(img => img.url));
                }
                
                return (
                    <div className="flex items-center gap-1">
                        {todasLasImagenes.slice(0, 2).map((url, idx) => (
                            <img
                                key={idx}
                                src={url}
                                alt={`Producto ${idx + 1}`}
                                className="h-10 w-10 object-cover rounded border border-gray-200 cursor-pointer hover:scale-150 transition-transform"
                                onClick={() => {
                                    setSelectedImage(url);
                                    setImageModalOpen(true);
                                }}
                            />
                        ))}
                        {todasLasImagenes.length > 2 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                +{todasLasImagenes.length - 2}
                            </span>
                        )}
                    </div>
                );
            },
        },
        { key: 'nombre', label: 'Nombre' },
        { key: 'marca', label: 'Marca' },
        { key: 'modelo', label: 'Modelo', render: (value) => value || '-' },
        { 
            key: 'precio', 
            label: 'Precio', 
            render: (value) => `$${parseFloat(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        },
        { 
            key: 'stock', 
            label: 'Stock',
            render: (value) => {
                const stock = parseInt(value);
                let className = 'px-2 py-1 text-xs font-semibold rounded-full ';
                if (stock === 0) className += 'bg-red-100 text-red-800';
                else if (stock < 10) className += 'bg-yellow-100 text-yellow-800';
                else className += 'bg-green-100 text-green-800';
                return <span className={className}>{stock}</span>;
            }
        },
        { key: 'sku', label: 'SKU' },
        {
            key: 'activo',
            label: 'Estado',
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {value ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'es_destacado',
            label: 'Destacado',
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    value ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'
                }`}>
                    {value ? '⭐ Destacado' : '-'}
                </span>
            )
        },
    ];

    // Cargar datos al montar
    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            setLoading(true);
            const [productosData, categoriasData] = await Promise.all([
                productosService.obtenerTodos(),
                categoriasService.obtenerTodas(),
            ]);
            
            // Cargar imágenes adicionales para cada producto
            const productosConImagenes = await Promise.all(
                productosData.map(async (producto) => {
                    try {
                        const imagenes = await productoImagenesService.obtenerPorProducto(producto.producto_id);
                        return {
                            ...producto,
                            imagenes_adicionales: imagenes || []
                        };
                    } catch (error) {
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
            marca: '',
            modelo: '',
            descripcion: '',
            precio: '',
            sku: '',
            stock: '',
            categoria_id: '',
            imagen_url: '',
            peso_kg: '',
            activo: true,
            es_destacado: false,
        });
        setImagenesProducto([]);
        setModalOpen(true);
    }

    function handleEdit(producto) {
        setEditingProducto(producto);
        setFormData({
            nombre: producto.nombre,
            marca: producto.marca || '',
            modelo: producto.modelo || '',
            descripcion: producto.descripcion || '',
            precio: producto.precio,
            sku: producto.sku,
            stock: producto.stock,
            categoria_id: producto.categoria_id || '',
            imagen_url: producto.imagen_url || '',
            peso_kg: producto.peso_kg || '',
            activo: producto.activo !== undefined ? producto.activo : true,
            es_destacado: producto.es_destacado || false,
        });
        
        // Cargar imágenes
        const imagenes = [];
        if (producto.imagen_url) {
            imagenes.push(producto.imagen_url);
        }
        if (producto.imagenes_adicionales && producto.imagenes_adicionales.length > 0) {
            imagenes.push(...producto.imagenes_adicionales.map(img => img.url || img));
        }
        setImagenesProducto(imagenes.filter(img => img));
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
            const dataToSubmit = {
                ...formData,
                imagen_url: imagenesProducto[0] || formData.imagen_url,
                precio: parseFloat(formData.precio),
                stock: parseInt(formData.stock),
                peso_kg: formData.peso_kg ? parseFloat(formData.peso_kg) : null,
                categoria_id: formData.categoria_id || null,
            };
            
            let productoId;
            
            if (editingProducto) {
                await productosService.actualizar(editingProducto.producto_id, dataToSubmit);
                productoId = editingProducto.producto_id;
                
                // Eliminar imágenes adicionales existentes
                if (editingProducto.imagenes_adicionales && editingProducto.imagenes_adicionales.length > 0) {
                    await Promise.all(
                        editingProducto.imagenes_adicionales.map(img => 
                            productoImagenesService.eliminar(img.imagen_id)
                        )
                    );
                }
            } else {
                const response = await productosService.crear(dataToSubmit);
                productoId = response?.producto_id || 
                             response?.id || 
                             response?.data?.producto_id ||
                             response?.data?.id ||
                             response?.data?.[0]?.producto_id ||
                             response?.[0]?.producto_id;
                
                if (!productoId) {
                    throw new Error('No se pudo obtener el ID del producto creado');
                }
            }
            
            // Guardar imágenes adicionales
            const imagenesAdicionales = imagenesProducto.slice(1);
            if (imagenesAdicionales.length > 0) {
                await Promise.all(
                    imagenesAdicionales.map((url, index) => 
                        productoImagenesService.agregar({
                            producto_id: productoId,
                            url: url,
                            descripcion: `Imagen ${index + 2}`
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

    function handleImagenAgregada(url) {
        setImagenesProducto(prev => [...prev, url]);
        if (imagenesProducto.length === 0) {
            setFormData(prev => ({ ...prev, imagen_url: url }));
        }
    }

    function handleEliminarImagen(index) {
        const nuevasImagenes = imagenesProducto.filter((_, i) => i !== index);
        setImagenesProducto(nuevasImagenes);
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
                    <p className="text-gray-600 mt-1">Administra el catálogo completo de productos</p>
                </div>
                <Button onClick={handleCreate}>+ Nuevo Producto</Button>
            </div>

            <DataTable
                columns={columns}
                data={productos}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modal de formulario */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Información Básica */}
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                        <h4 className="font-semibold text-blue-900 mb-2">Información Básica</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Producto *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                required
                                placeholder="Ej: Pañales Pampers Premium Care"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marca *
                            </label>
                            <input
                                type="text"
                                name="marca"
                                value={formData.marca}
                                onChange={handleInputChange}
                                required
                                placeholder="Ej: Pampers, Huggies, Chicco"
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
                                placeholder="Ej: Premium Care, Soft Touch"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

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
                                placeholder="Ej: PAM-PC-RNP-36"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Describe las características del producto..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Precio e Inventario */}
                    <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded mt-6">
                        <h4 className="font-semibold text-green-900 mb-2">Precio e Inventario</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <input
                                    type="number"
                                    name="precio"
                                    value={formData.precio}
                                    onChange={handleInputChange}
                                    required
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock Disponible *
                            </label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleInputChange}
                                required
                                min="0"
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Peso (kg)
                            </label>
                            <input
                                type="number"
                                name="peso_kg"
                                value={formData.peso_kg}
                                onChange={handleInputChange}
                                step="0.001"
                                min="0"
                                placeholder="0.000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                        </label>
                        <select
                            name="categoria_id"
                            value={formData.categoria_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Sin categoría</option>
                            {categorias.filter(cat => cat.activo).map(cat => (
                                <option key={cat.categoria_id} value={cat.categoria_id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Imágenes */}
                    <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded mt-6">
                        <h4 className="font-semibold text-purple-900 mb-2">Imágenes del Producto</h4>
                    </div>

                    <ImageUploader
                        onImageUploaded={handleImagenAgregada}
                        currentImages={imagenesProducto}
                        onDeleteImage={handleEliminarImagen}
                    />

                    {/* Estado */}
                    <div className="mt-4 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.activo}
                                onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Producto activo (visible en la tienda)
                            </span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.es_destacado}
                                onChange={(e) => setFormData(prev => ({ ...prev, es_destacado: e.target.checked }))}
                                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                            />
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                ⭐ Producto destacado (aparece en la página de inicio)
                            </span>
                        </label>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <Button variant="outline" onClick={() => setModalOpen(false)} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingProducto ? 'Actualizar Producto' : 'Crear Producto'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal de visualización de imagen */}
            <Modal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                title="Vista Previa de Imagen"
                size="lg"
            >
                {selectedImage && (
                    <img
                        src={selectedImage}
                        alt="Vista previa"
                        className="w-full h-auto rounded-lg"
                    />
                )}
            </Modal>
        </div>
    );
}
