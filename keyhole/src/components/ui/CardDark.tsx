import React from 'react';
import { clsx } from 'clsx';

interface CardDarkProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  children: React.ReactNode;
}

export const CardDark: React.FC<CardDarkProps> = ({ hoverable = true, className, children, ...props }) => {
  return (
    <div
      className={clsx(
        'card-dark p-6 relative overflow-hidden',
        hoverable && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
