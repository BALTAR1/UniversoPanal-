import { useState, useEffect } from 'react';
import FilterSidebar from './FilterSidebar.jsx';
import ProductCard from './ProductCard.jsx';
import Pagination from './Pagination.jsx';
import { productosPublicosService, categoriasPublicasService } from '../../services/productosPublicos.js';

/**
 * Componente principal del catálogo de productos
 * Gestiona el estado de filtros, paginación y carga de datos
 */
export default function CatalogoProductos() {
    // Estados
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [rangoPrecios, setRangoPrecios] = useState({ min: 0, max: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado de paginación y filtros
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        totalPaginas: 1,
        total: 0,
        porPagina: 16 // 4 columnas x 4 filas (como Mercado Libre)
    });
    
    const [filtros, setFiltros] = useState({
        busqueda: '',
        categoria_id: null,
        marca: null,
        precioMin: null,
        precioMax: null,
        ordenar: 'relevancia',
        ordenAsc: true
    });

    // Carga inicial de categorías, marcas y rango de precios
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
                const [cats, marcasData, rango] = await Promise.all([
                    categoriasPublicasService.obtenerTodas(),
                    categoriasPublicasService.obtenerMarcas(),
                    categoriasPublicasService.obtenerRangoPrecios()
                ]);
                
                setCategorias(cats);
                setMarcas(marcasData);
                setRangoPrecios(rango);
            } catch (err) {
                console.error('Error al cargar datos iniciales:', err);
                setError('Error al cargar categorías y precios');
            }
        };

        cargarDatosIniciales();
    }, []);

    // Carga de productos cuando cambian los filtros o la página
    useEffect(() => {
        cargarProductos();
    }, [filtros, paginacion.paginaActual]);

    // Función para cargar productos
    const cargarProductos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Prepara las opciones de consulta
            const opciones = {
                pagina: paginacion.paginaActual,
                porPagina: paginacion.porPagina,
                busqueda: filtros.busqueda,
                categoria_id: filtros.categoria_id,
                marca: filtros.marca,
                precioMin: filtros.precioMin,
                precioMax: filtros.precioMax,
                ordenar: filtros.ordenar === 'precio_asc' || filtros.ordenar === 'precio_desc' 
                    ? 'precio' 
                    : filtros.ordenar === 'recientes' 
                    ? 'created_at' 
                    : filtros.ordenar === 'relevancia'
                    ? 'nombre'
                    : 'nombre',
                ordenAsc: filtros.ordenar === 'precio_desc' ? false : true
            };

            // Obtiene los productos
            const resultado = await productosPublicosService.obtenerConFiltros(opciones);
            
            setProductos(resultado.productos);
            setPaginacion(prev => ({
                ...prev,
                totalPaginas: resultado.paginas,
                total: resultado.total
            }));
        } catch (err) {
            console.error('Error al cargar productos:', err);
            setError('Error al cargar los productos. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Maneja el cambio de filtros
    const handleFiltrosChange = (nuevosFiltros) => {
        setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
        // Reset a página 1 si hay nuevos filtros
        if (nuevosFiltros.pagina) {
            setPaginacion(prev => ({ ...prev, paginaActual: nuevosFiltros.pagina }));
        }
    };

    // Maneja el cambio de página
    const handleCambioPagina = (nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar de filtros */}
                <div className="lg:w-1/4">
                    <FilterSidebar
                        categorias={categorias}
                        marcas={marcas}
                        rangoPrecios={rangoPrecios}
                        filtrosActuales={filtros}
                        onFiltrosChange={handleFiltrosChange}
                    />
                </div>

                {/* Área de productos */}
                <div className="lg:w-3/4">
                    {/* Header con resultados */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {filtros.categoria_id 
                                ? categorias.find(c => c.categoria_id === filtros.categoria_id)?.nombre 
                                : 'Todos los productos'
                            }
                        </h2>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-700 font-semibold">
                                {loading 
                                    ? 'Cargando productos...' 
                                    : `${paginacion.total} ${paginacion.total === 1 ? 'resultado encontrado' : 'resultados encontrados'}`
                                }
                            </p>
                            <select 
                                value={filtros.ordenar}
                                onChange={(e) => setFiltros(prev => ({ ...prev, ordenar: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="nombre">Ordenar por: Relevancia</option>
                                <option value="precio_asc">Precio: Menor a Mayor</option>
                                <option value="precio_desc">Precio: Mayor a Menor</option>
                                <option value="recientes">Más Recientes</option>
                            </select>
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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {/* Grid de productos */}
                    {!loading && !error && (
                        <>
                            {productos.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {productos.map((producto) => (
                                            <ProductCard 
                                                key={producto.producto_id} 
                                                producto={producto} 
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
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        No se encontraron productos
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Intenta ajustar los filtros o buscar con otros términos
                                    </p>
                                    <button
                                        onClick={() => handleFiltrosChange({
                                            busqueda: '',
                                            categoria_id: null,
                                            precioMin: null,
                                            precioMax: null,
                                            ordenar: 'nombre',
                                            pagina: 1
                                        })}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
