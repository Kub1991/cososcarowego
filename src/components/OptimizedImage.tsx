import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/jpiDCxkCbo0.movieposter_maxres.jpg',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // If priority, load immediately
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Generate srcSet for different screen sizes
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc.includes('image.tmdb.org')) {
      return baseSrc; // For non-TMDB images, return as is
    }

    // TMDB image sizes: w92, w154, w185, w342, w500, w780, original
    const sizes = [
      { width: 185, size: 'w185' },
      { width: 342, size: 'w342' },
      { width: 500, size: 'w500' },
      { width: 780, size: 'w780' }
    ];

    return sizes
      .map(({ width, size }) => {
        const url = baseSrc.replace(/w\d+/, size);
        return `${url} ${width}w`;
      })
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallbackSrc : src;
  const srcSet = generateSrcSet(imageSrc);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse flex items-center justify-center">
          <div className="text-neutral-600 text-xs">
            {isInView ? 'Ładowanie...' : ''}
          </div>
        </div>
      )}

      {/* Actual image - only render when in view or priority */}
      {(isInView || priority) && (
        <img
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && isLoaded && (
        <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
          <div className="text-neutral-500 text-xs text-center p-2">
            Nie udało się załadować obrazu
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;