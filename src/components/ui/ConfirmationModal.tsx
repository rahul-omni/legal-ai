import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, Trash2, Save, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
  isLoading?: boolean;
  showCloseButton?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: 'text-error',
    iconBgColor: 'bg-error/10',
    confirmButtonVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-warning',
    iconBgColor: 'bg-warning/10',
    confirmButtonVariant: 'primary' as const,
  },
  info: {
    icon: Info,
    iconColor: 'text-info',
    iconBgColor: 'bg-info/10',
    confirmButtonVariant: 'primary' as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-success',
    iconBgColor: 'bg-success/10',
    confirmButtonVariant: 'primary' as const,
  },
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  icon,
  isLoading = false,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-background-light rounded-lg shadow-xl border border-border max-w-md w-full mx-4 p-6"
      >
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted hover:text-text transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            config.iconBgColor
          )}>
            {icon || <IconComponent className={cn("w-6 h-6", config.iconColor)} />}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-text mb-2">
            {title}
          </h3>
          <p className="text-muted text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            size="sm"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmButtonVariant}
            onClick={onConfirm}
            loading={isLoading}
            size="sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 