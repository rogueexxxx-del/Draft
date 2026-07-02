'use client';
import { useState, useRef } from 'react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  onClick?: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function SwipeableCard({ children, onDelete, onClick, className, style }: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startX.current = clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startX.current === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = clientX - startX.current;
    if (diff < 0) { // only swipe left
      setOffset(diff);
    }
  };
  
  const handleTouchEnd = () => {
    if (startX.current === null) return;
    if (offset < -100) {
      onDelete();
    } else {
      setOffset(0);
    }
    startX.current = null;
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden" 
      onClick={(e) => {
        if (Math.abs(offset) > 10) {
          e.preventDefault();
        } else if (onClick) {
          onClick(e);
        }
      }}
    >
      <div className="absolute inset-0 bg-red-900/50 flex items-center justify-end pr-8 text-white font-bold tracking-widest z-0">
        DELETE
      </div>
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        className={`relative z-10 w-full h-full transition-transform ${offset === 0 ? 'duration-300' : 'duration-0'} ${className}`}
        style={{ ...style, transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
