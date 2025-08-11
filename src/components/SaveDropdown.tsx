import { Save, ChevronDown, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface SaveDropdownProps {
  onSave: () => void;
  onSaveAs: () => void;
  isSaving?: boolean;
}

export function SaveDropdown({ 
  onSave, 
  onSaveAs, 
  isSaving = false 
}: SaveDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  const handleSave = async () => {
    if (isSaving) return;
    try {
      await onSave();
      setShowDropdown(false);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleSaveAs = async () => {
    try {
      await onSaveAs();
      setShowDropdown(false);
    } catch (error) {
      console.error("Save As failed:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="inline-flex border border-border rounded-lg">
        {/* Main Action Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="pl-3 pr-1 py-2 text-sm bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 shadow-sm rounded-l-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </button>
        
        {/* Dropdown Toggle Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isSaving}
          className="pl-1 pr-3 py-2 text-sm bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 shadow-sm rounded-r-lg -ml-px transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white z-50">
          <div className="py-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="group flex w-full items-center px-4 py-2.5 text-sm text-text hover:bg-background-dark transition-colors"
            >
              <Save className="w-4 h-4 mr-3 text-muted group-hover:text-text" />
              <div className="flex flex-col items-start">
                <span>Save</span>
                <span className="text-xs text-muted">
                  Save changes to current file
                </span>
              </div>
              {isSaving && <Loader2 className="w-4 h-4 ml-auto animate-spin" />}
            </button>

            <button
              onClick={handleSaveAs}
              disabled={isSaving}
              className="group flex w-full items-center px-4 py-2.5 text-sm text-text hover:bg-background-dark transition-colors"
            >
              <Save className="w-4 h-4 mr-3 text-muted group-hover:text-text" />
              <div className="flex flex-col items-start">
                <span>Save As...</span>
                <span className="text-xs text-muted">Save as a new file</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}