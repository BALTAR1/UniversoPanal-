// Servicio para obtener productos públicos directamente desde Supabase
// Este servicio se usa en páginas públicas que no requieren autenticación
import { supabase } from '../lib/supabaseCliente.js';

/**
 * Función auxiliar para obtener ofertas vigentes
 * Centraliza la lógica de filtrado de ofertas por fecha
 * @returns {Promise<Array>} Ofertas vigentes
 */
const obtenerOfertasVigentes = async () => {
    const { data: ofertasActivas } = await supabase
        .from('ofertas')
        .select('*')
        .eq('activo', true);

    if (!ofertasActivas || ofertasActivas.length === 0) {
        return [];
    }

    // Filtrar ofertas vigentes por fecha
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return ofertasActivas.filter(oferta => {
        if (!oferta.fecha_inicio || !oferta.fecha_fin) return false;
        
        const fechaInicio = new Date(oferta.fecha_inicio);
        fechaInicio.setHours(0, 0, 0, 0);
        
        const fechaFin = new Date(oferta.fecha_fin);
        fechaFin.setHours(23, 59, 59, 999);
        
        return fechaInicio <= now && fechaFin >= now;
    });
};

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
     * @param {boolean} opciones.soloOfertas - true = solo productos con ofertas activas
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
            ordenAsc = true,
            soloOfertas = false
        } = opciones;

        // Calcula el rango para la paginación
        const desde = (pagina - 1) * porPagina;
        const hasta = desde + porPagina - 1;

        // Si soloOfertas es true, primero obtenemos las ofertas vigentes
        let productosIdsConOferta = [];
        if (soloOfertas) {
            const ofertasVigentes = await obtenerOfertasVigentes();
            
            // Extraer IDs de productos con ofertas
            productosIdsConOferta = ofertasVigentes.map(o => o.producto_id);
            
            if (productosIdsConOferta.length === 0) {
                // No hay ofertas vigentes, retornar vacío
                return {
                    productos: [],
                    total: 0,
                    paginas: 0,
                    paginaActual: pagina,
                    porPagina
                };
            }
        }

        // Construye la consulta base
        let query = supabase
            .from('productos')
            .select(`
                *,
                categoria:categorias(categoria_id, nombre, descripcion),
                imagenes:producto_imagenes(imagen_id, url, descripcion)
            `, { count: 'exact' })
            .eq('activo', true);

        // Si soloOfertas, filtrar por los IDs de productos con ofertas
        if (soloOfertas && productosIdsConOferta.length > 0) {
            query = query.in('producto_id', productosIdsConOferta);
        }

        // Aplica filtros
        if (categoria_id) {
            query = query.eq('categoria_id', categoria_id);
        }

        if (marca && marca.trim() !== '') {
            // Usar ilike para búsqueda case-insensitive
            query = query.ilike('marca', marca);
        }

        if (precioMin !== null && precioMin > 0) {
            query = query.gte('precio', precioMin);
        }

        if (precioMax !== null && precioMax > 0) {
            query = query.lte('precio', precioMax);
        }

        if (busqueda && busqueda.trim() !== '') {
            // Búsqueda mejorada: nombre, descripción, marca, modelo y SKU
            const palabras = busqueda.split(',').map(p => p.trim()).filter(p => p !== '');
            
            if (palabras.length > 1) {
                // Múltiples palabras: crear condición OR para cada una en múltiples campos
                const condiciones = palabras.flatMap(palabra => [
                    `nombre.ilike.%${palabra}%`,
                    `descripcion.ilike.%${palabra}%`,
                    `marca.ilike.%${palabra}%`,
                    `modelo.ilike.%${palabra}%`,
                    `sku.ilike.%${palabra}%`
                ]);
                query = query.or(condiciones.join(','));
            } else {
                // Una sola palabra - buscar en todos los campos relevantes
                query = query.or(`nombre.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%,marca.ilike.%${busqueda}%,modelo.ilike.%${busqueda}%,sku.ilike.%${busqueda}%`);
            }
        }

        // Aplica ordenamiento
        query = query.order(ordenar, { ascending: ordenAsc });

        // Aplica paginación
        query = query.range(desde, hasta);

        // Ejecuta la consulta
        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        // Obtener ofertas activas para todos los productos
        const ofertasVigentes = await obtenerOfertasVigentes();

        // Obtener combos activos
        const { data: combosActivos } = await supabase
            .from('combos')
            .select(`
                combo_id,
                nombre,
                precio_combo,
                activo,
                productos:combo_productos(
                    cantidad,
                    producto_id
                )
            `)
            .eq('activo', true);

        // Crear mapa de ofertas por producto_id
        const ofertasMap = {};
        ofertasVigentes.forEach(oferta => {
            ofertasMap[oferta.producto_id] = oferta;
        });

        // Crear mapa de combos por producto_id
        const combosMap = {};
        (combosActivos || []).forEach(combo => {
            combo.productos?.forEach(cp => {
                if (!combosMap[cp.producto_id]) {
                    combosMap[cp.producto_id] = [];
                }
                combosMap[cp.producto_id].push({
                    combo_id: combo.combo_id,
                    nombre: combo.nombre,
                    precio_combo: combo.precio_combo
                });
            });
        });

        // Procesa los productos para agregar la imagen principal, ofertas y combos
        let productosFormateados = (data || []).map(producto => {
            // Usa imagen_url del producto o la primera imagen de producto_imagenes
            const imagenPrincipal = producto.imagen_url || producto.imagenes?.[0]?.url || '/images/placeholder.svg';
            
            // Buscar oferta activa para este producto
            const ofertaActiva = ofertasMap[producto.producto_id];
            
            // Calcular precio con descuento si hay oferta
            let precioConDescuento = null;
            let descuento = null;
            if (ofertaActiva) {
                // Intenta obtener el descuento (puede ser descuento_porcentaje o descuento)
                descuento = ofertaActiva.descuento_porcentaje || ofertaActiva.descuento;
                if (descuento) {
                    precioConDescuento = producto.precio * (1 - descuento / 100);
                }
            }

            // Obtener combos de este producto
            const combosProducto = combosMap[producto.producto_id] || [];
            
            return {
                ...producto,
                imagen_principal: imagenPrincipal,
                categoria_nombre: producto.categoria?.nombre || 'Sin categoría',
                todas_imagenes: producto.imagenes || [],
                // Datos de oferta
                tiene_oferta: !!ofertaActiva && !!descuento,
                descuento: descuento,
                precio_con_descuento: precioConDescuento,
                precio_original: producto.precio,
                // Datos de combos
                tiene_combo: combosProducto.length > 0,
                combos: combosProducto
            };
        });

        return {
            productos: productosFormateados,
            total: count || productosFormateados.length,
            paginas: count ? Math.ceil(count / porPagina) : Math.ceil(productosFormateados.length / porPagina),
            paginaActual: pagina,
            porPagina
        };
    },

    /**
     * Obtiene un producto por su ID con todas sus imágenes y ofertas activas
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
            throw error;
        }

        // Ordena las imágenes si existen
        if (data?.imagenes) {
            data.imagenes = data.imagenes || [];
        }

        // Obtener ofertas activas para el producto
        const { data: ofertasData } = await supabase
            .from('ofertas')
            .select('*')
            .eq('producto_id', id)
            .eq('activo', true);

        // Filtrar ofertas vigentes por fecha en JavaScript
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const ofertasVigentes = (ofertasData || []).filter(oferta => {
            if (!oferta.fecha_inicio || !oferta.fecha_fin) return false;
            
            const fechaInicio = new Date(oferta.fecha_inicio);
            fechaInicio.setHours(0, 0, 0, 0);
            
            const fechaFin = new Date(oferta.fecha_fin);
            fechaFin.setHours(23, 59, 59, 999);
            
            return fechaInicio <= now && fechaFin >= now;
        });
        
        const ofertas = ofertasVigentes.length > 0 ? ofertasVigentes[0] : null;

        // Si hay oferta activa, calcular precio con descuento
        if (ofertas) {
            data.oferta = ofertas;
            data.precio_original = data.precio;
            data.precio_con_descuento = data.precio * (1 - ofertas.descuento / 100);
            data.descuento = ofertas.descuento;
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
     * Extrae marcas inteligentemente del nombre si no están en la columna marca
     * @returns {Promise<Array<string>>}
     */
    obtenerMarcas: async () => {
        const { data, error } = await supabase
            .from('productos')
            .select('marca, nombre')
            .eq('activo', true);

        if (error || !data) {
            return [];
        }

        // Marcas conocidas para extracción inteligente
        const marcasConocidas = ['Huggies', 'Pampers', 'Babysec', 'Chicco', 'Fisher-Price', 'Johnsons'];

        // Extrae marcas únicas y cuenta productos por marca
        const marcasMap = {};
        data.forEach(p => {
            let marcaFinal = p.marca;
            
            // Si no hay marca o está vacía, intentar extraer del nombre
            if (!marcaFinal || marcaFinal.trim() === '') {
                // Buscar si el nombre contiene alguna marca conocida
                const nombreLower = (p.nombre || '').toLowerCase();
                for (const marcaConocida of marcasConocidas) {
                    if (nombreLower.includes(marcaConocida.toLowerCase())) {
                        marcaFinal = marcaConocida;
                        break;
                    }
                }
            }
            
            if (marcaFinal) {
                marcasMap[marcaFinal] = (marcasMap[marcaFinal] || 0) + 1;
            }
        });

        // Convierte a array y ordena por cantidad
        return Object.entries(marcasMap)
            .map(([marca, count]) => ({ marca, count }))
            .sort((a, b) => b.count - a.count);
    }
};

