// Importa los hooks de React para manejar estado y efectos secundarios
import { useState, useEffect, useMemo, useRef } from 'react';
// Importa el componente de tabla para mostrar combos
import DataTable from '../../ui/DataTable.jsx';
// Importa el componente Modal para formularios emergentes
import Modal from '../../ui/Modal.jsx';
// Importa el componente Button para botones reutilizables
import Button from '../../ui/Button.jsx';
// Importa el componente para subir imágenes
import ImageUploader from '../../ui/ImageUploader.jsx';
// Importa el servicio para interactuar con la API de combos
import { combosService } from '../../../services/combosService.js';
// Importa el servicio para interactuar con la API de productos
import { productosService } from '../../../services/apiServices.js';

// Componente principal para la gestión de combos
export default function CombosManager() {
    // Estado para la lista de combos
    const [combos, setCombos] = useState([]);
    // Estado para la lista de productos disponibles
    const [productos, setProductos] = useState([]);
    // Estado para mostrar spinner de carga
    const [loading, setLoading] = useState(true);
    // Estado para mostrar/ocultar el modal de edición/creación
    const [modalOpen, setModalOpen] = useState(false);
    // Estado para saber si se está editando un combo existente
    const [editingCombo, setEditingCombo] = useState(null);
    // Estado para el formulario del combo (datos a crear/editar)
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio_combo: '',
        imagen_url: '',
        activo: true,
        fecha_inicio: '',
        fecha_fin: ''
    });
    // Estado para los productos seleccionados en el combo
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    // Estado para las imágenes del combo
    const [imagenesCombo, setImagenesCombo] = useState([]);
    // Estado para la búsqueda de productos
    const [busquedaProducto, setBusquedaProducto] = useState('');
    // Estado para controlar cuántos productos se muestran (lazy loading)
    const [productosVisibles, setProductosVisibles] = useState(50);
    // Estado para mostrar/ocultar la lista de productos
    const [mostrarListaProductos, setMostrarListaProductos] = useState(false);
    // Estado para saber qué producto está siendo editado
    const [productoEditandoIndex, setProductoEditandoIndex] = useState(null);
    // Referencias para el selector de productos
    const searchRef = useRef(null);
    const listRef = useRef(null);
    
    // Definición de las columnas para la tabla de combos
    const columns = [
        { key: 'combo_id', label: 'ID' },
        {
            key: 'imagen_url',
            label: 'Imagen',
            render: (imageUrl) => {
                // Renderiza la imagen del combo o un texto si no hay imagen
                if (!imageUrl) return <span className="text-gray-400">Sin imagen</span>;
                return (
                    <img
                        src={imageUrl}
                        alt="Combo"
                        className="h-12 w-12 object-cover rounded border border-gray-200"
                    />
                );
            },
        },
        { key: 'nombre', label: 'Nombre' },
        { 
            key: 'precio_combo', 
            label: 'Precio', 
            render: (value, row) => {
                // Calcula el precio total individual sumando los productos
                let precioTotal = 0;
                if (row.productos && row.productos.length > 0) {
                    row.productos.forEach(item => {
                        if (item.producto) {
                            precioTotal += item.producto.precio * item.cantidad;
                        }
                    });
                }
                // Calcula el ahorro y el porcentaje de descuento
                const ahorro = precioTotal - value;
                const descuento = precioTotal > 0 ? ((ahorro / precioTotal) * 100).toFixed(0) : 0;
                
                // Renderiza el precio del combo y el ahorro si corresponde
                return (
                    <div>
                        <div className="font-bold text-green-700">
                            ${parseFloat(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        {precioTotal > value && (
                            <div className="text-xs text-gray-500">
                                <span className="line-through">${precioTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                <span className="ml-1 text-red-600 font-semibold">{descuento}% OFF</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'productos',
            label: 'Productos',
            render: (value) => {
                // Muestra los productos incluidos en el combo
                if (!value || value.length === 0) return <span className="text-gray-400">Sin productos</span>;
                return (
                    <div className="text-xs">
                        {value.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-gray-600">
                                • {item.producto?.nombre || 'N/A'} (x{item.cantidad})
                            </div>
                        ))}
                        {value.length > 2 && (
                            <span className="text-blue-600 font-semibold">+{value.length - 2} más</span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'fecha_inicio',
            label: 'Vigencia',
            render: (inicio, row) => {
                // Muestra la vigencia del combo (fecha inicio y fin)
                if (!inicio || !row.fecha_fin) return <span className="text-gray-400">Sin vigencia</span>;
                const inicioDate = new Date(inicio).toLocaleDateString('es-AR');
                const finDate = new Date(row.fecha_fin).toLocaleDateString('es-AR');
                return (
                    <div className="text-xs text-gray-600">
                        {inicioDate} - {finDate}
                    </div>
                );
            }
        },
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
    ];

    // useEffect: carga los combos y productos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);
    
    // useEffect: cerrar lista de productos al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (mostrarListaProductos && 
                searchRef.current && 
                !searchRef.current.contains(event.target) &&
                listRef.current &&
                !listRef.current.contains(event.target)) {
                setMostrarListaProductos(false);
                setBusquedaProducto('');
                setProductoEditandoIndex(null);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mostrarListaProductos]);

    // Función para cargar combos y productos desde la API
    async function cargarDatos() {
        try {
            setLoading(true); // Muestra spinner
            // Obtiene combos y productos en paralelo - aumentamos limit para obtener todos
            const [combosData, productosData] = await Promise.all([
                combosService.obtenerTodos({ con_productos: true }),
                productosService.obtenerTodos({ limit: 1000 }),
            ]);
            
            setCombos(combosData); // Actualiza combos
            setProductos(productosData); // Actualiza productos
        } catch (error) {
            // Si ocurre un error, lo muestra y alerta al usuario
            alert('Error al cargar los datos: ' + error.message);
        } finally {
            setLoading(false); // Oculta spinner
        }
    }

    // Maneja el cambio de los inputs del formulario
    function handleInputChange(e) {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    }

    // Abre el modal para crear un nuevo combo
    function handleCreate() {
        setEditingCombo(null);
        setFormData({
            nombre: '',
            descripcion: '',
            precio_combo: '',
            imagen_url: '',
            activo: true,
            fecha_inicio: '',
            fecha_fin: ''
        });
        setProductosSeleccionados([]);
        setImagenesCombo([]); // Limpia imágenes
        setBusquedaProducto(''); // Limpia búsqueda
        setProductosVisibles(50); // Reinicia lazy loading
        setMostrarListaProductos(false); // Oculta lista
        setProductoEditandoIndex(null); // Limpia índice
        setModalOpen(true);
    }

    // Abre el modal para editar un combo existente
    function handleEdit(combo) {
        setEditingCombo(combo);
        setFormData({
            nombre: combo.nombre || '',
            descripcion: combo.descripcion || '',
            precio_combo: combo.precio_combo || '',
            imagen_url: combo.imagen_url || '',
            activo: combo.activo !== undefined ? combo.activo : true,
            fecha_inicio: combo.fecha_inicio ? combo.fecha_inicio.split('T')[0] : '',
            fecha_fin: combo.fecha_fin ? combo.fecha_fin.split('T')[0] : ''
        });
        
        // Carga las imágenes del combo
        const imagenes = combo.imagen_url ? [combo.imagen_url] : [];
        setImagenesCombo(imagenes);
        
        // Carga los productos del combo en el estado
        if (combo.productos && combo.productos.length > 0) {
            setProductosSeleccionados(
                combo.productos.map(item => ({
                    producto_id: item.producto?.producto_id || item.producto_id,
                    cantidad: item.cantidad || 1,
                    nombre: item.producto?.nombre || 'N/A'
                }))
            );
        } else {
            setProductosSeleccionados([]);
        }
        
        setBusquedaProducto(''); // Limpia búsqueda
        setProductosVisibles(50); // Reinicia lazy loading
        setMostrarListaProductos(false); // Oculta lista
        setProductoEditandoIndex(null); // Limpia índice
        setModalOpen(true);
    }

    // Maneja el envío del formulario para crear/editar combo
    async function handleSubmit(e) {
        e.preventDefault();

        // Validaciones básicas
        if (!formData.nombre.trim()) {
            alert('El nombre es obligatorio');
            return;
        }
        if (!formData.precio_combo || parseFloat(formData.precio_combo) <= 0) {
            alert('El precio debe ser mayor a 0');
            return;
        }
        if (productosSeleccionados.length === 0) {
            alert('Debes agregar al menos un producto al combo');
            return;
        }
        
        // Validar que todos los productos tengan un producto_id seleccionado
        const productosSinSeleccionar = productosSeleccionados.some(p => !p.producto_id);
        if (productosSinSeleccionar) {
            alert('Todos los productos deben tener un producto seleccionado');
            return;
        }

        try {
            // Prepara los datos para enviar a la API
            const data = {
                ...formData,
                precio_combo: parseFloat(formData.precio_combo),
                productos: productosSeleccionados.map(p => ({
                    producto_id: p.producto_id,
                    cantidad: parseInt(p.cantidad) || 1
                }))
            };

            if (editingCombo) {
                // Si se está editando, actualiza el combo
                await combosService.actualizar(editingCombo.combo_id, data);
                alert('Combo actualizado correctamente');
            } else {
                // Si no, crea un nuevo combo
                await combosService.crear(data);
                alert('Combo creado correctamente');
            }

            setModalOpen(false); // Cierra el modal
            cargarDatos(); // Recarga la lista
        } catch (error) {
            // Si ocurre un error, lo muestra y alerta al usuario
            alert('Error al guardar: ' + error.message);
        }
    }

    // Maneja la eliminación de un combo
    async function handleDelete(combo) {
        // Confirma con el usuario antes de eliminar
        if (!confirm(`¿Estás seguro de eliminar el combo "${combo.nombre}"?`)) {
            return;
        }

        try {
            await combosService.eliminar(combo.combo_id); // Llama al servicio para eliminar
            alert('Combo eliminado correctamente');
            cargarDatos(); // Recarga la lista
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }

    // Agrega un nuevo producto al combo
    function handleAgregarProducto() {
        setProductosSeleccionados(prev => [
            ...prev,
            { producto_id: '', cantidad: 1, nombre: '' }
        ]);
    }

    // Elimina un producto del combo
    function handleEliminarProducto(index) {
        setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
    }

    // Maneja el cambio de cantidad en el combo
    function handleProductoChange(index, field, value) {
        setProductosSeleccionados(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    }

    // Calcula el precio sugerido sumando los precios individuales de los productos seleccionados
    function calcularPrecioSugerido() {
        let total = 0;
        productosSeleccionados.forEach(item => {
            const producto = productos.find(p => p.producto_id === item.producto_id);
            if (producto) {
                total += producto.precio * (item.cantidad || 1);
            }
        });
        return total;
    }

    // Filtra los productos según la búsqueda y aplica lazy loading
    const productosFiltrados = useMemo(() => {
        if (!busquedaProducto.trim()) {
            // Si no hay búsqueda, devolver solo los primeros productos (lazy loading)
            return productos.slice(0, productosVisibles);
        }
        
        const termino = busquedaProducto.toLowerCase();
        const filtrados = productos.filter(p => 
            p.nombre?.toLowerCase().includes(termino) ||
            p.marca?.toLowerCase().includes(termino) ||
            p.modelo?.toLowerCase().includes(termino) ||
            p.producto_id?.toString().includes(termino)
        );
        
        // Limitar también los resultados filtrados para mejor rendimiento
        return filtrados.slice(0, productosVisibles);
    }, [productos, busquedaProducto, productosVisibles]);

    // Maneja el scroll del selector para cargar más productos (lazy loading)
    function handleScrollProductos(e) {
        const element = e.target;
        const scrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
        
        if (scrolledToBottom && productosVisibles < productos.length) {
            // Cargar 50 productos más
            setProductosVisibles(prev => Math.min(prev + 50, productos.length));
        }
    }
    
    // Seleccionar un producto desde la lista
    function seleccionarProducto(producto) {
        if (productoEditandoIndex !== null) {
            // Actualizar el producto en la posición específica
            setProductosSeleccionados(prev => {
                const updated = [...prev];
                updated[productoEditandoIndex] = {
                    producto_id: producto.producto_id,
                    cantidad: updated[productoEditandoIndex]?.cantidad || 1,
                    nombre: producto.nombre
                };
                return updated;
            });
        }
        setMostrarListaProductos(false);
        setBusquedaProducto('');
        setProductoEditandoIndex(null);
        setProductosVisibles(50);
    }
    
    // Abrir lista de productos para un índice específico
    function abrirListaProductos(index) {
        setProductoEditandoIndex(index);
        const productoActual = productosSeleccionados[index];
        if (productoActual?.producto_id) {
            const producto = productos.find(p => p.producto_id === productoActual.producto_id);
            if (producto) {
                setBusquedaProducto(`${producto.nombre} - $${producto.precio} (${producto.marca})`);
            }
        } else {
            setBusquedaProducto('');
        }
        setMostrarListaProductos(true);
        setProductosVisibles(50);
    }

    // Maneja cuando se sube una nueva imagen
    function handleImagenAgregada(url) {
        setImagenesCombo(prev => [...prev, url]);
        // Si es la primera imagen, la establece como imagen_url principal
        if (imagenesCombo.length === 0) {
            setFormData(prev => ({ ...prev, imagen_url: url }));
        }
    }

    // Elimina una imagen del estado
    function handleEliminarImagen(index) {
        const nuevasImagenes = imagenesCombo.filter((_, i) => i !== index);
        setImagenesCombo(nuevasImagenes);
        // Si se elimina la primera imagen, actualiza imagen_url
        if (index === 0) {
            setFormData(prev => ({ ...prev, imagen_url: nuevasImagenes[0] || '' }));
        }
    }

    // Si está cargando, muestra spinner
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Renderiza la interfaz principal de gestión de combos
    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gestión de Combos</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">Crea y administra combos de productos con precios especiales</p>
            </div>

            {/* Botón de crear combo */}
            <div className="mb-4 md:mb-6">
                <Button onClick={handleCreate} className="w-full md:w-auto">
                    + Crear Combo
                </Button>
            </div>

            {/* Tabla de combos */}
            <DataTable
                columns={columns}
                data={combos}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modal de formulario para crear/editar combo */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCombo ? 'Editar Combo' : 'Crear Combo'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Combo *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
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
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Imágenes del combo */}
                    <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                        <h4 className="font-semibold text-purple-900 mb-2">Imagen del Combo</h4>
                    </div>
                    
                    <div>
                        <ImageUploader
                            onImageUploaded={handleImagenAgregada}
                            currentImages={imagenesCombo}
                            onDeleteImage={handleEliminarImagen}
                        />
                    </div>

                    {/* Productos del combo */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Productos del Combo * 
                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                    ({productos.length} productos disponibles)
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={handleAgregarProducto}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                + Agregar Producto
                            </button>
                        </div>
                        
                        {/* Lista de productos seleccionados */}
                        {productosSeleccionados.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay productos agregados al combo</p>
                        ) : (
                            <div className="space-y-3">
                                {productosSeleccionados.map((item, index) => {
                                    const productoActual = productos.find(p => p.producto_id === item.producto_id);
                                    
                                    return (
                                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                                            {/* Selector de producto con búsqueda */}
                                            <div ref={productoEditandoIndex === index ? searchRef : null} className="mb-2">
                                                <div className="relative">
                                                    {productoActual ? (
                                                        // Mostrar producto seleccionado
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirListaProductos(index)}
                                                            className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {productoActual.imagen_url && (
                                                                    <img 
                                                                        src={productoActual.imagen_url} 
                                                                        alt={productoActual.nombre}
                                                                        className="w-10 h-10 object-cover rounded border border-gray-200"
                                                                    />
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                                        {productoActual.nombre}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {productoActual.marca} • ${parseFloat(productoActual.precio).toLocaleString('es-AR')}
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    ID: {productoActual.producto_id}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        // Sin producto seleccionado
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirListaProductos(index)}
                                                            className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-500"
                                                        >
                                                            Seleccionar producto...
                                                        </button>
                                                    )}
                                                    
                                                    {/* Lista desplegable de productos */}
                                                    {mostrarListaProductos && productoEditandoIndex === index && (
                                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                                            {/* Campo de búsqueda */}
                                                            <div className="p-2 border-b sticky top-0 bg-white">
                                                                <div className="relative">
                                                                    <input
                                                                        type="text"
                                                                        value={busquedaProducto}
                                                                        onChange={(e) => {
                                                                            setBusquedaProducto(e.target.value);
                                                                            setProductosVisibles(50);
                                                                        }}
                                                                        placeholder="Buscar producto por nombre, marca o ID..."
                                                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                        autoFocus
                                                                    />
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Lista de productos */}
                                                            <div 
                                                                ref={listRef}
                                                                onScroll={handleScrollProductos}
                                                                className="max-h-60 overflow-y-auto"
                                                            >
                                                                {productosFiltrados.length > 0 ? (
                                                                    <>
                                                                        <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b sticky top-0">
                                                                            Mostrando {productosFiltrados.length} de {productos.length} productos
                                                                        </div>
                                                                        {productosFiltrados.map(producto => (
                                                                            <button
                                                                                key={producto.producto_id}
                                                                                type="button"
                                                                                onClick={() => seleccionarProducto(producto)}
                                                                                className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 ${
                                                                                    item.producto_id === producto.producto_id ? 'bg-blue-100' : ''
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    {producto.imagen_url && (
                                                                                        <img 
                                                                                            src={producto.imagen_url} 
                                                                                            alt={producto.nombre}
                                                                                            className="w-10 h-10 object-cover rounded border border-gray-200"
                                                                                        />
                                                                                    )}
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                                                            {producto.nombre}
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-500">
                                                                                            {producto.marca} • ${parseFloat(producto.precio).toLocaleString('es-AR')}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-400">
                                                                                        ID: {producto.producto_id}
                                                                                    </div>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                        {productosVisibles < productos.length && !busquedaProducto && (
                                                                            <div className="px-3 py-2 text-xs text-center text-gray-400 bg-gray-50 border-t">
                                                                                Desplázate para cargar más productos...
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div className="px-3 py-8 text-center text-gray-500">
                                                                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <p className="text-sm">No se encontraron productos</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Botón para cerrar */}
                                                            <div className="p-2 border-t bg-gray-50">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setMostrarListaProductos(false);
                                                                        setBusquedaProducto('');
                                                                        setProductoEditandoIndex(null);
                                                                    }}
                                                                    className="w-full px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                                                                >
                                                                    Cerrar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Cantidad y botón eliminar */}
                                            <div className="flex gap-2 items-center">
                                                <label className="text-sm text-gray-600">Cantidad:</label>
                                                <input
                                                    type="number"
                                                    value={item.cantidad}
                                                    onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                                                    min="1"
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleEliminarProducto(index)}
                                                    className="ml-auto px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Sugerencia de precio y ahorro */}
                        {productosSeleccionados.length > 0 && (() => {
                            const precioSugerido = calcularPrecioSugerido();
                            const precioCombo = parseFloat(formData.precio_combo) || 0;
                            const ahorro = precioSugerido - precioCombo;
                            const descuento = precioSugerido > 0 ? ((ahorro / precioSugerido) * 100).toFixed(2) : 0;
                            
                            return (
                                <div className="mt-3 p-3 bg-blue-50 rounded text-sm space-y-2">
                                    <p className="text-gray-700">
                                        <span className="font-medium">Precio sugerido (suma individual):</span>{' '}
                                        ${precioSugerido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </p>
                                    {precioCombo > 0 && precioCombo < precioSugerido && (
                                        <>
                                            <p className="text-green-700 font-bold">
                                                <span className="font-medium">Descuento aplicado:</span>{' '}
                                                {descuento}% OFF
                                            </p>
                                            <p className="text-green-700">
                                                <span className="font-medium">Ahorro:</span>{' '}
                                                ${ahorro.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </>
                                    )}
                                    {precioCombo > precioSugerido && (
                                        <p className="text-red-600 text-xs">
                                            ⚠️ El precio del combo es mayor que la suma individual
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Campo precio del combo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio del Combo * (precio especial con descuento)
                        </label>
                        <input
                            type="number"
                            name="precio_combo"
                            value={formData.precio_combo}
                            onChange={handleInputChange}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Fechas de vigencia */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={formData.fecha_inicio}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Fin
                            </label>
                            <input
                                type="date"
                                name="fecha_fin"
                                value={formData.fecha_fin}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Estado activo */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                            Combo activo
                        </label>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                            {editingCombo ? 'Actualizar' : 'Crear'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
