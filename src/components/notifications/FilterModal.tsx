import { useState } from "react";
import { X, Filter, Calendar, MessageCircle, Mail } from "lucide-react";
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Filter Notifications
              </h3>
              <p className="text-sm text-gray-500">Refine your notification search</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Method Filter */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MessageCircle className="w-4 h-4 text-cyan-600" />
              Communication Method
            </label>
            <div className="relative">
              <select
                value={localFilters.method || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, method: e.target.value || undefined })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">All Methods</option>
                <option value="whatsapp">🟢 WhatsApp</option>
                <option value="email">📧 Email</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 text-cyan-600" />
              Date Range
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  From Date
                </label>
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, dateFrom: e.target.value || undefined })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  To Date
                </label>
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, dateTo: e.target.value || undefined })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Preview of active filters */}
          {(localFilters.method || localFilters.dateFrom || localFilters.dateTo) && (
            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
              <h4 className="text-sm font-semibold text-cyan-800 mb-2">Preview Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {localFilters.method && (
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-xs font-medium">
                    Method: {localFilters.method}
                  </span>
                )}
                {localFilters.dateFrom && (
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-xs font-medium">
                    From: {new Date(localFilters.dateFrom).toLocaleDateString()}
                  </span>
                )}
                {localFilters.dateTo && (
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-xs font-medium">
                    To: {new Date(localFilters.dateTo).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Clear All
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 