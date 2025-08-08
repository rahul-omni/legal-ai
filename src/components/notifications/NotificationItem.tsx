import { NotificationData } from "./types";
import { Bell } from "lucide-react";

interface NotificationItemProps {
  notification: NotificationData;
  formatDateTime: (dateString: string) => string;
}

export function NotificationItem({ notification, formatDateTime }: NotificationItemProps) {
  const getTitle = (message: string) => {
    const lines = message.split('\n');
    return lines[0] || 'Notification';
  };

  const getDescription = (message: string) => {
    const lines = message.split('\n');
    return lines.slice(1).join('\n') || '';
  };

  const capitalizeFirst = (str?: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="border-b hover:bg-background-dark transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-info-light rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-info" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-text">
              {getTitle(notification.message || '')}
            </h3>
            {getDescription(notification.message || '') && (
              <p className="text-sm text-text-light mt-1">
                {getDescription(notification.message || '')}
              </p>
            )}
            
            {/* Metadata */}
            <div className="flex items-center gap-4 mt-2 text-xs">
              {notification.dairy_number && (
                <span className="text-muted">
                  Diary: {notification.dairy_number}
                </span>
              )}
              {notification.method && (
                <span className="text-muted">
                  Method: {capitalizeFirst(notification.method)}
                </span>
              )}
              <time className="text-muted">
                {formatDateTime(notification.created_at)}
              </time>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 