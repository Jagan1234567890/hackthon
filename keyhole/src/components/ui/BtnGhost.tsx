import React from 'react';
import { clsx } from 'clsx';

interface BtnGhostProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const BtnGhost: React.FC<BtnGhostProps> = ({ disabled, className, children, ...props }) => {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'btn-ghost inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
