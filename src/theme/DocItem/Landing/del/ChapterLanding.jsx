// src/theme/DocItem/Landing/ChapterLanding.jsx
import React, { useState } from 'react';
import StreamSection from './StreamSection';
import chaptersData from '../../../data/chapters.json';

export default function ChapterLanding() {
  const [flippedChapter, setFlippedChapter] = useState(null);

  const handleChapterToggle = (chapter) => {
    if (flippedChapter?.id === chapter.id) {
      setFlippedChapter(null); // Flip back to front
    } else {
      setFlippedChapter(chapter); // Flip to back
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'transparent',
      padding: '40px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '48px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '16px',
          textAlign: 'left'
        }}>
          AI Safety Atlas
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#64748b',
          maxWidth: '800px',
          textAlign: 'left'
        }}>
          A comprehensive guide to AI safety and alignment research
        </p>
      </div>

      {/* Streams */}
      <div style={{
        maxWidth: '100%'
      }}>
        {chaptersData.streams.map(stream => (
          <StreamSection
            key={stream.id}
            stream={stream}
            flippedChapter={flippedChapter}
            onChapterToggle={handleChapterToggle}
          />
        ))}
      </div>
    </div>
  );
}
