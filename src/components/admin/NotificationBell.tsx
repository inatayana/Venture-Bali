'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSSE } from '@/lib/sse';
import { Bell, X, Check, MessageCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'system' | 'refund' | 'booking_confirmed' | 'booking_cancelled' | 'payment_received' | 'review_submitted' | 'refund_requested';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
  tenantId: string;
}

export function NotificationProvider({ children, tenantId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // SSE connection for real-time notifications
  const { isConnected: sseConnected } = useSSE<Notification>(
    tenantId ? `/api/admin/notifications/stream?tenantId=${tenantId}` : null,
    {
      onMessage: (notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 100));
      },
      onError: (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
      },
      reconnect: true,
      reconnectInterval: 10000,
    }
  );

  useEffect(() => {
    setIsConnected(sseConnected);
  }, [sseConnected]);

  // Load initial notifications
  useEffect(() => {
    if (!tenantId) return;
    
    fetch(`/api/admin/notifications?tenantId=${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.data);
        }
      })
      .catch(console.error);
  }, [tenantId]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/admin/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  const value = {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isConnected,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isConnected } = useNotifications();
  const [open, setOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 10);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'payment_received':
      case 'payment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'review_submitted':
      case 'review':
        return <MessageCircle className="w-5 h-5 text-yellow-500" />;
      case 'refund_requested':
      case 'refund':
        return <MessageCircle className="w-5 h-5 text-orange-500" />;
      case 'booking_cancelled':
        return <MessageCircle className="w-5 h-5 text-red-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />;
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 max-h-[600px] p-0" side="bottom" align="end">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Connection status */}
          <div className={`flex items-center gap-2 px-4 py-2 text-xs ${isConnected ? 'text-green-600' : 'text-amber-600'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span>{isConnected ? 'Live' : 'Reconnecting...'}</span>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-muted-foreground/50">You&apos;ll see updates here</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-muted/50 transition-colors flex items-start gap-3',
                      !notification.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'font-medium text-sm',
                          !notification.read && '&apos;font-semibold&apos;'
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.actionUrl && notification.actionLabel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.location.href = notification.actionUrl!}
                        >
                          {notification.actionLabel}
                        </Button>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            aria-label="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                          aria-label="Delete notification"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Navigate to full notifications page
              }}
            >
              View all notifications
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}