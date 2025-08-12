'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

interface AnimatedBrandProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
  compact?: boolean; // For navbar use
}

export const AnimatedBrand: React.FC<AnimatedBrandProps> = ({
  size = 'md',
  showIcon = true,
  className = '',
  compact = false
}) => {
  const sizeClasses = {
    xs: 'text-sm',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  const iconSizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const iconPadding = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-4',
    xl: 'p-4'
  };

  // Compact layout for navbar
  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showIcon && (
          <div className="relative">
            <div className="bg-gradient-to-br from-red-600 via-purple-600 to-blue-600 p-2 rounded-lg shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-wide">
            Ekhaya Intel Trading
          </h1>
          <p className="text-xs text-gray-500 font-medium">HR Management</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {showIcon && (
        <div className="relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-blue-500 rounded-full blur-lg opacity-30 animate-pulse"></div>

          {/* Icon container with gradient background */}
          <div className={`relative bg-gradient-to-br from-red-600 via-purple-600 to-blue-600 ${iconPadding[size]} rounded-xl shadow-2xl transform hover:scale-110 transition-all duration-300`}>
            <Building2 className={`${iconSizes[size]} text-white drop-shadow-lg`} />
          </div>
        </div>
      )}
      
      {/* Animated brand text with mirror effect */}
      <div className="relative">
        {/* Main text */}
        <h1 className={`
          ${sizeClasses[size]} 
          font-bold 
          text-center 
          bg-gradient-to-r 
          from-red-600 
          via-purple-600 
          to-blue-600 
          bg-clip-text 
          text-transparent 
          animate-gradient-x
          drop-shadow-lg
          tracking-wide
        `}>
          <span className="inline-block animate-bounce-slow">E</span>
          <span className="inline-block animate-bounce-slow animation-delay-100">k</span>
          <span className="inline-block animate-bounce-slow animation-delay-200">h</span>
          <span className="inline-block animate-bounce-slow animation-delay-300">a</span>
          <span className="inline-block animate-bounce-slow animation-delay-400">y</span>
          <span className="inline-block animate-bounce-slow animation-delay-500">a</span>
          <span className="mx-2"></span>
          <span className="inline-block animate-bounce-slow animation-delay-600">I</span>
          <span className="inline-block animate-bounce-slow animation-delay-700">n</span>
          <span className="inline-block animate-bounce-slow animation-delay-800">t</span>
          <span className="inline-block animate-bounce-slow animation-delay-900">e</span>
          <span className="inline-block animate-bounce-slow animation-delay-1000">l</span>
          <span className="mx-2"></span>
          <span className="inline-block animate-bounce-slow animation-delay-1100">T</span>
          <span className="inline-block animate-bounce-slow animation-delay-1200">r</span>
          <span className="inline-block animate-bounce-slow animation-delay-1300">a</span>
          <span className="inline-block animate-bounce-slow animation-delay-1400">d</span>
          <span className="inline-block animate-bounce-slow animation-delay-1500">i</span>
          <span className="inline-block animate-bounce-slow animation-delay-1600">n</span>
          <span className="inline-block animate-bounce-slow animation-delay-1700">g</span>
        </h1>
        
        {/* Mirror reflection effect */}
        <div className="absolute top-full left-0 right-0 h-full overflow-hidden opacity-20">
          <h1 className={`
            ${sizeClasses[size]} 
            font-bold 
            text-center 
            bg-gradient-to-r 
            from-red-600 
            via-purple-600 
            to-blue-600 
            bg-clip-text 
            text-transparent
            transform 
            scale-y-[-1] 
            blur-[1px]
            tracking-wide
          `}>
            Ekhaya Intel Trading
          </h1>
          
          {/* Fade gradient overlay for mirror effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white"></div>
        </div>
      </div>
      
      {/* Subtitle */}
      <p className="text-center text-gray-600 font-medium tracking-wide animate-fade-in-up">
        HR & Finance Management System
      </p>
      
      {/* Animated underline */}
      <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-blue-500 rounded-full animate-pulse"></div>
    </div>
  );
};

// Custom CSS animations (add to globals.css)
export const brandAnimationStyles = `
  @keyframes gradient-x {
    0%, 100% {
      background-size: 200% 200%;
      background-position: left center;
    }
    50% {
      background-size: 200% 200%;
      background-position: right center;
    }
  }

  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-gradient-x {
    animation: gradient-x 3s ease infinite;
  }

  .animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
  }

  .animate-fade-in-up {
    animation: fade-in-up 1s ease-out;
  }

  .animation-delay-100 { animation-delay: 0.1s; }
  .animation-delay-200 { animation-delay: 0.2s; }
  .animation-delay-300 { animation-delay: 0.3s; }
  .animation-delay-400 { animation-delay: 0.4s; }
  .animation-delay-500 { animation-delay: 0.5s; }
  .animation-delay-600 { animation-delay: 0.6s; }
  .animation-delay-700 { animation-delay: 0.7s; }
  .animation-delay-800 { animation-delay: 0.8s; }
  .animation-delay-900 { animation-delay: 0.9s; }
  .animation-delay-1000 { animation-delay: 1.0s; }
  .animation-delay-1100 { animation-delay: 1.1s; }
  .animation-delay-1200 { animation-delay: 1.2s; }
  .animation-delay-1300 { animation-delay: 1.3s; }
  .animation-delay-1400 { animation-delay: 1.4s; }
  .animation-delay-1500 { animation-delay: 1.5s; }
  .animation-delay-1600 { animation-delay: 1.6s; }
  .animation-delay-1700 { animation-delay: 1.7s; }
`;
