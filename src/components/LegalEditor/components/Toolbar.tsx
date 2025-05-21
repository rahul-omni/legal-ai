import { PanelLeft, PanelRightOpen } from "lucide-react";

interface ToolbarProps {
  showLeftPanel: boolean;
  showSmartPrompts: boolean;
  onToggleLeftPanel: () => void;
  onToggleSmartPrompts: () => void;
}

export function Toolbar({
  showLeftPanel,
  showSmartPrompts,
  onToggleLeftPanel,
  onToggleSmartPrompts
}: ToolbarProps) {
  return (
    <div className="absolute top-0 right-0 z-50 flex gap-1 p-2">
      <div className="flex gap-1 bg-[#f9f9f9] shadow-sm rounded p-1">
        <button
          onClick={onToggleLeftPanel}
          className={`p-1.5 rounded ${
            showLeftPanel ? "bg-white shadow-sm" : "bg-transparent"
          } hover:bg-white hover:shadow-sm transition-all`}
        >
          <PanelLeft className="w-4 h-4 text-gray-600/80" />
        </button>
        <button
          onClick={onToggleSmartPrompts}
          className={`p-1.5 rounded ${
            showSmartPrompts ? "bg-white shadow-sm" : "bg-transparent"
          } hover:bg-white hover:shadow-sm transition-all`}
        >
          <PanelRightOpen className="w-4 h-4 text-gray-600/80" />
        </button>
      </div>
    </div>
  );
}
