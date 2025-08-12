'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Stable form container that prevents layout shifts
export const StableFormContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'space-y-6 p-1 form-container', // Small padding to prevent content touching edges
      className
    )}
    {...props}
  >
    {children}
  </div>
));
StableFormContainer.displayName = 'StableFormContainer';

// Stable form field that reserves space for all states
export const StableFormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label?: string;
    required?: boolean;
    error?: string;
    description?: string;
    children: React.ReactNode;
  }
>(({ className, label, required, error, description, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('form-field', className)}
    {...props}
  >
    {label && (
      <label className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    
    <div style={{ minHeight: '40px' }}>
      {children}
    </div>
    
    {/* Always render error/description container to prevent layout shifts */}
    <div className="form-error">
      {error ? (
        <span>{error}</span>
      ) : description ? (
        <span className="form-description">{description}</span>
      ) : (
        <span className="text-transparent">.</span> // Invisible placeholder
      )}
    </div>
  </div>
));
StableFormField.displayName = 'StableFormField';

// Stable input that doesn't cause layout shifts
export const StableInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
  }
>(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'stable-input',
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      className
    )}
    {...props}
  />
));
StableInput.displayName = 'StableInput';

// Stable textarea
export const StableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: boolean;
  }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'stable-input min-h-[80px] resize-none',
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      className
    )}
    {...props}
  />
));
StableTextarea.displayName = 'StableTextarea';

// Stable select
export const StableSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    error?: boolean;
    options: { value: string; label: string }[];
    placeholder?: string;
  }
>(({ className, error, options, placeholder = 'Select an option', ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'stable-select',
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      className
    )}
    {...props}
  >
    <option value="" disabled>
      {placeholder}
    </option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
));
StableSelect.displayName = 'StableSelect';

// Stable button that doesn't shift on state changes
export const StableButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
  }
>(({ className, variant = 'default', size = 'md', loading, children, disabled, ...props }, ref) => {
  const baseClasses = 'stable-button inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };
  
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 py-2 px-4',
    lg: 'h-11 px-8',
  };

  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
});
StableButton.displayName = 'StableButton';
