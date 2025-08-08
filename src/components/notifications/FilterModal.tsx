import { useState } from "react";
import { X, Filter, Calendar } from "lucide-react";
import { NotificationFilters } from "./types";

interface FilterModalProps {
  showModal: boolean;
  filters: NotificationFilters;
  onClose: () => void;
  onApply: (filters: NotificationFilters) => void;
}

export function FilterModal({ showModal, filters, onClose, onApply }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<NotificationFilters>(filters);

  if (!showModal) return null;

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    const clearedFilters: NotificationFilters = {};
    setLocalFilters(clearedFilters);
    onApply(clearedFilters);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-text">
              Filter Notifications
            </h3>
            <p className="text-sm text-text-light">Refine your notification search</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-background-dark flex self-start"
          >
            <X className="h-5 w-5 text-muted hover:text-text" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Method Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-light">
              Communication Method
            </label>
            <select
              value={localFilters.method || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, method: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light"
            >
              <option value="">All Methods</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text-light">
              Date Range
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted">
                  FROM DATE
                </label>
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, dateFrom: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted">
                  TO DATE
                </label>
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, dateTo: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light"
                />
              </div>
            </div>
          </div>

          {/* Preview of active filters */}
          {(localFilters.method || localFilters.dateFrom || localFilters.dateTo) && (
            <div className="p-4 bg-info-light rounded border border-info/20">
              <h4 className="text-sm font-medium text-info mb-2">Active Filters</h4>
              <div className="flex flex-wrap gap-2">
                {localFilters.method && (
                  <span className="px-2 py-1 bg-info-light text-info text-xs font-medium rounded">
                    Method: {localFilters.method}
                  </span>
                )}
                {localFilters.dateFrom && (
                  <span className="px-2 py-1 bg-info-light text-info text-xs font-medium rounded">
                    From: {new Date(localFilters.dateFrom).toLocaleDateString()}
                  </span>
                )}
                {localFilters.dateTo && (
                  <span className="px-2 py-1 bg-info-light text-info text-xs font-medium rounded">
                    To: {new Date(localFilters.dateTo).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-border bg-background">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-text-light hover:text-text"
          >
            Clear All
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-background-dark"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-dark"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 