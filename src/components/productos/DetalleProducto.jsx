import { useState, useEffect } from 'react';
import { productosPublicosService } from '../../services/productosPublicos.js';

/**
 * Componente de detalle de producto - Inspirado en Mercado Libre
 * Muestra información completa: imágenes, descripción, precio, variantes
 */
export default function DetalleProducto({ productoId }) {
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
    const [cantidad, setCantidad] = useState(1);
    const [tallaSeleccionada, setTallaSeleccionada] = useState(null);

    // Tallas disponibles (esto debería venir de la BD en el futuro)
    const tallasDisponibles = ['P', 'M', 'G', 'XG', 'XXG'];

    useEffect(() => {
        cargarProducto();
    }, [productoId]);

    const cargarProducto = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await productosPublicosService.obtenerPorId(productoId);
            setProducto(data);
            
            // Seleccionar primera talla por defecto
            if (tallasDisponibles.length > 0) {
                setTallaSeleccionada(tallasDisponibles[0]);
            }
        } catch (err) {
            console.error('Error al cargar producto:', err);
            setError('No se pudo cargar el producto');
        } finally {
            setLoading(false);
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    };

    const agregarAlCarrito = () => {
        if (!tallaSeleccionada) {
            alert('Por favor selecciona un talle');
            return;
        }

        const itemCarrito = {
            producto_id: producto.producto_id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
            caracteristicas: {
                talla: tallaSeleccionada,
                marca: producto.marca,
                modelo: producto.modelo
            },
            imagen: producto.imagen_url || producto.imagenes?.[0]?.url
        };

        console.log('Agregando al carrito:', itemCarrito);
        
        // Aquí implementarías la lógica del carrito (localStorage, context, etc.)
        alert(`${producto.nombre} (Talla ${tallaSeleccionada}) x${cantidad} agregado al carrito`);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error || !producto) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
                    <p className="text-red-600">{error || 'Producto no encontrado'}</p>
                    <a href="/productos" className="inline-block mt-4 text-blue-600 hover:underline">
                        ← Volver al catálogo
                    </a>
                </div>
            </div>
        );
    }

    const sinStock = producto.stock === 0;
    const stockBajo = producto.stock > 0 && producto.stock <= 5;
    const imagenes = producto.imagenes || [];
    const todasImagenes = [
        producto.imagen_url,
        ...imagenes.map(img => img.url)
    ].filter(Boolean);

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-600 mb-4">
                <a href="/" className="hover:text-blue-600">Inicio</a>
                <span className="mx-2">›</span>
                <a href="/productos" className="hover:text-blue-600">Productos</a>
                {producto.categoria?.nombre && (
                    <>
                        <span className="mx-2">›</span>
                        <span>{producto.categoria.nombre}</span>
                    </>
                )}
            </nav>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                    {/* Columna izquierda - Imágenes */}
                    <div>
                        {/* Imagen principal */}
                        <div className="bg-gray-50 rounded-lg overflow-hidden mb-4 flex items-center justify-center" style={{ height: '320px', maxHeight: '40vh', minHeight: '200px' }}>
                            <img
                                src={todasImagenes[imagenSeleccionada] || '/images/placeholder.svg'}
                                alt={producto.nombre}
                                className="max-h-72 w-auto object-contain mx-auto"
                            />
                        </div>

                        {/* Miniaturas */}
                        {todasImagenes.length > 1 && (
                            <div className="grid grid-cols-6 gap-2">
                                {todasImagenes.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setImagenSeleccionada(index)}
                                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                            imagenSeleccionada === index
                                                ? 'border-blue-600'
                                                : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`${producto.nombre} - Vista ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Información */}
                    <div className="flex flex-col">
                        {/* Badges */}
                        <div className="flex gap-2 mb-3">
                            {sinStock && (
                                <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-bold">
                                    Sin stock
                                </span>
                            )}
                            {stockBajo && !sinStock && (
                                <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-bold">
                                    ¡Últimas {producto.stock} unidades!
                                </span>
                            )}
                            {producto.stock > 10 && (
                                <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-bold">
                                    OFERTA
                                </span>
                            )}
                        </div>

                        {/* Título */}
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                            {producto.nombre}
                        </h1>

                        {/* Marca y Modelo */}
                        <p className="text-gray-600 mb-4">
                            {producto.marca && <span className="font-medium">{producto.marca}</span>}
                            {producto.modelo && <span className="text-gray-500"> - {producto.modelo}</span>}
                        </p>

                        {/* Rating (placeholder) */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex text-yellow-400">
                                ★★★★★
                            </div>
                            <span className="text-sm text-gray-600">(sin calificaciones)</span>
                        </div>

                        {/* Precio */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="text-3xl font-black text-gray-900 mb-1">
                                {formatearPrecio(producto.precio)}
                            </div>
                            <p className="text-green-700 text-sm font-medium mb-1">
                                o hasta 4 cuotas sin interés de {formatearPrecio(producto.precio / 4)}
                            </p>
                            <p className="text-xs text-gray-500">
                                Precio sin impuestos nacionales: {formatearPrecio(producto.precio * 0.79)}
                            </p>
                        </div>

                        {/* Selector de talla */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Seleccioná un talle
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {tallasDisponibles.map((talla) => (
                                    <button
                                        key={talla}
                                        onClick={() => setTallaSeleccionada(talla)}
                                        disabled={sinStock}
                                        className={`
                                            px-4 py-2 border-2 rounded-lg font-medium transition-all
                                            ${tallaSeleccionada === talla
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                                            }
                                            ${sinStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        {talla}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cantidad */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Cantidad: {cantidad} unidad{cantidad !== 1 ? 'es' : ''}
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    disabled={sinStock}
                                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1)))}
                                    disabled={sinStock}
                                    className="w-20 text-center border border-gray-300 rounded-lg py-2 disabled:opacity-50"
                                    min="1"
                                    max={producto.stock}
                                />
                                <button
                                    onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                                    disabled={sinStock || cantidad >= producto.stock}
                                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                >
                                    +
                                </button>
                                <span className="text-sm text-gray-600">
                                    ({producto.stock} disponibles)
                                </span>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col gap-3 mb-6">
                            <button
                                onClick={agregarAlCarrito}
                                disabled={sinStock}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
                            >
                                {sinStock ? 'Sin stock' : 'Agregar al carrito'}
                            </button>
                            <button
                                disabled={sinStock}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Comprar ahora
                            </button>
                        </div>

                        {/* Información adicional */}
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <div>
                                    <p className="font-medium text-gray-900">Stock disponible</p>
                                    <p className="text-sm text-gray-600">Envío a todo el país</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <div>
                                    <p className="font-medium text-gray-900">Devolución gratis</p>
                                    <p className="text-sm text-gray-600">Tenés 30 días desde que lo recibís</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                                <div>
                                    <p className="font-medium text-gray-900">Compra protegida</p>
                                    <p className="text-sm text-gray-600">Garantía del vendedor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Descripción detallada */}
                <div className="border-t border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
                    <div className="prose max-w-none text-gray-700">
                        {producto.descripcion ? (
                            <p className="whitespace-pre-line">{producto.descripcion}</p>
                        ) : (
                            <p className="text-gray-500 italic">No hay descripción disponible</p>
                        )}
                    </div>

                    {/* Ficha técnica */}
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Características</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {producto.marca && (
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="font-medium text-gray-700">Marca</span>
                                    <span className="text-gray-900">{producto.marca}</span>
                                </div>
                            )}
                            {producto.modelo && (
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="font-medium text-gray-700">Modelo</span>
                                    <span className="text-gray-900">{producto.modelo}</span>
                                </div>
                            )}
                            {producto.sku && (
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="font-medium text-gray-700">SKU</span>
                                    <span className="text-gray-900">{producto.sku}</span>
                                </div>
                            )}
                            {producto.peso_kg && (
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="font-medium text-gray-700">Peso</span>
                                    <span className="text-gray-900">{producto.peso_kg} kg</span>
                                </div>
                            )}
                            {producto.categoria?.nombre && (
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="font-medium text-gray-700">Categoría</span>
                                    <span className="text-gray-900">{producto.categoria.nombre}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Botón volver */}
            <div className="mt-6">
                <a 
                    href="/productos"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Volver al catálogo
                </a>
            </div>
        </div>
    );
}
