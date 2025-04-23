import { Save, ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';

interface SaveDropdownProps {
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
}

export function SaveDropdown({ onSave, onSaveAs }: SaveDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    await onSave();
    setShowDropdown(false);
  };

  const handleSaveAs = async () => {
    await onSaveAs();
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-l-lg
                   hover:bg-green-100 transition-colors flex items-center gap-2
                   border-r border-green-200"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-2 py-1.5 text-sm bg-green-50 text-green-600 rounded-r-lg
                   hover:bg-green-100 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-black
                      ring-opacity-5 bg-white z-50">
          <div className="py-1">
            <button
              onClick={handleSave}
              className="group flex w-full items-center px-4 py-2.5 text-sm text-gray-700
                       hover:bg-green-50 hover:text-green-700"
            >
              <Save className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-500" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Save</span>
                <span className="text-xs text-gray-500">Save changes to current file</span>
              </div>
            </button>

            <button
              onClick={handleSaveAs}
              className="group flex w-full items-center px-4 py-2.5 text-sm text-gray-700
                       hover:bg-green-50 hover:text-green-700"
            >
              <Save className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-500" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Save As...</span>
                <span className="text-xs text-gray-500">Save as a new file</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 