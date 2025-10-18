/**
 * Componente de tarjeta de combo
 * Diseño inspirado en Mercado Libre
 * Muestra imagen, nombre, precio, productos incluidos y acceso al detalle
 */
export default function ComboCard({ combo }) {
    // Función para formatear el precio en pesos argentinos
    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    };

    // Obtener imagen principal del primer producto del combo
    const imagenPrincipal = combo.imagen_url || combo.combo_productos?.[0]?.productos?.imagen_url || '/images/placeholder.svg';
    
    // Calcular ahorro
    let precioTotalIndividual = 0;
    combo.combo_productos?.forEach(item => {
        if (item.productos) {
            precioTotalIndividual += item.productos.precio * item.cantidad;
        }
    });
    
    const ahorro = precioTotalIndividual - combo.precio_combo;
    const porcentajeAhorro = precioTotalIndividual > 0 
        ? ((ahorro / precioTotalIndividual) * 100).toFixed(0)
        : 0;

    // URL del detalle del combo
    const urlDetalle = `/combo/${combo.combo_id}`;

    return (
        <article className="group bg-white rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Contenedor de imagen - Clickeable */}
            <a href={urlDetalle} className="relative bg-gray-50 overflow-hidden aspect-square block">
                <img
                    src={imagenPrincipal}
                    alt={combo.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />

                {/* Badge de combo especial */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded font-bold shadow-md">
                        🎁 COMBO
                    </div>
                    {porcentajeAhorro > 0 && (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold shadow-md">
                            AHORRA {porcentajeAhorro}%
                        </div>
                    )}
                </div>

                {/* Número de productos */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded font-semibold">
                    {combo.combo_productos?.length || 0} productos
                </div>
            </a>

            {/* Información del combo */}
            <div className="p-3 flex flex-col flex-grow">
                {/* Nombre del combo - Clickeable */}
                <a href={urlDetalle} className="block">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                        {combo.nombre}
                    </h3>
                </a>

                {/* Lista de productos en el combo */}
                {combo.combo_productos && combo.combo_productos.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-600 font-medium mb-1">Incluye:</p>
                        <ul className="space-y-1">
                            {combo.combo_productos.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-xs text-gray-600 line-clamp-1">
                                    • {item.cantidad}x {item.productos?.nombre}
                                </li>
                            ))}
                            {combo.combo_productos.length > 3 && (
                                <li className="text-xs text-blue-600 font-medium">
                                    + {combo.combo_productos.length - 3} más...
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {/* Precios y ahorro */}
                <div className="mt-auto">
                    <div className="mb-3">
                        {/* Precio individual vs combo */}
                        <div className="mb-2">
                            {precioTotalIndividual > combo.precio_combo ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-gray-500 line-through">
                                            {formatearPrecio(precioTotalIndividual)}
                                        </span>
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">
                                            COMBO
                                        </span>
                                    </div>
                                    <div className="text-2xl font-black text-green-700">
                                        {formatearPrecio(combo.precio_combo)}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ahorrás {formatearPrecio(ahorro)}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-2xl font-black text-gray-900">
                                    {formatearPrecio(combo.precio_combo)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botón ver detalle */}
                    <a
                        href={urlDetalle}
                        className="block w-full py-2.5 rounded-lg font-semibold text-sm text-center transition-all bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
                    >
                        Ver combo
                    </a>
                </div>
            </div>
        </article>
    );
}
