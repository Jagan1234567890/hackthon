import React from 'react';
import { clsx } from 'clsx';

interface PillBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  withDot?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
  withDot = false,
  variant = 'primary',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    primary: 'border-[oklch(0.62_0.22_295/35%)] bg-[oklch(0.62_0.22_295/12%)] text-[oklch(0.85_0.12_295)]',
    success: 'border-[oklch(0.72_0.17_155/35%)] bg-[oklch(0.72_0.17_155/12%)] text-[oklch(0.85_0.12_155)]',
    warning: 'border-[oklch(0.78_0.15_85/35%)] bg-[oklch(0.78_0.15_85/12%)] text-[oklch(0.88_0.12_85)]',
    danger: 'border-[oklch(0.63_0.2_25/35%)] bg-[oklch(0.63_0.2_25/12%)] text-[oklch(0.85_0.15_25)]',
    neutral: 'border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.11_0.008_280)] text-[oklch(0.75_0.01_280)]',
  };

  const dotColors = {
    primary: 'bg-[oklch(0.62_0.22_295)]',
    success: 'bg-[oklch(0.72_0.17_155)]',
    warning: 'bg-[oklch(0.78_0.15_85)]',
    danger: 'bg-[oklch(0.63_0.2_25)]',
    neutral: 'bg-[oklch(0.66_0.015_280)]',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium tracking-wide border select-none transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {withDot && (
        <span className={clsx('w-2 h-2 rounded-full live-dot shrink-0', dotColors[variant])} />
      )}
      <span>{children}</span>
    </div>
  );
};