/**
 * Servicio para obtener combos públicos
 */
export const combosPublicosService = {
    /**
     * Obtiene todos los combos activos y vigentes con paginación
     * @param {Object} opciones - Opciones de paginación
     * @param {number} opciones.pagina - Número de página (empieza en 1)
     * @param {number} opciones.porPagina - Cantidad de combos por página
     * @returns {Promise<{combos: Array, total: number, paginas: number}>}
     */
    obtenerActivos: async (opciones = {}) => {
        const {
            pagina = 1,
            porPagina = 12
        } = opciones;

        const desde = (pagina - 1) * porPagina;
        const hasta = desde + porPagina - 1;

        const now = new Date().toISOString();
        
        let query = supabase
            .from('combos')
            .select(`
                *,
                combo_productos(
                    cantidad,
                    productos(
                        producto_id,
                        nombre,
                        marca,
                        precio,
                        imagen_url,
                        stock
                    )
                )
            `, { count: 'exact' })
            .eq('activo', true)
            .order('created_at', { ascending: false })
            .range(desde, hasta);

        // Incluir combos vigentes aunque no tengan fecha fin definida
        query = query.or(`fecha_inicio.is.null,fecha_inicio.lte.${now}`);
        query = query.or(`fecha_fin.is.null,fecha_fin.gte.${now}`);

        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        const totalPaginas = count ? Math.ceil(count / porPagina) : 0;

        return {
            combos: data || [],
            total: count || 0,
            paginas: totalPaginas,
            paginaActual: pagina,
            porPagina
        };
    },

    /**
     * Obtiene un combo por su ID
     * @param {number} id - ID del combo
     * @returns {Promise<Object>}
     */
    obtenerPorId: async (id) => {
        const { data, error } = await supabase
            .from('combos')
            .select(`
                *,
                combo_productos(
                    cantidad,
                    productos(
                        producto_id,
                        nombre,
                        marca,
                        modelo,
                        precio,
                        imagen_url,
                        stock,
                        descripcion
                    )
                )
            `)
            .eq('combo_id', id)
            .eq('activo', true)
            .single();

        if (error) {
            throw error;
        }

        // Calcular precio de ahorro
        if (data?.combo_productos) {
            let precioTotal = 0;
            data.combo_productos.forEach(item => {
                if (item.productos) {
                    precioTotal += item.productos.precio * item.cantidad;
                }
            });
            data.precio_total_individual = precioTotal;
            data.ahorro = precioTotal - data.precio_combo;
            data.porcentaje_ahorro = ((data.ahorro / precioTotal) * 100).toFixed(2);
        }

        return data;
    }
};

