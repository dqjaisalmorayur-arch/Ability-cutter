import React from 'react';

export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center font-black tracking-tighter bg-ability-blue text-white rounded-xl ${className}`} style={{ fontSize: '1.2em' }}>
      AB
    </div>
  );
}
