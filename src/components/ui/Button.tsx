import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 shadow-sm",
      secondary: "bg-white text-text border border-border hover:bg-background-dark focus:ring-border/50 shadow-sm",
      outline: "border border-border text-text hover:bg-background-dark focus:ring-border/50",
      ghost: "text-text hover:bg-background-dark focus:ring-border/50",
      danger: "bg-error text-white hover:bg-error-dark focus:ring-error/50 shadow-sm"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2"
    };
    
    const widthClass = fullWidth ? "w-full" : "";
    
    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      widthClass,
      className
    );

    const renderIcon = () => {
      if (loading) {
        return (
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        );
      }
      return icon;
    };

    const renderContent = () => {
      const iconElement = renderIcon();
      
      if (!iconElement) {
        return children;
      }
      
      if (iconPosition === 'right') {
        return (
          <>
            {children}
            {iconElement}
          </>
        );
      }
      
      return (
        <>
          {iconElement}
          {children}
        </>
      );
    };

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;  
