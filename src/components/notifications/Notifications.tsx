import { useState, useEffect } from "react";
import { Filter, ChevronLeft, ChevronRight, Bell, Search } from "lucide-react";
import { NotificationData, NotificationFilters, PaginationData } from "./types";
import { NotificationItem } from "./NotificationItem";
import { FilterModal } from "./FilterModal";

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchNotifications();
  }, [pagination.currentPage, filters]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.currentPage.toString());
      queryParams.append('limit', pagination.itemsPerPage.toString());
      
      // Add filters if they exist
      if (filters.method && filters.method.trim() !== '') {
        queryParams.append('method', filters.method);
      }
      if (filters.dateFrom && filters.dateFrom.trim() !== '') {
        queryParams.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo && filters.dateTo.trim() !== '') {
        queryParams.append('dateTo', filters.dateTo);
      }

      console.log('Fetching notifications with params:', queryParams.toString());

      const response = await fetch(`/api/notifications?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      console.log('Notifications fetched successfully:', data);
      
      setNotifications(data.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: data.pagination?.totalItems || 0,
        totalPages: data.pagination?.totalPages || 1,
        currentPage: data.pagination?.currentPage || 1
      }));
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setPagination(prev => ({
        ...prev,
        totalItems: 0,
        totalPages: 1
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterApply = (newFilters: NotificationFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setShowFilterModal(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof NotificationFilters] && filters[key as keyof NotificationFilters]?.trim() !== ''
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  All Notifications
                </h1>
                <p className="text-gray-600 mt-1">
                  {pagination.totalItems > 0 
                    ? `${pagination.totalItems} notification${pagination.totalItems !== 1 ? 's' : ''} found`
                    : 'Stay updated with your latest notifications'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilterModal(true)}
                className={`relative px-6 py-3 border-2 border-cyan-400 text-cyan-600 rounded-xl flex items-center gap-2 hover:bg-cyan-50 transition-all duration-200 font-semibold shadow-sm hover:shadow-md ${
                  hasActiveFilters ? 'bg-cyan-50 border-cyan-500' : ''
                }`}
              >
                <Filter className="w-5 h-5" />
                Filter
                {hasActiveFilters && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></div>
                )}
              </button>
            </div>
          </div>
          
          {/* Filter indicators */}
          {hasActiveFilters && (
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              {filters.method && (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-sm font-medium">
                  Method: {filters.method}
                </span>
              )}
              {filters.dateFrom && (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-sm font-medium">
                  From: {new Date(filters.dateFrom).toLocaleDateString()}
                </span>
              )}
              {filters.dateTo && (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-sm font-medium">
                  To: {new Date(filters.dateTo).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Bell className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <p className="text-gray-500 mt-4 font-medium">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                formatDateTime={formatDateTime}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {hasActiveFilters 
                ? "No notifications match your current filters. Try adjusting your search criteria."
                : "You're all caught up! New notifications will appear here when they arrive."
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilters({});
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="mt-4 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      {pagination.totalItems > 0 && (
        <div className="bg-white border-t border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">
                  {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}
                </span> to <span className="font-semibold text-gray-900">
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span> of <span className="font-semibold text-gray-900">
                  {pagination.totalItems}
                </span> notifications
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        showModal={showFilterModal}
        filters={filters}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
      />
    </div>
  );
}