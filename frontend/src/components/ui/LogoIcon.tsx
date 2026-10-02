import React from 'react';

export function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img src="/favicon.svg" className={className} alt="ItWield Logo" />
  );
}
