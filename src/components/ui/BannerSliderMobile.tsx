// Slider de banners optimizado para móviles con deslizamiento táctil
import { useState, useEffect, useRef } from 'react';

// Interfaz para los datos de cada banner
interface Banner {
  banner_id: number;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  orden: number;
  activo: boolean;
}

// URL base de la API
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

export default function BannerSliderMobile() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar banners desde la API
  useEffect(() => {
    const cargarBanners = async () => {
      try {
        const response = await fetch(`${API_URL}/banners`);
        if (response.ok) {
          const data = await response.json();
          setBanners(data);
        }
      } catch (error) {
        console.error('Error al cargar banners:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarBanners();
  }, []);

  // Auto-slide cada 5 segundos
  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Manejo de gestos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < banners.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (loading) {
    return (
      <div className="w-full px-3 py-3">
        <div className="bg-gray-200 rounded-2xl h-44 animate-pulse"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        .banner-translate-${currentIndex} {
          transform: translateX(-${currentIndex * 100}%);
        }
        .banner-slide {
          min-width: 100%;
          width: 100%;
        }
      `}</style>
      <div className="w-full bg-white py-3">
        {/* Contenedor del slider con gestos táctiles */}
        <div className="px-3">
          <div 
            ref={containerRef}
            className="relative overflow-hidden rounded-2xl shadow-lg"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Wrapper de banners */}
            <div className={`flex transition-transform duration-500 ease-out banner-translate-${currentIndex}`}>
              {banners.map((banner) => (
                <div 
                  key={banner.banner_id} 
                  className="banner-slide flex-shrink-0"
                >
                  <img
                    src={banner.imagen_url}
                    alt={banner.titulo || 'Banner'}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
