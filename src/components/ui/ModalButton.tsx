import { ButtonHTMLAttributes, ReactNode } from "react";

interface ModalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function ModalButton({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: ModalButtonProps) {
  const baseClasses = "rounded-md font-medium transition-colors";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-muted-light text-text-light hover:bg-muted",
    danger: "bg-error text-white hover:bg-error-dark",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizeClasses[size]} ${className || ""}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex justify-end gap-2 ${className || ""}`}>
      {children}
    </div>
  );
}
