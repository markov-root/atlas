// src/theme/DocItem/Landing/BookCard.jsx
import React from 'react';

export default function BookCard({ chapter, onClick }) {
  const resourceButtons = [
    { key: 'chapter', label: 'Read Online', icon: '/img/icons/read.svg', url: chapter.resources.chapter, available: !!chapter.resources.chapter },
    { key: 'video', label: 'Watch Video', icon: '/img/icons/video.svg', url: chapter.resources.video, available: !!chapter.resources.video },
    { key: 'audio', label: 'Listen Audio', icon: '/img/icons/audio.svg', url: chapter.resources.audio, available: !!chapter.resources.audio },
    { key: 'pdf', label: 'Download PDF', icon: '/img/icons/pdf.svg', url: chapter.resources.pdf, available: !!chapter.resources.pdf },
    { key: 'facilitation', label: 'Teaching Guide', icon: '/img/icons/facilitation.svg', url: chapter.resources.facilitation, available: !!chapter.resources.facilitation }
  ];

  const handleResourceClick = (e, url) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Extract reading times from frontmatter - you'll need to fetch this from the actual markdown files
  // For now using placeholder data, but this should come from the chapter frontmatter
  const readingTimes = {
    core: chapter.reading_time_core || "61 min",
    optional: chapter.reading_time_optional || "10 min", 
    appendix: chapter.reading_time_appendix || "18 min"
  };

  return (
    <div 
      onClick={() => onClick && onClick(chapter)}
      style={{
        width: '260px',
        height: '360px',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '0 16px 16px 0',
        border: '1px solid #e2e8f0',
        borderLeft: '8px solid #334155',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 0 16px 0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      {/* Book spine effect with chapter number */}
      <div style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '700',
        fontFamily: 'monospace',
        boxShadow: '0 2px 8px rgba(30, 41, 59, 0.3)',
        zIndex: 2
      }}>
        {chapter.number.toString().padStart(2, '0')}
      </div>

      {/* Main content area */}
      <div style={{
        padding: '24px',
        paddingTop: '80px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '16px'
      }}>
        {/* Title */}
        <h3 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#1a202c',
          margin: '0',
          lineHeight: '1.2',
          textAlign: 'left'
        }}>
          {chapter.title}
        </h3>

        {/* Reading time breakdown */}
        <div style={{
          background: '#f1f5f9',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px'
          }}>
            Reading Time
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1971c2' }}>
                {readingTimes.core}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                core
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1971c2' }}>
                {readingTimes.optional}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                optional
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1971c2' }}>
                {readingTimes.appendix}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                appendix
              </div>
            </div>
          </div>
        </div>

        {/* Resource buttons - large icons with tooltips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: 'auto'
        }}>
          {resourceButtons.filter(resource => resource.available).map(resource => (
            <div
              key={resource.key}
              onClick={(e) => handleResourceClick(e, resource.url)}
              style={{
                height: '50px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              title={resource.label}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f7ff';
                e.target.style.borderColor = '#1971c2';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <img 
                src={resource.icon} 
                alt={resource.label}
                style={{
                  width: '28px',
                  height: '28px',
                  opacity: 0.8
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