/**
 * Servicio para obtener ofertas públicas
 */
export const ofertasPublicasService = {
    /**
     * Obtiene todas las ofertas activas y vigentes
     * @returns {Promise<Array>}
     */
    obtenerActivas: async () => {
        const { data, error } = await supabase
            .from('ofertas')
            .select(`
                *,
                productos(
                    producto_id,
                    nombre,
                    marca,
                    precio,
                    imagen_url,
                    stock,
                    categoria:categorias(categoria_id, nombre)
                )
            `)
            .eq('activo', true)
            .order('descuento', { ascending: false });

        if (error) {
            throw error;
        }

        // Filtrar ofertas vigentes por fecha en JavaScript
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const ofertasVigentes = (data || []).filter(oferta => {
            if (!oferta.fecha_inicio || !oferta.fecha_fin) return false;
            
            const fechaInicio = new Date(oferta.fecha_inicio);
            fechaInicio.setHours(0, 0, 0, 0);
            
            const fechaFin = new Date(oferta.fecha_fin);
            fechaFin.setHours(23, 59, 59, 999);
            
            return fechaInicio <= now && fechaFin >= now;
        });

        // Calcular precio con descuento
        return ofertasVigentes.map(oferta => {
            if (oferta.productos) {
                oferta.productos.precio_original = oferta.productos.precio;
                oferta.productos.precio_con_descuento = oferta.productos.precio * (1 - oferta.descuento / 100);
                oferta.productos.descuento = oferta.descuento;
            }
            return oferta;
        });
    },

    /**
     * Obtiene ofertas para un producto específico
     * @param {number} productoId - ID del producto
     * @returns {Promise<Object|null>}
     */
    obtenerPorProducto: async (productoId) => {
        const { data, error } = await supabase
            .from('ofertas')
            .select('*')
            .eq('producto_id', productoId)
            .eq('activo', true)
            .order('descuento', { ascending: false });

        if (error || !data || data.length === 0) {
            return null;
        }

        // Filtrar ofertas vigentes por fecha en JavaScript
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const ofertasVigentes = data.filter(oferta => {
            if (!oferta.fecha_inicio || !oferta.fecha_fin) return false;
            
            const fechaInicio = new Date(oferta.fecha_inicio);
            fechaInicio.setHours(0, 0, 0, 0);
            
            const fechaFin = new Date(oferta.fecha_fin);
            fechaFin.setHours(23, 59, 59, 999);
            
            return fechaInicio <= now && fechaFin >= now;
        });

        return ofertasVigentes.length > 0 ? ofertasVigentes[0] : null;
    }
};
