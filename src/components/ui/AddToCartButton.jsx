import React, { useState } from 'react';
import { addToCart } from '../../hooks/useCart.js';

export default function AddToCartButton({ 
  producto, 
  cantidad = 1, 
  caracteristicas = null,
  className = "",
  children = "Agregar al carrito"
}) {
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleAddToCart = () => {
    setLoading(true);

    const itemCarrito = {
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_con_descuento || producto.precio,
      imagen: producto.imagen_url,
      cantidad: cantidad,
      caracteristicas: caracteristicas
    };

    addToCart(itemCarrito);

    // Mostrar feedback visual
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setLoading(false);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className={`relative bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Agregando...
          </span>
        ) : (
          children
        )}
      </button>

      {showFeedback && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          Producto agregado al carrito
        </div>
      )}
    </>
  );
}
