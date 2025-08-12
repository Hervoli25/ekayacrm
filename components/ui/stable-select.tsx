'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StableSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  success?: string;
  description?: string;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const StableSelect = React.forwardRef<HTMLSelectElement, StableSelectProps>(
  ({ 
    className, 
    error,
    success,
    description,
    label,
    required,
    options,
    placeholder = 'Select an option',
    ...props 
  }, ref) => {
    const selectElement = (
      <div className="relative">
        <select
          className={cn(
            'stable-select appearance-none',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            success && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            className
          )}
          ref={ref}
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
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    );

    if (label || error || success || description) {
      return (
        <div className="form-field">
          {label && (
            <label className="form-label">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {selectElement}
          {description && !error && !success && (
            <div className="form-description">{description}</div>
          )}
          {error && <div className="form-error">{error}</div>}
          {success && !error && <div className="form-success">{success}</div>}
        </div>
      );
    }

    return selectElement;
  }
);

StableSelect.displayName = 'StableSelect';

export { StableSelect };
