// Importa los hooks de React y componentes UI reutilizables
import { useState, useEffect, useMemo } from 'react';
import DataTable from '../../ui/DataTable.jsx'; // Tabla para mostrar productos
import Modal from '../../ui/Modal.jsx'; // Modal para formularios y vistas
import Button from '../../ui/Button.jsx'; // Botón reutilizable
import ImageUploader from '../../ui/ImageUploader.jsx'; // Componente para subir imágenes
import { productosService, categoriasService, productoImagenesService } from '../../../services/apiServices.js'; // Servicios API para productos, categorías e imágenes

// Componente principal para gestionar productos
export default function ProductosManager() {
    // Estados para almacenar datos y controlar la UI
    const [productos, setProductos] = useState([]); // Lista de productos
    const [productosFiltrados, setProductosFiltrados] = useState([]); // Lista filtrada
    const [busqueda, setBusqueda] = useState(''); // Término de búsqueda
    const [ordenId, setOrdenId] = useState('desc'); // Estado para ordenar por ID (desc = más nuevos primero)
    const [categorias, setCategorias] = useState([]); // Lista de categorías
    const [loading, setLoading] = useState(true); // Estado de carga
    const [modalOpen, setModalOpen] = useState(false); // Modal de formulario abierto/cerrado
    const [imageModalOpen, setImageModalOpen] = useState(false); // Modal de imagen abierto/cerrado
    const [selectedImage, setSelectedImage] = useState(null); // Imagen seleccionada para vista previa
    const [editingProducto, setEditingProducto] = useState(null); // Producto en edición
    
    // Estados para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [productosPorPagina] = useState(20); // Mostrar 20 productos por página
    
    // Estado para el formulario de producto
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
    const [imagenesProducto, setImagenesProducto] = useState([]); // Imágenes asociadas al producto

    // Definición de columnas para la tabla de productos
    const columns = [
        { key: 'producto_id', label: 'ID' }, // Identificador único
        {
            key: 'imagen_url',
            label: 'Imagen',
            // Renderiza la imagen principal y adicionales, permite vista previa
            render: (imageUrl, row) => {
                if (!imageUrl) return <span className="text-gray-400">Sin imagen</span>;
                
                const todasLasImagenes = [imageUrl];
                if (row.imagenes_adicionales && row.imagenes_adicionales.length > 0) {
                    todasLasImagenes.push(...row.imagenes_adicionales.map(img => img.url));
                }
                
                return (
                    <div className="flex items-center gap-1">
                        {todasLasImagenes.slice(0, 2).map((url) => (
                            <img
                                key={url}
                                src={url}
                                alt={`Producto ${url}`}
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
        { key: 'nombre', label: 'Nombre' }, // Nombre del producto
        { key: 'marca', label: 'Marca' }, // Marca
        { key: 'modelo', label: 'Modelo', render: (value) => value || '-' }, // Modelo (opcional)
        { 
            key: 'precio', 
            label: 'Precio', 
            // Formatea el precio en moneda local
            render: (value) => `$${parseFloat(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        },
        { 
            key: 'stock', 
            label: 'Stock',
            // Muestra el stock con color según cantidad
            render: (value) => {
                const stock = parseInt(value);
                let className = 'px-2 py-1 text-xs font-semibold rounded-full ';
                if (stock === 0) className += 'bg-red-100 text-red-800';
                else if (stock < 10) className += 'bg-yellow-100 text-yellow-800';
                else className += 'bg-green-100 text-green-800';
                return <span className={className}>{stock}</span>;
            }
        },
        { key: 'sku', label: 'SKU' }, // Código SKU
        {
            key: 'activo',
            label: 'Estado',
            // Indica si el producto está activo o inactivo
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
            // Indica si el producto es destacado
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    value ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'
                }`}>
                    {value ? '⭐ Destacado' : '-'}
                </span>
            )
        },
    ];

    // Carga los datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);

    // Filtra productos cuando cambia la búsqueda (con memoización para mejor rendimiento)
    useEffect(() => {
        let listaFiltrada = productos;
        
        // Aplicar búsqueda si hay texto
        if (busqueda.trim()) {
            const busquedaLower = busqueda.toLowerCase();
            listaFiltrada = productos.filter(producto =>
                producto.nombre?.toLowerCase().includes(busquedaLower) ||
                producto.marca?.toLowerCase().includes(busquedaLower) ||
                producto.modelo?.toLowerCase().includes(busquedaLower) ||
                producto.sku?.toLowerCase().includes(busquedaLower)
            );
        }
        
        // Aplicar ordenamiento por ID
        const listaOrdenada = [...listaFiltrada].sort((a, b) => {
            if (ordenId === 'desc') {
                return b.producto_id - a.producto_id; // Descendente (más nuevos primero)
            } else {
                return a.producto_id - b.producto_id; // Ascendente (más antiguos primero)
            }
        });
        
        setProductosFiltrados(listaOrdenada);
        setPaginaActual(1); // Resetear a página 1 cuando cambian los filtros
    }, [busqueda, productos, ordenId]);
    
    // Calcular productos de la página actual con useMemo para optimizar
    const productosPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * productosPorPagina;
        const fin = inicio + productosPorPagina;
        return productosFiltrados.slice(inicio, fin);
    }, [productosFiltrados, paginaActual, productosPorPagina]);
    
    // Calcular total de páginas
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

    // Función para cargar productos y categorías desde la API
    async function cargarDatos() {
        try {
            setLoading(true); // Muestra spinner de carga
            const [productosData, categoriasData] = await Promise.all([
                productosService.obtenerTodos(), // Obtiene productos
                categoriasService.obtenerTodas(), // Obtiene categorías
            ]);
            
            // Para cada producto, carga imágenes adicionales
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
            
            setProductos(productosConImagenes); // Actualiza estado de productos
            setCategorias(categoriasData); // Actualiza estado de categorías
        } catch (error) {
            alert('Error al cargar los datos: ' + error.message);
        } finally {
            setLoading(false); // Oculta spinner
        }
    }

    // Maneja cambios en los inputs del formulario
    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Abre el modal para crear un nuevo producto
    function handleCreate() {
        setEditingProducto(null); // No hay producto en edición
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
        setImagenesProducto([]); // Limpia imágenes
        setModalOpen(true); // Abre modal
    }

    // Abre el modal para editar un producto existente
    function handleEdit(producto) {
        setEditingProducto(producto); // Establece producto en edición
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
        
        // Carga imágenes principales y adicionales
        const imagenes = [];
        if (producto.imagen_url) {
            imagenes.push(producto.imagen_url);
        }
        if (producto.imagenes_adicionales && producto.imagenes_adicionales.length > 0) {
            imagenes.push(...producto.imagenes_adicionales.map(img => img.url || img));
        }
        setImagenesProducto(imagenes.filter(img => img)); // Actualiza estado de imágenes
        setModalOpen(true); // Abre modal
    }

    // Elimina un producto tras confirmación
    async function handleDelete(producto) {
        if (!confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
            return;
        }
        try {
            await productosService.eliminar(producto.producto_id); // Llama API para eliminar
            alert('Producto eliminado correctamente');
            cargarDatos(); // Refresca lista
        } catch (error) {
            alert('Error al eliminar el producto: ' + error.message);
        }
    }

    // Envía el formulario para crear o actualizar producto
    async function handleSubmit(e) {
        e.preventDefault();
        try {
            // Prepara datos para enviar
            const dataToSubmit = {
                ...formData,
                imagen_url: imagenesProducto[0] || formData.imagen_url, // Imagen principal
                precio: parseFloat(formData.precio),
                stock: parseInt(formData.stock),
                peso_kg: formData.peso_kg ? parseFloat(formData.peso_kg) : null,
                categoria_id: formData.categoria_id || null,
            };
            
            let productoId;
            
            if (editingProducto) {
                // Actualiza producto existente
                await productosService.actualizar(editingProducto.producto_id, dataToSubmit);
                productoId = editingProducto.producto_id;
                
                // Elimina imágenes adicionales existentes
                if (editingProducto.imagenes_adicionales && editingProducto.imagenes_adicionales.length > 0) {
                    await Promise.all(
                        editingProducto.imagenes_adicionales.map(img => 
                            productoImagenesService.eliminar(img.imagen_id)
                        )
                    );
                }
            } else {
                // Crea nuevo producto
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
            
            // Guarda imágenes adicionales (excepto la principal)
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
            setModalOpen(false); // Cierra modal
            cargarDatos(); // Refresca lista
        } catch (error) {
            alert('Error al guardar el producto: ' + error.message);
        }
    }

    // Agrega una imagen al estado cuando se sube
    function handleImagenAgregada(url) {
        setImagenesProducto(prev => [...prev, url]);
        if (imagenesProducto.length === 0) {
            setFormData(prev => ({ ...prev, imagen_url: url })); // Establece imagen principal
        }
    }

    // Elimina una imagen del estado
    function handleEliminarImagen(index) {
        const nuevasImagenes = imagenesProducto.filter((_, i) => i !== index);
        setImagenesProducto(nuevasImagenes);
        if (index === 0 && nuevasImagenes.length > 0) {
            setFormData(prev => ({ ...prev, imagen_url: nuevasImagenes[0] })); // Actualiza imagen principal
        } else if (nuevasImagenes.length === 0) {
            setFormData(prev => ({ ...prev, imagen_url: '' })); // Limpia imagen principal
        }
    }

    // Muestra spinner mientras carga datos
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Renderiza la UI principal
    return (
        <div>
            {/* Encabezado */}
            <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Gestión de Productos</h2>
                <p className="text-sm md:text-base text-gray-600 mt-1">Administra el catálogo completo de productos</p>
            </div>

            {/* Barra de acciones: Botón y Buscador */}
            <div className="flex flex-col md:flex-row gap-3 mb-4 md:mb-6">
                <Button onClick={handleCreate} className="w-full md:w-auto">
                    + Nuevo Producto
                </Button>
                
                {/* Selector de ordenamiento por ID */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Ordenar por ID:</label>
                    <select
                        value={ordenId}
                        onChange={(e) => setOrdenId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="desc">Descendente (más nuevos primero)</option>
                        <option value="asc">Ascendente (más antiguos primero)</option>
                    </select>
                </div>
                
                {/* Buscador */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, marca, modelo o SKU..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    />
                    <svg 
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {busqueda && (
                        <button
                            onClick={() => setBusqueda('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Información de productos y paginación */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{productosPaginados.length}</span> de{' '}
                    <span className="font-semibold">{productosFiltrados.length}</span> productos
                    {busqueda && <span> (filtrados de {productos.length} totales)</span>}
                </div>
                
                {/* Controles de paginación */}
                {totalPaginas > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            ← Anterior
                        </button>
                        
                        {/* Selector de página directa */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Página</span>
                            <select
                                value={paginaActual}
                                onChange={(e) => setPaginaActual(Number(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(page => (
                                    <option key={page} value={page}>
                                        {page}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-600">de {totalPaginas}</span>
                        </div>
                        
                        <button
                            onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </div>

            {/* Tabla de productos */}
            <DataTable
                columns={columns}
                data={productosPaginados}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modal de formulario para crear/editar producto */}
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
                        {/* Campo nombre */}
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

                        {/* Campo marca */}
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

                        {/* Campo modelo */}
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

                        {/* Campo SKU */}
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

                    {/* Campo descripción */}
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

                    {/* Sección precio e inventario */}
                    <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded mt-6">
                        <h4 className="font-semibold text-green-900 mb-2">Precio e Inventario</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Campo precio */}
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

                        {/* Campo stock */}
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

                        {/* Campo peso */}
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

                    {/* Campo categoría */}
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

                    {/* Sección imágenes */}
                    <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded mt-6">
                        <h4 className="font-semibold text-purple-900 mb-2">Imágenes del Producto</h4>
                    </div>

                    {/* Componente para subir y eliminar imágenes */}
                    <ImageUploader
                        onImageUploaded={handleImagenAgregada}
                        currentImages={imagenesProducto}
                        onDeleteImage={handleEliminarImagen}
                    />

                    {/* Estado del producto */}
                    <div className="mt-4 space-y-3">
                        {/* Checkbox activo */}
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
                        
                        {/* Checkbox destacado */}
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

                    {/* Botones de acción */}
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

            {/* Modal para vista previa de imagen */}
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
