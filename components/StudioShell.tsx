'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ShaderCanvas from '@/components/ShaderCanvas';

const destinations = [
  { href: '/notes', label: 'notes' },
  { href: '/scrapbook', label: 'scrapbook' },
  { href: '/shot-list', label: 'shot list' },
  { href: '/script', label: 'script' },
];

export default function StudioShell({
  title, description, active, children, actions,
}: {
  title: string;
  description: string;
  active: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="studio-shell">
      <ShaderCanvas panel={1} opacity={0.24} />
      <div className="studio-content">
        <header className="studio-header no-print">
          <Link href="/dashboard" className="studio-brand" aria-label="Back to Draft dashboard">draft<span className="studio-brand-dot">.</span></Link>
          <nav className="studio-nav" aria-label="Creative tools">
            {destinations.map(item => (
              <Link key={item.href} href={item.href} aria-current={active === item.href ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/you" className="studio-profile">you</Link>
        </header>

        <section className="studio-intro">
          <h1 className="studio-title">{title}</h1>
          <div className="studio-intro-aside">
            <p className="studio-description">{description}</p>
            {actions && <div className="studio-actions no-print">{actions}</div>}
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
