import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface BtnPrimaryProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

export const BtnPrimary: React.FC<BtnPrimaryProps> = ({
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={clsx(
        'btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-150 select-none cursor-pointer',
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white/90" />}
      {children}
    </button>
  );
};
