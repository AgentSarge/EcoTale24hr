import { FC, useState, useEffect, useRef } from 'react';
import { monitoring } from '@/lib/monitoring';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const OptimizedImage: FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onLoad,
  onError,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority) {
      return;
    }

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src;
          observerRef.current?.disconnect();
        }
      });
    }, options);

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();

    // Track image load performance
    if (window.performance && imgRef.current) {
      const loadTime = window.performance.now();
      monitoring.setTag('image_load_time', `${Math.round(loadTime)}ms`);
    }
  };

  const handleError = () => {
    const error = new Error(`Failed to load image: ${src}`);
    setError(error);
    onError?.(error);
    monitoring.captureException(error);
  };

  // Generate WebP source if possible
  const webpSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');

  return (
    <picture className={`block ${className}`}>
      <source
        type="image/webp"
        srcSet={webpSrc}
        media="(min-width: 1px)"
      />
      <img
        ref={imgRef}
        src={priority ? src : ''}
        alt={alt}
        width={width}
        height={height}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${loaded ? 'opacity-100' : 'opacity-0'}
          ${error ? 'hidden' : ''}
        `}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
      {error && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </picture>
  );
};

export default OptimizedImage; 