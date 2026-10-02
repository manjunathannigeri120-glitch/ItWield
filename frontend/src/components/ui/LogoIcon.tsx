import React from 'react';

export function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gold1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#D47500" />
        </linearGradient>
        <linearGradient id="gold2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD24D" />
          <stop offset="50%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#B35D00" />
        </linearGradient>
        <linearGradient id="gold3" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF099" />
          <stop offset="50%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#CC6600" />
        </linearGradient>
      </defs>
      
      <g strokeWidth="2" stroke="white" strokeLinejoin="round">
          {/* Outer Chevrons */}
          <path d="M 22 35 L 60 13 L 98 35 L 85 42.5 L 60 28 L 35 42.5 Z" fill="url(#gold1)" />
          <path d="M 103 43 L 103 82 L 65 104 L 65 89 L 90 75 L 90 48 Z" fill="url(#gold2)" />
          <path d="M 17 43 L 17 82 L 55 104 L 55 89 L 30 75 L 30 48 Z" fill="url(#gold3)" />
          
          {/* Inner Chevrons */}
          <path d="M 38 45 L 60 32 L 82 45 L 75 49 L 60 40 L 45 49 Z" fill="url(#gold2)" />
          <path d="M 86 52 L 86 72 L 64 84 L 64 76 L 76 69 L 76 55 Z" fill="url(#gold3)" />
          <path d="M 34 52 L 34 72 L 56 84 L 56 76 L 44 69 L 44 55 Z" fill="url(#gold1)" />
          
          {/* Center Hexagon */}
          <polygon points="60,45 70,51 70,63 60,69 50,63 50,51" fill="url(#gold1)" />
      </g>
    </svg>
  );
}
