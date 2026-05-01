"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Edit, Trash2, AlertCircle, Info, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth-context";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "announcement";
  postedBy: string;
  postedAt: Date;
  targetClass?: string;
};

type TeacherNotificationsProps = {
  notifications: Notification[];
  teacherName: string;
};

export default function TeacherNotifications({ notifications, teacherName }: TeacherNotificationsProps) {
  const { config } = useAuth();
  if (!config["feature/notifications"]) return null;
  const [notificationsList, setNotificationsList] = useState<Notification[]>(notifications);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement" as Notification["type"],
    targetClass: "all",
  });

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

  const handleCreateNotification = () => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: formData.title,
      message: formData.message,
      type: formData.type,
      postedBy: teacherName,
      postedAt: new Date(),
      targetClass: formData.targetClass === "all" ? undefined : formData.targetClass,
    };

    setNotificationsList([newNotification, ...notificationsList]);
    setFormData({ title: "", message: "", type: "announcement", targetClass: "all" });
    setIsCreateOpen(false);
  };

  const handleEditNotification = () => {
    if (!editingNotification) return;

    setNotificationsList(
      notificationsList.map((notif) =>
        notif.id === editingNotification.id
          ? { ...notif, title: formData.title, message: formData.message, type: formData.type }
          : notif
      )
    );
    setEditingNotification(null);
    setFormData({ title: "", message: "", type: "announcement", targetClass: "all" });
  };

  const handleDeleteNotification = (id: string) => {
    setNotificationsList(notificationsList.filter((notif) => notif.id !== id));
  };

  const openEditDialog = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetClass: notification.targetClass || "all",
    });
  };

  const sortedNotifications = [...notificationsList].sort((a, b) =>
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setFormData({ title: "", message: "", type: "announcement", targetClass: "all" })}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
                <DialogDescription>
                  Post a notification for your students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Notification title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Notification message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: Notification["type"]) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetClass">Target Class</Label>
                  <Select value={formData.targetClass} onValueChange={(value) => setFormData({ ...formData, targetClass: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="CS301">Data Structures (CS301)</SelectItem>
                      <SelectItem value="CS302">Database Management (CS302)</SelectItem>
                      <SelectItem value="CS303">Operating Systems (CS303)</SelectItem>
                      <SelectItem value="CS304">Computer Networks (CS304)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateNotification} disabled={!formData.title || !formData.message}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">Create one to notify your students</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 border rounded-lg transition-colors border-border bg-muted/20"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <div className="flex items-center gap-1">
                        {getNotificationBadge(notification.type)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(notification.postedAt), { addSuffix: true })}
                        </span>
                        {notification.targetClass && (
                          <>
                            <span>•</span>
                            <span>Class: {notification.targetClass}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Dialog open={editingNotification?.id === notification.id} onOpenChange={(open) => !open && setEditingNotification(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(notification)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Notification</DialogTitle>
                              <DialogDescription>
                                Update your notification details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                  id="edit-title"
                                  value={formData.title}
                                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-message">Message</Label>
                                <Textarea
                                  id="edit-message"
                                  value={formData.message}
                                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                  rows={4}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-type">Type</Label>
                                <Select value={formData.type} onValueChange={(value: Notification["type"]) => setFormData({ ...formData, type: value })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="announcement">Announcement</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingNotification(null)}>Cancel</Button>
                              <Button onClick={handleEditNotification}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
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
