'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';

import './FlowingMenu.css';

interface MenuItemProps {
  link: string;
  text: string;
  disabled?: boolean;
  speed: number;
  textColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  borderColor: string;
}

interface FlowingMenuProps {
  items: Array<{ link: string; text: string; disabled?: boolean }>;
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
}

const formatText = (text: string) => {
  if (text === 'notes') return <>n<span className="italic">o</span>t<span className="italic">e</span>s</>;
  if (text === 'scrapbook') return <>s<span className="italic">c</span>r<span className="italic">a</span>pb<span className="italic">o</span>o<span className="italic">k</span></>;
  if (text === 'shot list') return <>sh<span className="italic">o</span>t l<span className="italic">i</span>st</>;
  if (text === 'script') return <>sc<span className="italic">r</span><span className="italic">i</span>pt</>;
  if (text === 'you') return <><span className="italic">y</span>ou</>;
  return text;
};

export default function FlowingMenu({
  items = [],
  speed = 15,
  textColor = 'var(--color-ink)',
  bgColor = 'transparent',
  marqueeBgColor = 'var(--color-rust)',
  marqueeTextColor = '#ffffff',
  borderColor = 'rgba(0,0,0,0.08)'
}: FlowingMenuProps) {
  return (
    <div className="menu-wrap" style={{ backgroundColor: bgColor }}>
      <nav className="menu">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
          />
        ))}
      </nav>
    </div>
  );
}

function MenuItem({
  link,
  text,
  disabled = false,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor
}: MenuItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(6);

  const animationDefaults = { duration: 0.5, ease: 'power2.out' };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number) => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - 0, 2);
    const bottomEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  };

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent = marqueeInnerRef.current.querySelector('.marquee__part') as HTMLElement;
      if (!marqueeContent) return;
      const contentWidth = marqueeContent.offsetWidth;
      const viewportWidth = window.innerWidth;
      const needed = Math.ceil(viewportWidth / (contentWidth || 200)) + 3;
      setRepetitions(Math.max(6, needed));
    };

    calculateRepetitions();
    window.addEventListener('resize', calculateRepetitions);
    return () => window.removeEventListener('resize', calculateRepetitions);
  }, [text]);

  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent = marqueeInnerRef.current.querySelector('.marquee__part') as HTMLElement;
      if (!marqueeContent) return;
      const contentWidth = marqueeContent.offsetWidth;
      if (contentWidth === 0) return;

      if (animationRef.current) animationRef.current.kill();

      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -contentWidth,
        duration: speed,
        ease: 'none',
        repeat: -1
      });
    };

    const timer = setTimeout(setupMarquee, 100);
    return () => {
      clearTimeout(timer);
      if (animationRef.current) animationRef.current.kill();
    };
  }, [text, repetitions, speed]);

  const handleEnter = (clientX: number, clientY: number) => {
    if (disabled || !itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap.timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
  };

  const handleLeave = (clientX: number, clientY: number) => {
    if (disabled || !itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap.timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0);
  };

  const content = (
    <span className="menu__item-link font-degraded italic" style={{ color: disabled ? 'var(--color-muted)' : textColor }}>
      {text}
    </span>
  );

  return (
    <div 
      className={`menu__item ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      ref={itemRef} 
      style={{ borderColor }}
      onMouseEnter={(e) => handleEnter(e.clientX, e.clientY)}
      onMouseLeave={(e) => handleLeave(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches[0]) handleEnter(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={(e) => {
        if (e.changedTouches[0]) handleLeave(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }}
    >
      {disabled ? (
        <div className="w-full h-full flex items-center justify-center cursor-default select-none" title="Coming soon">
          {content}
        </div>
      ) : (
        <Link href={link} className="w-full h-full block">
          {content}
        </Link>
      )}

      {!disabled && (
        <div className="marquee" ref={marqueeRef} style={{ backgroundColor: marqueeBgColor }}>
          <div className="marquee__inner-wrap">
            <div className="marquee__inner" ref={marqueeInnerRef} aria-hidden="true">
              {[...Array(repetitions)].map((_, idx) => {
                const isItalic = idx % 2 === 1;
                return (
                  <div 
                    className={`marquee__part font-degraded ${isItalic ? 'italic' : 'not-italic'}`} 
                    key={idx} 
                    style={{ color: marqueeTextColor }}
                  >
                    <span>{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
