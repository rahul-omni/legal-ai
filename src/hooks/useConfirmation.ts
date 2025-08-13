import { useState, useCallback } from 'react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
}

export interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  isLoading: boolean;
}

export const useConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
  });

  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);

  const confirm = useCallback((
    options: ConfirmationOptions,
    onConfirm: () => void | Promise<void>
  ) => {
    setState(prev => ({
      ...prev,
      ...options,
      isOpen: true,
      isLoading: false,
    }));
    setOnConfirmCallback(() => onConfirm);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!onConfirmCallback) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await onConfirmCallback();
      setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      // You might want to handle the error here or let the parent component handle it
      throw error;
    }
  }, [onConfirmCallback]);

  const handleClose = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
    setOnConfirmCallback(null);
  }, []);

  return {
    confirmationState: state,
    confirm,
    handleConfirm,
    handleClose,
  };
}; 