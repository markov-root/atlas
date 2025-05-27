// src/theme/DocItem/Landing/ChapterSummaryModal.jsx
import React from 'react';

export default function ChapterSummaryModal({ chapter, onClose }) {
  if (!chapter) return null;

  const resourceButtons = [
    { key: 'chapter', label: 'Read Online', icon: '/img/icons/read.svg', url: chapter.resources.chapter, available: !!chapter.resources.chapter },
    { key: 'video', label: 'Watch Video', icon: '/img/icons/video.svg', url: chapter.resources.video, available: !!chapter.resources.video },
    { key: 'audio', label: 'Listen Audio', icon: '/img/icons/audio.svg', url: chapter.resources.audio, available: !!chapter.resources.audio },
    { key: 'pdf', label: 'Download PDF', icon: '/img/icons/pdf.svg', url: chapter.resources.pdf, available: !!chapter.resources.pdf },
    { key: 'facilitation', label: 'Teaching Guide', icon: '/img/icons/facilitation.svg', url: chapter.resources.facilitation, available: !!chapter.resources.facilitation }
  ];

  const readingTimes = {
    core: chapter.reading_time_core || "61 min",
    optional: chapter.reading_time_optional || "10 min", 
    appendix: chapter.reading_time_appendix || "18 min"
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '700',
            fontFamily: 'monospace'
          }}>
            {chapter.number.toString().padStart(2, '0')}
          </div>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '4px'
            }}>
              {chapter.title}
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              fontStyle: 'italic',
              margin: 0
            }}>
              {chapter.subtitle}
            </p>
          </div>
        </div>

        {/* Reading Time */}
        <div style={{
          padding: '16px 0',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Reading Time
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1971c2' }}>
                {readingTimes.core}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                core
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1971c2' }}>
                {readingTimes.optional}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                optional
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1971c2' }}>
                {readingTimes.appendix}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                appendix
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#374151',
          marginBottom: '24px'
        }}>
          {chapter.description}
        </p>

        {/* Quote */}
        {chapter.quote && (
          <blockquote style={{
            borderLeft: '4px solid #1971c2',
            paddingLeft: '16px',
            marginBottom: '32px',
            fontStyle: 'italic',
            color: '#4b5563'
          }}>
            "{chapter.quote.text}"
            <footer style={{ 
              marginTop: '8px', 
              fontSize: '14px', 
              color: '#6b7280',
              fontStyle: 'normal'
            }}>
              — {chapter.quote.author}
            </footer>
          </blockquote>
        )}

        {/* Resource Actions */}
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1a202c'
          }}>
            Available Resources
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px'
          }}>
            {resourceButtons.filter(resource => resource.available).map(resource => (
              <button
                key={resource.key}
                onClick={() => resource.url && window.open(resource.url, '_blank')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #1971c2',
                  backgroundColor: '#f0f7ff',
                  color: '#1971c2',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dbeafe';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f0f7ff';
                }}
              >
                <img 
                  src={resource.icon} 
                  alt=""
                  style={{
                    width: '16px',
                    height: '16px'
                  }}
                />
                {resource.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
