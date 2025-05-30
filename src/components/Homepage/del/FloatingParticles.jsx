// src/components/Homepage/FloatingParticles.jsx
import React from 'react';

export default function FloatingParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    animationDuration: Math.random() * 10 + 15,
    delay: Math.random() * 5
  }));

  return (
    <>
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.initialX}%`,
              top: `${particle.initialY}%`,
              background: 'white',
              opacity: 0.1,
              borderRadius: '50%',
              animation: `float ${particle.animationDuration}s linear infinite`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(180deg); 
          }
        }
      `}</style>
    </>
  );
}
