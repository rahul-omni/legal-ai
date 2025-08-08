import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SplitButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  mainAction: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  dropdownItems: Array<{
    label?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    divider?: boolean;
  }>;
}

const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false, 
    fullWidth = false,
    mainAction,
    dropdownItems,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
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
    const buttonClasses = cn(baseClasses, variants[variant], sizes[size], widthClass, className);

    const handleMainAction = () => {
      if (!disabled && !loading) {
        mainAction.onClick();
      }
    };

    const handleDropdownToggle = () => {
      if (!disabled && !loading) {
        setIsOpen(!isOpen);
      }
    };

    const handleDropdownItemClick = (item: typeof dropdownItems[0]) => {
      if (!item.disabled && item.onClick && !item.divider) {
        item.onClick();
        setIsOpen(false);
      }
    };

    return (
      <div ref={ref} className="inline-flex relative" {...props}>
        {/* Main Action Button */}
        <button
          className={cn(buttonClasses, "rounded-r-none")}
          onClick={handleMainAction}
          disabled={disabled || loading}
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
          ) : (
            <>
              {mainAction.icon && <span className="flex-shrink-0">{mainAction.icon}</span>}
              <span>{mainAction.label}</span>
            </>
          )}
        </button>

        {/* Dropdown Toggle Button */}
        <button
          className={cn(
            buttonClasses, 
            "rounded-l-none -ml-px",
            isOpen && "ring-2 ring-offset-2 ring-primary/50"
          )}
          onClick={handleDropdownToggle}
          disabled={disabled || loading}
          aria-label="Toggle dropdown"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute mt-1 z-50 min-w-[200px] bg-background-light border border-border rounded-lg shadow-lg py-1"
            style={{ 
              top: '100%',
              left: fullWidth ? '0' : 'auto',
              right: fullWidth ? '0' : 'auto'
            }}
          >
            {dropdownItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.divider ? (
                  <div className="border-t border-border my-1" />
                ) : (
                  <button
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm hover:bg-background-dark transition-colors flex items-center gap-2",
                      item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                    )}
                    onClick={() => handleDropdownItemClick(item)}
                    disabled={item.disabled}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SplitButton.displayName = 'SplitButton';

export default SplitButton;
