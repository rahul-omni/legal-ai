"use client";

import React, { useState } from 'react';
import { Folder, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import { FileSystemNodeProps } from '@/types/fileSystem';
import FileIconDisplay from '@/components/LegalEditor/components/FileIconDisplay';
import { useRouter } from 'next/navigation';

export interface FileExplorerAction {
  label: string;
  onClick: (item: FileSystemNodeProps, e: React.MouseEvent) => void;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
}

export interface FileExplorerProps {
  items: FileSystemNodeProps[];
  actions?: FileExplorerAction[];
  onItemClick?: (item: FileSystemNodeProps) => void;
  className?: string;
  emptyMessage?: string;
  showHeader?: boolean;
  loading?: boolean;
  loadingItems?: string[]; // Array of item IDs that are currently loading
  // Pagination props
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalItems?: number;
}

export function FileExplorer({
  items,
  actions = [],
  onItemClick,
  className = '',
  emptyMessage = 'No Projects Found',
  showHeader = true,
  loading = false,
  loadingItems = [],
  showPagination = true,
  onPageChange,
  currentPage = 1,
  totalItems
}: FileExplorerProps) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  
  // Use external pagination if provided, otherwise use internal state
  const page = currentPage || internalCurrentPage;
  const totalPages = Math.ceil((totalItems || items.length) / 10);
  const router = useRouter();

  // For server-side pagination, items are already paginated from the server
  const paginatedItems = items;

  const formatDate = (date: Date) => {
    return moment(date).format("MMM D, YYYY");
  };

  const getFileIcon = (item: FileSystemNodeProps) => {
    if (item.type === 'FOLDER') {
      return <Folder className="w-5 h-5 text-primary shrink-0" />;
    }
    return <FileIconDisplay fileName={item.name} />;
  };

  const getItemLink = (item: FileSystemNodeProps) => {
    if (item.type === "FOLDER") {
      return `/projects/${item.id}`;
    }
    return `/projects/root/edit/${item.id}`;
  };

  const handleItemClick = (item: FileSystemNodeProps) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      const itemLink = getItemLink(item);
      router.push(itemLink);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (onPageChange) {
        onPageChange(newPage);
      } else {
        setInternalCurrentPage(newPage);
      }
    }
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="rounded-md border-2 border-border-dark overflow-hidden">
          <table className="w-full table-auto border-collapse">
            {showHeader && (
              <thead className="bg-background-dark text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-text-light">Name</th>
                  <th className="px-4 py-3 font-semibold text-text-light w-40">Created On</th>
                  <th className="px-4 py-3 font-semibold text-text-light w-40">Last Modified</th>
                  {actions.length > 0 && (
                    <th className="px-4 py-3 font-semibold text-text-light w-40">Actions</th>
                  )}
                </tr>
              </thead>
            )}
          </table>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="rounded-md border-2 border-border-dark overflow-hidden">
        <table className="w-full table-auto border-collapse">
          {showHeader && (
            <thead className="bg-background-dark text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-text-light">Name</th>
                <th className="px-4 py-3 font-semibold text-text-light w-40">Created On</th>
                <th className="px-4 py-3 font-semibold text-text-light w-40">Last Modified</th>
                {actions.length > 0 && (
                  <th className="px-4 py-3 font-semibold text-text-light w-40">Actions</th>
                )}
              </tr>
            </thead>
          )}
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id} className="border-t hover:bg-background-dark transition-colors">
                <td className="px-4 py-3 cursor-pointer" onClick={() => handleItemClick(item)} >
                  <div className="flex items-center gap-3">
                    <div
                      // href={getItemLink(item)}
                      className="flex items-center gap-3 hover:bg-background-dark rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    >
                      {getFileIcon(item)}
                      <span className="font-medium text-text">{item.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-light text-sm">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-4 py-3 text-text-light text-sm">
                  {formatDate(item.updatedAt)}
                </td>
                {actions.length > 0 && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={(e) => action.onClick(item, e)}
                          disabled={action.disabled || loadingItems.includes(item.id)}
                          className={`text-sm px-3 py-1 rounded transition-colors ${
                            action.variant === 'destructive'
                              ? 'bg-error-light hover:bg-error-light text-error'
                              : 'bg-primary-light hover:bg-primary text-primary'
                          } disabled:opacity-50`}
                        >
                          {loadingItems.includes(item.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            action.label
                          )}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr>
                <td colSpan={actions.length > 0 ? 4 : 3} className="p-6 text-center">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-text-light">
            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalItems || items.length)} of {totalItems || items.length} items
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 text-text-light hover:text-text hover:bg-background rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (page <= 3) {
                  pageNumber = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      pageNumber === page
                        ? 'bg-primary text-white'
                        : 'text-text-light hover:bg-background'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 text-text-light hover:text-text hover:bg-background rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}