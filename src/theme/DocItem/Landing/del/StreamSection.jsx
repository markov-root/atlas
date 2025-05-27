// src/theme/DocItem/Landing/StreamSection.jsx
import React from 'react';
import BookCard from './BookCard';

export default function StreamSection({ stream, flippedChapter, onChapterToggle }) {
  return (
    <div style={{ marginBottom: '64px' }}>
      {/* Stream header */}
      <div style={{
        marginBottom: '32px'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#1a202c',
          marginBottom: '8px',
          textAlign: 'left'
        }}>
          {stream.title}
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          maxWidth: '600px',
          textAlign: 'left'
        }}>
          {stream.description}
        </p>
      </div>

      {/* Chapters - responsive horizontal grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        justifyContent: 'start'
      }}>
        {stream.chapters.map(chapter => (
          <BookCard
            key={chapter.id}
            chapter={chapter}
            isFlipped={flippedChapter?.id === chapter.id}
            onToggle={onChapterToggle}
          />
        ))}
      </div>
    </div>
  );
}
