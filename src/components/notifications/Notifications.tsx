import { useState, useEffect } from "react";
import { Filter, Bell, Search } from "lucide-react";
import { NotificationData, NotificationFilters, PaginationData } from "./types";
import { NotificationItem } from "./NotificationItem";
import { FilterModal } from "./FilterModal";
import Header from "../ui/Header";
import Button from "../ui/Button";

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
    <div className="flex flex-col h-screen">
      <div className="p-6 bg-background">
        <Header headerTitle="Notifications" subTitle="Stay updated with your latest notifications" />
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowFilterModal(true)}
            variant="secondary"
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters ? 'Filters Applied' : 'Filter'}
          </Button>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search notifications..."
            className="pl-10 pr-4 py-2 border border-border rounded-md w-64 text-sm focus:ring-2 focus:ring-border-dark"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6 pt-2 bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2"> 
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                formatDateTime={formatDateTime}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bell className="w-12 h-12 text-muted mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">No notifications</h3>
            <p className="text-text-light max-w-md">
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
                className="mt-4 px-4 py-2 text-sm border border-border rounded-md hover:bg-background-dark"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {notifications.length > 0 && (
        <div className="border-t border-border bg-background-light px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-light">
              Showing <span className="font-medium text-text">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span>
              {' '}-{' '}
              <span className="font-medium text-text">
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
              </span>
              {' '}of{' '}
              <span className="font-medium text-text">{pagination.totalItems}</span>
              {' '}notifications
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-background-dark disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-background-dark disabled:opacity-50"
              >
                Next
              </button>
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