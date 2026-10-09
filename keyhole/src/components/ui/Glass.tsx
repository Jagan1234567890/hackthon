import React from 'react';
import { clsx } from 'clsx';

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  children: React.ReactNode;
}

export const Glass: React.FC<GlassProps> = ({ elevated = false, className, children, ...props }) => {
  return (
    <div
      className={clsx(
        elevated ? 'glass-elevated' : 'glass',
        'rounded-2xl relative transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
