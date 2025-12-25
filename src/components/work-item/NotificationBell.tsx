
'use client';

import { Bell, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Notification } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationBell({ notifications, onNotificationClick, onMarkAllAsRead }: NotificationBellProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-medium text-sm">Notifications</h4>
            {unreadCount > 0 && (
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={onMarkAllAsRead}>
                    Mark all as read
                </Button>
            )}
        </div>
        <ScrollArea className="h-96">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                    No new notifications.
                </div>
            ) : (
                <div className="divide-y">
                    {notifications.map(notification => (
                        <div 
                            key={notification.id} 
                            onClick={() => onNotificationClick(notification)}
                            className={cn(
                                "p-4 hover:bg-accent cursor-pointer",
                                !notification.isRead && "bg-blue-50 dark:bg-blue-900/20"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                    notification.isRead ? "bg-transparent" : "bg-blue-500"
                                )}></div>
                                <div className="flex-grow">
                                    <p className={cn("text-sm", !notification.isRead && "font-semibold")}>{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                    </p>
                                </div>
                                {notification.message.includes("overdue") && (
                                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
