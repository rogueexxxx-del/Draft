'use client';

import { forwardRef } from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: React.ReactNode;
}

/**
 * 44×44px minimum touch-target icon button.
 * Requires aria-label. Renders children (icons) as aria-hidden.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 rounded-[2px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-[0.96] ${className}`}
      >
        <span aria-hidden="true">{children}</span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
export default IconButton;
