"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, Info, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth-context";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "announcement";
  postedBy: string;
  postedAt: Date;
  isRead?: boolean;
};

type NotificationsListProps = {
  notifications: Notification[];
};

export default function NotificationsList({ notifications }: NotificationsListProps) {
  const { config } = useAuth();

  if (!config["feature/notifications"]) return null;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getNotificationBadge = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400">Warning</Badge>;
      case "success":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Success</Badge>;
      case "info":
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Info</Badge>;
      default:
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400">Announcement</Badge>;
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg transition-colors ${
                  notification.isRead
                    ? "border-border bg-muted/20"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {getNotificationBadge(notification.type)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Posted by {notification.postedBy}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(notification.postedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
