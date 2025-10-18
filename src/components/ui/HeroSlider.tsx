import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: number;
  image: string;
  alt: string;
}

const banners: Banner[] = [
  { id: 1, image: '/images/B1.svg', alt: 'Banner 1 - Mundo Pañal' },
  { id: 2, image: '/images/B2.svg', alt: 'Banner 2 - Ofertas Especiales' },
  { id: 3, image: '/images/B1.svg', alt: 'Banner 3 - Mundo Pañal' },
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const totalSlides = banners.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-slide cada 3 segundos
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(nextSlide, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovered, nextSlide]);

  return (
    <section 
      className="relative w-screen overflow-hidden bg-yellow-300 h-[320px] md:h-[600px] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
      style={{ left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slider Wrapper */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}vw)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-screen flex-shrink-0 h-full">
            <img
              src={banner.image}
              alt={banner.alt}
              className="w-screen h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Difuminado inferior totalmente blanco y fuerte */}
      <div 
        className="pointer-events-none absolute left-0 right-0 bottom-0 h-6 md:h-8 z-10"
        style={{background: 'linear-gradient(to top, rgba(255,255,255,1) 60%, rgba(255,255,255,0) 100%)'}}
      />

      {/* Botón Anterior */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 
                   bg-white/70 hover:bg-white rounded-full p-2 
                   transition-all duration-200 shadow-md hover:shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>

      {/* Botón Siguiente */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 
                   bg-white/70 hover:bg-white rounded-full p-2 
                   transition-all duration-200 shadow-md hover:shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>
      
    </section>
  );
}
