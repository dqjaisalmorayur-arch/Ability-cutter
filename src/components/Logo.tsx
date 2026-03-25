import React from 'react';

export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      aria-hidden="true"
    >
      {/* Green outer ring */}
      <path 
        d="M50 10 A40 40 0 1 1 20 80" 
        fill="none" 
        stroke="#10b981" 
        strokeWidth="15" 
        strokeLinecap="round"
      />
      {/* Blue inner part */}
      <path 
        d="M20 50 A30 30 0 0 1 50 20" 
        fill="none" 
        stroke="#0ea5e9" 
        strokeWidth="15" 
        strokeLinecap="round"
      />
      {/* Blue dot */}
      <circle cx="25" cy="35" r="8" fill="#0ea5e9" />
    </svg>
  );
}
