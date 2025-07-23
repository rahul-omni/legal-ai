import { NotificationData } from "./types";

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {getTitle(notification.message || '')}
          </h3>
          {getDescription(notification.message || '') && (
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {getDescription(notification.message || '')}
            </p>
          )}
          
          {/* Additional metadata */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {notification.dairy_number && (
              <span>Diary: {notification.dairy_number}</span>
            )}
            {notification.method && (
              <span>Method: {capitalizeFirst(notification.method)}</span>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-4">
          <time className="text-sm text-gray-500">
            {formatDateTime(notification.created_at)}
          </time>
        </div>
      </div>
    </div>
  );
} 