import { Save, ChevronDown, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface SaveDropdownProps {
  onSave: () => void;
  onSaveAs: () => void;
  isNewFile?: boolean;
  isSaving?: boolean;
}

export function SaveDropdown({ 
  onSave, 
  onSaveAs, 
  isNewFile = false, 
  isSaving = false 
}: SaveDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      <div className="flex">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-3 py-1.5 text-sm ${
            isNewFile ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
          } rounded-l-lg hover:bg-opacity-80 transition-colors flex items-center gap-2 border-r ${
            isNewFile ? 'border-blue-200' : 'border-green-200'
          } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isNewFile ? 'Create' : 'Save'}
        </button>
        
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isSaving}
          className={`px-2 py-1.5 text-sm ${
            isNewFile ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
          } rounded-r-lg hover:bg-opacity-80 transition-colors ${
            isSaving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
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
              className={`group flex w-full items-center px-4 py-2.5 text-sm ${
                isNewFile ? 'text-blue-700 hover:bg-blue-50' : 'text-gray-700 hover:bg-green-50'
              }`}
            >
              <Save className={`w-4 h-4 mr-3 ${
                isNewFile ? 'text-blue-400 group-hover:text-blue-500' : 'text-gray-400 group-hover:text-green-500'
              }`} />
              <div className="flex flex-col items-start">
                <span className="font-medium">{isNewFile ? 'Create' : 'Save'}</span>
                <span className="text-xs text-gray-500">
                  {isNewFile ? 'Create new file' : 'Save changes to current file'}
                </span>
              </div>
              {isSaving && <Loader2 className="w-4 h-4 ml-auto animate-spin" />}
            </button>

            <button
              onClick={handleSaveAs}
              disabled={isSaving}
              className="group flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Save className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-500" />
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