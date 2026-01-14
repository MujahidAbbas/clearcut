import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-primary-light text-primary',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
