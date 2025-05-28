"use client";
import { FolderPlus, Search, Upload } from "lucide-react";
import { ChangeEvent, FC, MouseEvent, RefObject } from "react";

export const FileExplorerHeader: FC<{
  searchQuery: string;
  setSearchQuery: (_v: string) => void;
  isFolderPickerOpen: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleCreateFolder: (_e: MouseEvent) => void;
  handleFileUpload: (_e: ChangeEvent<HTMLInputElement>) => void;
}> = ({
  searchQuery,
  setSearchQuery,
  isFolderPickerOpen,
  fileInputRef,
  handleCreateFolder,
  handleFileUpload,
}) => (
  <div className="p-4 bg-[#f9f9f9] sticky top-0 z-10">
    {/* Search */}
    {!isFolderPickerOpen && (
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search files..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                     placeholder-gray-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    )}

    {/* Files Header */}
    {!isFolderPickerOpen && (
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500/80">
          FILES
        </h2>
        <div className="flex items-center gap-1">
          {/* Upload File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            title="Upload File"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.doc,.docx,.pdf"
          />

          {/* New Folder Button */}
          <button
            onClick={handleCreateFolder}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
    )}
  </div>
);
