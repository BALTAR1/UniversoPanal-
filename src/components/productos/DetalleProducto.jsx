import { useState, useEffect, useRef } from 'react';
import { productosPublicosService } from '../../services/productosPublicos.js';
import { addToCart } from '../../hooks/useCart.js';

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

    // Definir todasImagenes arriba para evitar errores de referencia
    const imagenes = producto?.imagenes || [];
    const todasImagenes = [
        producto?.imagen_url,
        ...imagenes.map(img => img.url)
    ].filter(Boolean);

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
            precio: producto.precio_con_descuento || producto.precio,
            cantidad: cantidad,
            caracteristicas: {
                talla: tallaSeleccionada,
                marca: producto.marca,
                modelo: producto.modelo
            },
            imagen: producto.imagen_url || producto.imagenes?.[0]?.url
        };

        // Agregar al carrito usando el hook
        addToCart(itemCarrito);
    };

    const intervaloRef = useRef(null);

    // Autoplay: cambia la imagen cada 5 segundos
    useEffect(() => {
        if (todasImagenes.length <= 1) return;
        intervaloRef.current = setInterval(() => {
            setImagenSeleccionada((prev) => (prev + 1) % todasImagenes.length);
        }, 5000);
        return () => clearInterval(intervaloRef.current);
    }, [todasImagenes.length]);

    // Funciones para flechas
    const handlePrev = () => {
        setImagenSeleccionada((prev) => (prev - 1 + todasImagenes.length) % todasImagenes.length);
        clearInterval(intervaloRef.current);
    };
    const handleNext = () => {
        setImagenSeleccionada((prev) => (prev + 1) % todasImagenes.length);
        clearInterval(intervaloRef.current);
    };

    // Manejo de deslizamiento táctil
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        setTouchEnd(e.changedTouches[0].clientX);
        handleSwipe();
    };

    const handleSwipe = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }
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

    return (
        <div className="container mx-auto px-4 py-4 md:py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6" aria-label="Breadcrumb">
                <a href="/" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Inicio
                </a>
                <span className="text-gray-400">›</span>
                <a href="/productos" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Productos
                </a>
                <span className="text-gray-400">›</span>
                <span className="text-gray-700 font-medium truncate">
                    {producto.nombre}
                </span>
            </nav>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 p-4 md:p-6">
                    {/* Columna izquierda - Imágenes */}
                    <div>
                        {/* Imagen principal */}
                        <div 
                            className="relative bg-gray-50 rounded-lg overflow-hidden mb-4 md:mb-8 flex items-center justify-center"
                            style={{ height: '300px', maxHeight: '50vh', minHeight: '200px' }}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Flecha izquierda */}
                            {todasImagenes.length > 1 && (
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-blue-100 rounded-full p-1 md:p-2 shadow transition-all z-20"
                                    aria-label="Imagen anterior"
                                >
                                    <svg width="20" height="20" className="md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
                                </button>
                            )}
                            <img
                                src={todasImagenes[imagenSeleccionada] || '/images/placeholder.svg'}
                                alt={producto.nombre}
                                className="max-h-72 w-auto object-contain mx-auto transition-all duration-300"
                            />
                            {/* Flecha derecha */}
                            {todasImagenes.length > 1 && (
                                <button
                                    onClick={handleNext}
                                    className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-blue-100 rounded-full p-1 md:p-2 shadow transition-all z-20"
                                    aria-label="Imagen siguiente"
                                >
                                    <svg width="20" height="20" className="md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                                </button>
                            )}
                        </div>

                        {/* Slider de miniaturas */}
                        {todasImagenes.length > 1 && (
                            <div className="flex gap-2 md:gap-4 justify-center items-center mt-2 md:mt-4 mb-4 md:mb-8 overflow-x-auto pb-2">
                                {todasImagenes.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setImagenSeleccionada(index)}
                                        className={`relative flex-shrink-0 border-2 rounded-lg overflow-hidden transition-all duration-300
                                            ${imagenSeleccionada === index ? 'border-blue-600 scale-110 shadow-lg z-10' : 'border-gray-200 hover:border-blue-400 scale-100'}
                                        `}
                                        style={{ width: '60px', height: '60px' }}
                                        aria-label={`Ver imagen ${index + 1}`}
                                    >
                                        <img
                                            src={img}
                                            alt={`${producto.nombre} - Vista ${index + 1}`}
                                            className="w-full h-full object-cover transition-all duration-300"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Información */}
                    <div className="flex flex-col">

                        {/* Título */}
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                            {producto.nombre}
                        </h1>

                        {/* Marca y Modelo */}
                        <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                            {producto.marca && <span className="font-medium">{producto.marca}</span>}
                            {producto.modelo && <span className="text-gray-500"> - {producto.modelo}</span>}
                        </p>

                        {/* Precio */}
                        <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                            {producto.descuento && producto.precio_con_descuento ? (
                                <>
                                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                        <span className="text-sm md:text-xl text-gray-500 line-through">
                                            {formatearPrecio(producto.precio_original || producto.precio)}
                                        </span>
                                        <span className="bg-red-100 text-red-700 text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full">
                                            {producto.descuento}% OFF
                                        </span>
                                    </div>
                                    <div className="text-2xl md:text-4xl font-black text-black mb-1">
                                        {formatearPrecio(producto.precio_con_descuento)}
                                    </div>
                                    <p className="text-green-700 text-xs md:text-sm font-medium mb-1">
                                        o hasta 4 cuotas sin interés de {formatearPrecio(producto.precio_con_descuento / 4)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ¡Ahorrás {formatearPrecio((producto.precio_original || producto.precio) - producto.precio_con_descuento)}!
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl md:text-3xl font-black text-black mb-1">
                                        {formatearPrecio(producto.precio)}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Precio sin impuestos nacionales: {formatearPrecio(producto.precio * 0.79)}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Cantidad */}
                        <div className="mb-3 md:mb-4">
                            <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                                Cantidad: {cantidad} unidad{cantidad !== 1 ? 'es' : ''}
                            </label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    disabled={sinStock}
                                    className="w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm md:text-base"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1)))}
                                    disabled={sinStock}
                                    className="w-16 md:w-20 text-center border border-gray-300 rounded-lg py-1 md:py-2 disabled:opacity-50 text-sm md:text-base"
                                    min="1"
                                    max={producto.stock}
                                />
                                <button
                                    onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                                    disabled={sinStock || cantidad >= producto.stock}
                                    className="w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm md:text-base"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col gap-2 md:gap-3 mb-4 md:mb-6">
                            <button
                                onClick={agregarAlCarrito}
                                disabled={sinStock}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-lg"
                            >
                                {sinStock
                                    ? 'Sin stock'
                                    : `Agregar al carrito - ${formatearPrecio((producto.precio_con_descuento || producto.precio) * cantidad)}`
                                }
                            </button>
                        </div>

                        {/* Información adicional */}
                        <div className="border-t border-gray-200 pt-3 md:pt-4 space-y-2 md:space-y-3">
                            <div className="flex items-start gap-2 md:gap-3">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <div>
                                    <p className="font-medium text-xs md:text-sm text-gray-900">Stock disponible</p>
                                    <p className="text-xs text-gray-600">Envío a todo el país</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 md:gap-3">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <div>
                                    <p className="font-medium text-xs md:text-sm text-gray-900">Devolución gratis</p>
                                    <p className="text-xs text-gray-600">Tenés 30 días desde que lo recibís</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 md:gap-3">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                                <div>
                                    <p className="font-medium text-xs md:text-sm text-gray-900">Compra protegida</p>
                                    <p className="text-xs text-gray-600">Garantía del vendedor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Descripción detallada */}
                <div className="border-t border-gray-200 p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Descripción</h2>
                    <div className="prose max-w-none text-gray-700 text-sm md:text-base">
                        {producto.descripcion ? (
                            <p className="whitespace-pre-line">{producto.descripcion}</p>
                        ) : (
                            <p className="text-gray-500 italic">No hay descripción disponible</p>
                        )}
                    </div>

                    {/* Ficha técnica */}
                    <div className="mt-6 md:mt-8">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Características</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                            {producto.marca && (
                                <div className="flex justify-between py-2 border-b border-gray-200 text-sm md:text-base">
                                    <span className="font-medium text-gray-700">Marca</span>
                                    <span className="text-gray-900">{producto.marca}</span>
                                </div>
                            )}
                            {producto.modelo && (
                                <div className="flex justify-between py-2 border-b border-gray-200 text-sm md:text-base">
                                    <span className="font-medium text-gray-700">Modelo</span>
                                    <span className="text-gray-900">{producto.modelo}</span>
                                </div>
                            )}
                            {producto.peso_kg && (
                                <div className="flex justify-between py-2 border-b border-gray-200 text-sm md:text-base">
                                    <span className="font-medium text-gray-700">Peso</span>
                                    <span className="text-gray-900">{producto.peso_kg} kg</span>
                                </div>
                            )}
                            {producto.categoria?.nombre && (
                                <div className="flex justify-between py-2 border-b border-gray-200 text-sm md:text-base">
                                    <span className="font-medium text-gray-700">Categoría</span>
                                    <span className="text-gray-900">{producto.categoria.nombre}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
