import { Plus, X } from "lucide-react";

interface TabInfo {
  id: string;
  name: string;
  fileId?: string | null;
  isUnsaved?: boolean;
}

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onNewTab: () => void;
  onTabClick: (_tabId: string) => void;
  onTabClose: (_tabId: string) => void;
}

export function TabBar({
  tabs,
  activeTabId,
  onNewTab,
  onTabClick,
  onTabClose,
}: TabBarProps) {
  return (
    <div className="flex items-center h-9 border-b border-gray-200 bg-gray-50/80">
      {/* New Tab Button */}
      <button
        onClick={onNewTab}
        className="h-full px-2 text-gray-500 hover:bg-gray-100 transition-colors border-l border-gray-200"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <div className="flex-1 flex items-center">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`group flex items-center h-full px-3 border-r border-gray-200 cursor-pointer
                      ${
                        activeTabId === tab.id
                          ? "bg-white text-gray-700 border-b-0"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
          >
            <span className="text-xs font-medium truncate max-w-[100px]">
              {tab.name === "Untitled Document" && !tab.fileId
                ? "New"
                : tab.name}
              {tab.isUnsaved && "•"}
              {!tab.fileId && <span className="text-gray-500"> (Unsaved)</span>}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-1.5 p-0.5 rounded-sm hover:bg-gray-200/80 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
