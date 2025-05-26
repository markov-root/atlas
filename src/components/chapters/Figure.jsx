// src/components/chapters/Figure.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from '@docusaurus/router';

/**
 * Figure component for displaying images with captions and click-to-zoom
 */
function Figure({ src, alt, caption, width, height, chapter, figure }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const location = useLocation();

  // Resolve relative paths for Docusaurus
  const getImageSrc = () => {
    if (src.startsWith('./')) {
      const currentPath = location.pathname;
      const relativePath = src.replace('./', '');
      
      if (currentPath.includes('/chapters/')) {
        const chapterPath = currentPath.split('/').slice(0, 3).join('/');
        return `${chapterPath}/${relativePath}`;
      }
      
      return `/${relativePath}`;
    }
    
    return src;
  };

  const imageSrc = getImageSrc();

  // Generate figure label
  const getFigureLabel = () => {
    if (chapter && figure) {
      return `Figure ${chapter}.${figure}`;
    } else if (figure) {
      return `Figure ${figure}`;
    }
    return '';
  };

  // Generate full caption with figure numbering
  const getFullCaption = () => {
    const figureLabel = getFigureLabel();
    
    if (caption) {
      if (caption.match(/^Figure \d+(\.\d+)?:/)) {
        return caption;
      } else if (figureLabel) {
        return `${figureLabel}: ${caption}`;
      } else {
        return caption;
      }
    } else if (figureLabel) {
      return figureLabel;
    }
    
    return '';
  };

  const fullCaption = getFullCaption();

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const handleImageClick = () => {
    if (!hasError && isLoaded) {
      setIsZoomed(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleZoomClose = () => {
    setIsZoomed(false);
    document.body.style.overflow = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleZoomClose();
    }
  };

  // Add/remove global event listener for ESC key
  useEffect(() => {
    if (isZoomed) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isZoomed]);

  // Process markdown links in caption
  const processMarkdownLinks = (text) => {
    if (!text) return '';
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #1971c2; text-decoration: none;">$1</a>'
    );
  };

  return (
    <>
      <figure style={{ 
        margin: '2rem 0', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        maxWidth: '100%'
      }}>
        <div style={{ 
          position: 'relative', 
          maxWidth: '100%', 
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {!isLoaded && !hasError && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '50%',
                borderTopColor: '#1971c2',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          )}
          
          {hasError ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#c92a2a'
            }}>
              <p>Failed to load image: {alt}</p>
              <p style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                Source: {imageSrc}
              </p>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={alt}
              style={{ 
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
                width: width || 'auto',
                opacity: isLoaded ? 1 : 0,
                cursor: isLoaded ? 'zoom-in' : 'default',
                transition: 'opacity 0.3s ease, transform 0.2s ease',
                borderRadius: '4px'
              }}
              onLoad={handleLoad}
              onError={handleError}
              onClick={handleImageClick}
              onMouseEnter={(e) => {
                if (isLoaded) {
                  e.target.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (isLoaded) {
                  e.target.style.transform = 'scale(1)';
                }
              }}
            />
          )}
        </div>
        
        {fullCaption && (
          <figcaption 
            style={{
              marginTop: '0.75rem',
              fontSize: '0.9rem',
              color: 'var(--atlas-text-tertiary, #6c757d)',
              textAlign: 'center',
              padding: '0 1rem',
              lineHeight: '1.5',
              maxWidth: '90%'
            }}
            dangerouslySetInnerHTML={{ __html: processMarkdownLinks(fullCaption) }}
          />
        )}
      </figure>

      {/* Zoom Modal - Only render when isZoomed is true */}
      {isZoomed && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            lineHeight: '1.5',
            textAlign: 'center'
          }}
          onClick={handleZoomClose}
        >
          {/* Close button */}
          <button
            onClick={handleZoomClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '44px',
              height: '44px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              zIndex: 100001,
              transition: 'background-color 0.2s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ×
          </button>

          {/* Image container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '95vw',
              maxHeight: '95vh',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main image */}
            <img
              src={imageSrc}
              alt={alt}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                cursor: 'zoom-out',
                margin: 0,
                padding: 0,
                border: 'none'
              }}
              onClick={handleZoomClose}
            />

            {/* Caption */}
            {fullCaption && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  maxWidth: '80vw',
                  textAlign: 'center',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
                dangerouslySetInnerHTML={{ __html: processMarkdownLinks(fullCaption) }}
              />
            )}

            {/* Hint text */}
            <div
              style={{
                marginTop: '16px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              Press ESC or click outside to close
            </div>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default Figure;
