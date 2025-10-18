// Servicio para obtener productos públicos directamente desde Supabase
// Este servicio se usa en páginas públicas que no requieren autenticación
import { supabase } from '../lib/supabaseCliente.js';

/**
 * Servicio para consultas públicas de productos
 * No requiere autenticación, ideal para el catálogo público
 */
export const productosPublicosService = {
    /**
     * Obtiene productos con filtros y paginación
     * @param {Object} opciones - Opciones de filtrado y paginación
     * @param {number} opciones.pagina - Número de página (empieza en 1)
     * @param {number} opciones.porPagina - Cantidad de productos por página (default: 12)
     * @param {number} opciones.categoria_id - ID de categoría para filtrar
     * @param {string} opciones.marca - Marca para filtrar
     * @param {number} opciones.precioMin - Precio mínimo
     * @param {number} opciones.precioMax - Precio máximo
     * @param {string} opciones.busqueda - Texto de búsqueda en nombre/descripción
     * @param {string} opciones.ordenar - Campo para ordenar (nombre, precio, created_at)
     * @param {boolean} opciones.ordenAsc - true = ascendente, false = descendente
     * @returns {Promise<{productos: Array, total: number, paginas: number}>}
     */
    obtenerConFiltros: async (opciones = {}) => {
        const {
            pagina = 1,
            porPagina = 12,
            categoria_id = null,
            marca = null,
            precioMin = null,
            precioMax = null,
            busqueda = '',
            ordenar = 'nombre',
            ordenAsc = true
        } = opciones;

        // Calcula el rango para la paginación
        const desde = (pagina - 1) * porPagina;
        const hasta = desde + porPagina - 1;

        // Construye la consulta base
        let query = supabase
            .from('productos')
            .select(`
                *,
                categoria:categorias(categoria_id, nombre, descripcion),
                imagenes:producto_imagenes(imagen_id, url, descripcion)
            `, { count: 'exact' })
            .eq('activo', true);

        // Aplica filtros
        if (categoria_id) {
            query = query.eq('categoria_id', categoria_id);
        }

        if (marca && marca.trim() !== '') {
            query = query.eq('marca', marca);
        }

        if (precioMin !== null && precioMin > 0) {
            query = query.gte('precio', precioMin);
        }

        if (precioMax !== null && precioMax > 0) {
            query = query.lte('precio', precioMax);
        }

        if (busqueda && busqueda.trim() !== '') {
            // Búsqueda en nombre o descripción (case insensitive)
            query = query.or(`nombre.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`);
        }

        // Aplica ordenamiento
        query = query.order(ordenar, { ascending: ordenAsc });

        // Aplica paginación
        query = query.range(desde, hasta);

        // Ejecuta la consulta
        const { data, error, count } = await query;

        if (error) {
            console.error('Error al obtener productos:', error);
            throw error;
        }

        // Procesa los productos para agregar la imagen principal
        const productosFormateados = (data || []).map(producto => {
            // Usa imagen_url del producto o la primera imagen de producto_imagenes
            const imagenPrincipal = producto.imagen_url || producto.imagenes?.[0]?.url || '/images/placeholder.svg';
            
            return {
                ...producto,
                imagen_principal: imagenPrincipal,
                categoria_nombre: producto.categoria?.nombre || 'Sin categoría',
                todas_imagenes: producto.imagenes || []
            };
        });

        // Calcula el total de páginas
        const totalPaginas = count ? Math.ceil(count / porPagina) : 0;

        return {
            productos: productosFormateados,
            total: count || 0,
            paginas: totalPaginas,
            paginaActual: pagina,
            porPagina
        };
    },

    /**
     * Obtiene un producto por su ID con todas sus imágenes
     * @param {number} id - ID del producto
     * @returns {Promise<Object>}
     */
    obtenerPorId: async (id) => {
        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categoria:categorias(categoria_id, nombre, descripcion),
                imagenes:producto_imagenes(imagen_id, url, descripcion)
            `)
            .eq('producto_id', id)
            .eq('activo', true)
            .single();

        if (error) {
            console.error('Error al obtener producto:', error);
            throw error;
        }

        // Ordena las imágenes si existen
        if (data?.imagenes) {
            data.imagenes = data.imagenes || [];
        }

        return data;
    },

    /**
     * Obtiene productos destacados (puedes usar un campo 'destacado' o los más recientes)
     * @param {number} limite - Cantidad de productos a obtener
     * @returns {Promise<Array>}
     */
    obtenerDestacados: async (limite = 8) => {
        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categoria:categorias(categoria_id, nombre),
                imagenes:producto_imagenes(imagen_id, url, descripcion)
            `)
            .eq('activo', true)
            .order('created_at', { ascending: false })
            .limit(limite);

        if (error) {
            console.error('Error al obtener productos destacados:', error);
            throw error;
        }

        // Procesa las imágenes
        return (data || []).map(producto => {
            // Usa imagen_url del producto o la primera imagen de producto_imagenes
            const imagenPrincipal = producto.imagen_url || producto.imagenes?.[0]?.url || '/images/placeholder.svg';
            
            return {
                ...producto,
                imagen_principal: imagenPrincipal
            };
        });
    }
};

/**
 * Servicio para obtener categorías públicas
 */
export const categoriasPublicasService = {
    /**
     * Obtiene todas las categorías activas
     * @returns {Promise<Array>}
     */
    obtenerTodas: async () => {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('activo', true)
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error al obtener categorías:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Obtiene una categoría por su ID
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object>}
     */
    obtenerPorId: async (id) => {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('categoria_id', id)
            .eq('activo', true)
            .single();

        if (error) {
            console.error('Error al obtener categoría:', error);
            throw error;
        }

        return data;
    },

    /**
     * Obtiene el rango de precios disponible en el catálogo
     * @returns {Promise<{min: number, max: number}>}
     */
    obtenerRangoPrecios: async () => {
        const { data, error } = await supabase
            .from('productos')
            .select('precio')
            .eq('activo', true);

        if (error || !data || data.length === 0) {
            return { min: 0, max: 0 };
        }

        const precios = data.map(p => p.precio).filter(p => p !== null);
        
        return {
            min: Math.min(...precios),
            max: Math.max(...precios)
        };
    },

    /**
     * Obtiene todas las marcas únicas disponibles
     * @returns {Promise<Array<string>>}
     */
    obtenerMarcas: async () => {
        const { data, error } = await supabase
            .from('productos')
            .select('marca')
            .eq('activo', true);

        if (error || !data) {
            console.error('Error al obtener marcas:', error);
            return [];
        }

        // Extrae marcas únicas y cuenta productos por marca
        const marcasMap = {};
        data.forEach(p => {
            if (p.marca) {
                marcasMap[p.marca] = (marcasMap[p.marca] || 0) + 1;
            }
        });

        // Convierte a array y ordena por cantidad
        return Object.entries(marcasMap)
            .map(([marca, count]) => ({ marca, count }))
            .sort((a, b) => b.count - a.count);
    }
};
