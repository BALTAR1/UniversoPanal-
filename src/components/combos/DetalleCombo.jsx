import { useState, useEffect, useRef } from 'react';
import { combosPublicosService } from '../../services/productosPublicos.js';

/**
 * Componente de detalle de combo
 * Muestra información completa del combo, productos incluidos, precios y ahorro
 */
export default function DetalleCombo({ comboId }) {
    const [combo, setCombo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
    const [cantidad, setCantidad] = useState(1);

    // Obtener todas las imágenes de los productos del combo
    const obtenerTodasImagenes = () => {
        const imagenes = [];
        combo?.combo_productos?.forEach(item => {
            if (item.productos?.imagen_url) {
                imagenes.push(item.productos.imagen_url);
            }
        });
        // Agregar imagen principal del combo si existe
        if (combo?.imagen_url && !imagenes.includes(combo.imagen_url)) {
            imagenes.unshift(combo.imagen_url);
        }
        // Si no hay imágenes, usar placeholder
        if (imagenes.length === 0) {
            imagenes.push('/images/placeholder.svg');
        }
        return imagenes;
    };

    const todasImagenes = combo ? obtenerTodasImagenes() : [];

    useEffect(() => {
        cargarCombo();
    }, [comboId]);

    const cargarCombo = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await combosPublicosService.obtenerPorId(comboId);
            setCombo(data);
        } catch (err) {
            console.error('Error al cargar combo:', err);
            setError('No se pudo cargar el combo');
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
        const itemCarrito = {
            combo_id: combo.combo_id,
            nombre: combo.nombre,
            precio: combo.precio_combo,
            cantidad: cantidad,
            tipo: 'combo',
            productos: combo.combo_productos,
            imagen: todasImagenes[0]
        };

        console.log('Agregando combo al carrito:', itemCarrito);
        alert(`${combo.nombre} x${cantidad} agregado al carrito`);
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !combo) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error || 'No se encontró el combo'}</p>
                </div>
            </div>
        );
    }

    const precioTotalIndividual = combo.precio_total_individual || 0;
    const ahorro = combo.ahorro || 0;
    const porcentajeAhorro = combo.porcentaje_ahorro || 0;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Breadcrumb de navegación */}
            <nav className="flex items-center gap-2 text-sm mb-8" aria-label="Breadcrumb">
                <a href="/" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Inicio
                </a>
                <span className="text-gray-400">›</span>
                <a href="/productos" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Productos
                </a>
                <span className="text-gray-400">›</span>
                <span className="text-gray-700 font-medium">
                    {combo.nombre}
                </span>
            </nav>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna izquierda: Imágenes */}
                <div className="flex flex-col gap-4">
                    {/* Imagen principal con slider */}
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group">
                        <img
                            src={todasImagenes[imagenSeleccionada]}
                            alt={combo.nombre}
                            className="w-full h-full object-cover"
                        />

                        {/* Botones de navegación */}
                        {todasImagenes.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Badge de combo */}
                        <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                            🎁 COMBO
                        </div>

                        {/* Indicador de página */}
                        {todasImagenes.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {imagenSeleccionada + 1} / {todasImagenes.length}
                            </div>
                        )}
                    </div>

                    {/* Miniaturas de imágenes */}
                    {todasImagenes.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {todasImagenes.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setImagenSeleccionada(idx)}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        imagenSeleccionada === idx 
                                            ? 'border-purple-600' 
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <img
                                        src={img}
                                        alt={`Miniatura ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Columna derecha: Información */}
                <div className="flex flex-col gap-6">
                    {/* Nombre y marca */}
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">
                            {combo.nombre}
                        </h1>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                                Pack de {combo.combo_productos?.length || 0} productos
                            </span>
                        </div>
                    </div>

                    {/* Precios y ahorro */}
                    <div className="border-b pb-6">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-600 mb-2">Precio normalmente:</p>
                            <p className="text-sm text-gray-500 line-through mb-3">
                                {formatearPrecio(precioTotalIndividual)}
                            </p>
                            
                            <p className="text-sm text-gray-600 mb-2">Precio en combo:</p>
                            <div className="text-4xl font-black text-green-600 mb-3">
                                {formatearPrecio(combo.precio_combo)}
                            </div>

                            {ahorro > 0 && (
                                <div className="bg-green-100 border border-green-300 rounded p-3 mb-3">
                                    <p className="text-sm font-semibold text-green-700">
                                        ¡Ahorrás {formatearPrecio(ahorro)}! ({porcentajeAhorro}%)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Productos incluidos */}
                    <div className="border-b pb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            📦 Productos incluidos en el combo
                        </h2>
                        <div className="space-y-3">
                            {combo.combo_productos?.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-3 flex gap-3">
                                    {item.productos?.imagen_url && (
                                        <img
                                            src={item.productos.imagen_url}
                                            alt={item.productos.nombre}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {item.cantidad}x {item.productos?.nombre}
                                                </p>
                                                {item.productos?.marca && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Marca: {item.productos.marca}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">
                                                    {formatearPrecio(item.productos?.precio || 0)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    c/u
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cantidad y carrito */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">
                                Cantidad de combos:
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                                >
                                    −
                                </button>
                                <span className="px-4 py-2 font-semibold text-gray-900">
                                    {cantidad}
                                </span>
                                <button
                                    onClick={() => setCantidad(cantidad + 1)}
                                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={agregarAlCarrito}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
                        >
                            🛒 Agregar al carrito - {formatearPrecio(combo.precio_combo * cantidad)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
