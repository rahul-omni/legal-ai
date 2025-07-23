export interface NotificationData {
  id: string;
  created_at: string;
  dairy_number?: string; // Note: keeping original column name from DB
  user_id?: string;
  method?: string;
  contact?: string;
  message?: string;
  status?: string;
}

export interface NotificationFilters {
  method?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
} 