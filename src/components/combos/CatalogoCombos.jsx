import { useState, useEffect } from 'react';
import ComboCard from './ComboCard.jsx';
import Pagination from '../productos/Pagination.jsx';
import { combosPublicosService } from '../../services/productosPublicos.js';

/**
 * Componente principal del catálogo de combos
 * Gestiona el estado de paginación y carga de datos de combos
 */
export default function CatalogoCombos() {
    // Estados
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado de paginación
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        totalPaginas: 1,
        total: 0,
        porPagina: 16 // 4 columnas x 4 filas (como Mercado Libre)
    });

    // Carga de combos cuando cambia la página
    useEffect(() => {
        cargarCombos();
    }, [paginacion.paginaActual]);

    // Función para cargar combos
    const cargarCombos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtiene los combos
            const resultado = await combosPublicosService.obtenerActivos({
                pagina: paginacion.paginaActual,
                porPagina: paginacion.porPagina
            });
            
            setCombos(resultado.combos);
            setPaginacion(prev => ({
                ...prev,
                totalPaginas: resultado.paginas,
                total: resultado.total
            }));
        } catch (err) {
            console.error('Error al cargar combos:', err);
            setError('Error al cargar los combos. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Maneja el cambio de página
    const handleCambioPagina = (nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header con resultados */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
                    <span>🎁</span>
                    <span>Combos Especiales</span>
                </h1>
                <p className="text-gray-600 text-lg mb-4">
                    Descubrí nuestros packs promocionales con ofertas imprescindibles
                </p>
                <div className="flex justify-between items-center">
                    <p className="text-gray-700 font-semibold">
                        {loading 
                            ? 'Cargando combos...' 
                            : `${paginacion.total} ${paginacion.total === 1 ? 'combo disponible' : 'combos disponibles'}`
                        }
                    </p>
                </div>
            </div>

            {/* Mostrar error si existe */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Loading spinner */}
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            )}

            {/* Grid de combos */}
            {!loading && !error && (
                <>
                    {combos.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {combos.map((combo) => (
                                    <ComboCard 
                                        key={combo.combo_id} 
                                        combo={combo} 
                                    />
                                ))}
                            </div>

                            {/* Paginación */}
                            <Pagination
                                paginaActual={paginacion.paginaActual}
                                totalPaginas={paginacion.totalPaginas}
                                onCambioPagina={handleCambioPagina}
                            />
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🎁</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                No hay combos disponibles
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Vuelve pronto para ver nuestras promociones especiales
                            </p>
                            <a
                                href="/productos"
                                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Ver todos los productos
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
