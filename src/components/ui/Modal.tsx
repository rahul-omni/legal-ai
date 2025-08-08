import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  contentClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  footer,
  closeOnOverlayClick = true,
  contentClassName = "",
}: ModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, onClose]);

  // Handle scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine width based on size prop
  const sizeClasses = {
    sm: "w-96",
    md: "w-[500px]",
    lg: "w-2/3 max-w-4xl",
    xl: "w-4/5",
    full: "w-4/5 h-4/5",
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-white rounded-lg shadow-lg ${
          size === "full" ? "flex flex-col h-4/5" : ""
        } ${sizeClasses[size]}`}
      >
        {title && (
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-background-dark"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        )}

        <div
          className={`${
            size === "full" ? "flex-1 overflow-auto" : title ? "pt-4" : "pt-6"
          } px-6 pb-4 ${contentClassName}`}
        >
          {children}
        </div>

        {footer && <div className="px-6 py-4 border-t">{footer}</div>}
      </div>
    </div>
  );
}
