// src/components/Homepage/TypingAnimation.jsx
import React, { useState, useEffect } from 'react';

export default function TypingAnimation({ texts, className = '' }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeSpeed, setTypeSpeed] = useState(100);

  useEffect(() => {
    const handleTyping = () => {
      const fullText = texts[currentTextIndex];
      
      if (!isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        setTypeSpeed(100);
      } else {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        setTypeSpeed(50);
      }

      if (!isDeleting && currentText === fullText) {
        setTypeSpeed(2000); // Pause at full text
        setIsDeleting(true);
      } else if (isDeleting && currentText === '') {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        setTypeSpeed(100);
      }
    };

    const timer = setTimeout(handleTyping, typeSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentTextIndex, texts, typeSpeed]);

  return (
    <span className={className}>
      {currentText}
      <span style={{ animation: 'blink 1s infinite' }}>|</span>
      
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
