"use client";

import { Check, ChevronDown } from "lucide-react";
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type StatusDropdownOption = {
  value: string;
  label: string;
  className?: string;
};

type StatusDropdownProps = {
  value: string;
  options: StatusDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

const MENU_ESTIMATED_WIDTH = 144;
const MENU_ESTIMATED_HEIGHT = 160;
const VIEWPORT_PADDING = 8;
const MENU_GAP = 4;

function computeMenuPosition(
  triggerRect: DOMRect,
  menuSize: { width: number; height: number }
): MenuPosition {
  const menuWidth = menuSize.width || MENU_ESTIMATED_WIDTH;
  const menuHeight = menuSize.height || MENU_ESTIMATED_HEIGHT;

  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  const openAbove = spaceBelow < menuHeight + VIEWPORT_PADDING && spaceAbove > spaceBelow;

  let top = openAbove
    ? triggerRect.top - menuHeight - MENU_GAP
    : triggerRect.bottom + MENU_GAP;

  let left = triggerRect.right - menuWidth;
  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PADDING)
  );
  top = Math.max(
    VIEWPORT_PADDING,
    Math.min(top, window.innerHeight - menuHeight - VIEWPORT_PADDING)
  );

  return {
    top,
    left,
    minWidth: Math.max(triggerRect.width, MENU_ESTIMATED_WIDTH),
  };
}

type StatusDropdownMenuProps = {
  position: MenuPosition;
  isPositioned: boolean;
  value: string;
  options: StatusDropdownOption[];
  onSelect: (value: string) => void;
};

const StatusDropdownMenu = forwardRef<HTMLDivElement, StatusDropdownMenuProps>(
  function StatusDropdownMenu({ position, isPositioned, value, options, onSelect }, ref) {
    return (
      <div
        ref={ref}
        role="listbox"
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          minWidth: position.minWidth,
          zIndex: 9999,
          visibility: isPositioned ? "visible" : "hidden",
        }}
        className="w-36 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === value}
            onClick={() => onSelect(option.value)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-text hover:bg-background-dark"
          >
            <span>{option.label}</span>
            {option.value === value ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
          </button>
        ))}
      </div>
    );
  }
);

export function StatusDropdown({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel = "Change status",
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();

    setMenuPosition(
      computeMenuPosition(triggerRect, {
        width: menuRect?.width ?? MENU_ESTIMATED_WIDTH,
        height: menuRect?.height ?? MENU_ESTIMATED_HEIGHT,
      })
    );
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
    const frame = requestAnimationFrame(() => updateMenuPosition());
    return () => cancelAnimationFrame(frame);
  }, [isOpen, options.length, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => updateMenuPosition();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "inline-flex h-7 min-w-[5.75rem] items-center justify-center gap-1 rounded-full border px-2 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
          selectedOption?.className
        )}
      >
        <span>{selectedOption?.label ?? value}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isMounted && isOpen
        ? createPortal(
            <StatusDropdownMenu
              ref={menuRef}
              position={
                menuPosition ?? {
                  top: 0,
                  left: 0,
                  minWidth: MENU_ESTIMATED_WIDTH,
                }
              }
              isPositioned={Boolean(menuPosition)}
              value={value}
              options={options}
              onSelect={(nextValue) => {
                onChange(nextValue);
                setIsOpen(false);
              }}
            />,
            document.body
          )
        : null}
    </>
  );
}
