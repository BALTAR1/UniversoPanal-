/**
 * Componente de tarjeta de producto para el catálogo
 * Diseño inspirado en Mercado Libre
 * Muestra imagen, nombre, precio, marca y acceso al detalle
 */
export default function ProductCard({ producto }) {
    // Función para formatear el precio en pesos argentinos
    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    };

    // Determina estado del stock
    const sinStock = producto.stock === 0;
    const stockBajo = producto.stock > 0 && producto.stock <= 5;

    // URL del detalle del producto
    const urlDetalle = `/producto/${producto.producto_id}`;

    return (
        <article className="group bg-white rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Contenedor de imagen - Clickeable */}
            <a href={urlDetalle} className="relative bg-gray-50 overflow-hidden aspect-square block">
                <img
                    src={producto.imagen_principal}
                    alt={producto.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />

                {/* Badges de promoción superior derecha */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {sinStock && (
                        <div className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold shadow-md">
                            SIN STOCK
                        </div>
                    )}
                    {stockBajo && !sinStock && (
                        <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold shadow-md">
                            ÚLTIMAS {producto.stock}
                        </div>
                    )}
                    {/* Badge 2x1 o promoción (ejemplo) */}
                    {producto.stock > 10 && (
                        <div className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded font-bold shadow-md">
                            OFERTA
                        </div>
                    )}
                </div>

                {/* Corazón de favorito */}
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        console.log('Favorito:', producto.producto_id);
                    }}
                    className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
                    aria-label="Agregar a favoritos"
                >
                    <span className="text-lg">🤍</span>
                </button>
            </a>

            {/* Información del producto */}
            <div className="p-3 flex flex-col flex-grow">
                {/* Marca y Modelo */}
                {producto.marca && (
                    <p className="text-xs text-gray-600 font-medium mb-1">
                        {producto.marca}{producto.modelo ? ` - ${producto.modelo}` : ''}
                    </p>
                )}

                {/* Nombre del producto - Clickeable */}
                <a href={urlDetalle} className="block">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                        {producto.nombre}
                    </h3>
                </a>

                {/* Descripción breve */}
                {producto.descripcion && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {producto.descripcion}
                    </p>
                )}

                {/* Categoría */}
                {producto.categoria_nombre && (
                    <span className="text-xs text-gray-500 mb-2">
                        en <span className="text-blue-600 hover:underline">{producto.categoria_nombre}</span>
                    </span>
                )}

                {/* Precio y opciones de compra */}
                <div className="mt-auto">
                    {/* Precio principal */}
                    <div className="mb-3">
                        <div className="text-2xl font-black text-gray-900">
                            {formatearPrecio(producto.precio)}
                        </div>
                        <p className="text-xs text-green-700 font-medium">
                            {Math.round(producto.precio * 0.10) > 0 && `Envío gratis`}
                        </p>
                        <p className="text-xs text-gray-500">
                            en 12x ${Math.round(producto.precio / 12).toLocaleString('es-AR')}
                        </p>
                    </div>

                    {/* Botón de agregar al carrito */}
                    <a
                        href={urlDetalle}
                        className={`
                            block w-full py-2.5 rounded-lg font-semibold text-sm text-center transition-all
                            ${sinStock 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                            }
                        `}
                    >
                        {sinStock ? 'Sin stock' : 'Ver producto'}
                    </a>
                </div>
            </div>
        </article>
    );
}
