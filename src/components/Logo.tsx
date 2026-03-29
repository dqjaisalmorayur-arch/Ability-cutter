import React from 'react';

export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      {/* Outer ring */}
      <path 
        d="M50 10 A40 40 0 1 1 20 80" 
        strokeWidth="12" 
        strokeLinecap="round"
        className="opacity-40"
      />
      {/* Inner part */}
      <path 
        d="M20 50 A30 30 0 0 1 50 20" 
        strokeWidth="12" 
        strokeLinecap="round"
      />
      {/* Accent dot */}
      <circle cx="25" cy="35" r="6" fill="currentColor" stroke="none" />
    </svg>
  );
}
