import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface DatabaseImageProps {
  /** Blob ID from database */
  blobId: string;
  /** Alt text for accessibility */
  alt?: string;
  /** CSS classes for styling */
  className?: string;
  /** Fallback image if blob fails to load */
  fallback?: string;
  /** Show loading skeleton */
  showLoading?: boolean;
  /** Loading skeleton CSS classes */
  loadingClassName?: string;
  /** On error callback */
  onError?: (error: Error) => void;
}

/**
 * DatabaseImage Component
 * 
 * Professional-grade image component that ALWAYS fetches from database BLOB storage.
 * Ensures images persist through subscription renewals and database restores.
 * 
 * Features:
 * - Automatic database fetching
 * - Loading skeleton
 * - Error handling with fallback
 * - Caching support
 * - TypeScript type safety
 * 
 * Usage:
 * <DatabaseImage 
 *   blobId={settings.logo_blob_id}
 *   alt="Company Logo"
 *   className="h-16 object-contain"
 * />
 */
const DatabaseImage: React.FC<DatabaseImageProps> = ({
  blobId,
  alt = 'Image',
  className = '',
  fallback = '/placeholder.png',
  showLoading = true,
  loadingClassName = '',
  onError
}) => {
  const [imageSrc, setImageSrc] = useState<string>(fallback);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Reset state when blobId changes
    if (!blobId) {
      setImageSrc(fallback);
      setLoading(false);
      setError(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    // Always fetch from database - ensures data persistence
    api.getBlobAsBase64(blobId)
      .then(base64 => {
        if (isMounted) {
          setImageSrc(base64);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error(`Failed to load image [${blobId}]:`, err);
          setError(true);
          setImageSrc(fallback);
          setLoading(false);
          
          if (onError) {
            onError(err);
          }
        }
      });

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [blobId, fallback, onError]);

  // Show loading skeleton
  if (loading && showLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded ${loadingClassName || className}`}
        role="img"
        aria-label="Loading image..."
      />
    );
  }

  // Show error state (optional)
  if (error && !fallback) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded ${className}`}
        role="img"
        aria-label="Image failed to load"
      >
        <span className="text-gray-400 text-sm">Image not available</span>
      </div>
    );
  }

  // Render image
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        console.warn(`Image failed to display [${blobId}]`);
        if (imageSrc !== fallback) {
          setImageSrc(fallback);
        }
      }}
      // Browser caching hint
      loading="lazy"
    />
  );
};

export default DatabaseImage;
