'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StableInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showPasswordToggle?: boolean;
  error?: string;
  success?: string;
  description?: string;
  label?: string;
  required?: boolean;
}

const StableInput = React.forwardRef<HTMLInputElement, StableInputProps>(
  ({ 
    className, 
    type, 
    showPasswordToggle = false, 
    error,
    success,
    description,
    label,
    required,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [inputType, setInputType] = React.useState(type);

    React.useEffect(() => {
      if (showPasswordToggle && type === 'password') {
        setInputType(showPassword ? 'text' : 'password');
      } else {
        setInputType(type);
      }
    }, [showPassword, type, showPasswordToggle]);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const inputElement = showPasswordToggle && type === 'password' ? (
      <div className="relative">
        <input
          type={inputType}
          className={cn(
            'stable-input pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            success && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={togglePasswordVisibility}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    ) : (
      <input
        type={inputType}
        className={cn(
          'stable-input',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          success && 'border-green-500 focus:border-green-500 focus:ring-green-500',
          className
        )}
        ref={ref}
        {...props}
      />
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
          {inputElement}
          {description && !error && !success && (
            <div className="form-description">{description}</div>
          )}
          {error && <div className="form-error">{error}</div>}
          {success && !error && <div className="form-success">{success}</div>}
        </div>
      );
    }

    return inputElement;
  }
);

StableInput.displayName = 'StableInput';

export { StableInput };
