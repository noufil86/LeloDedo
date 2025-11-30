import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Trash2, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Notification } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const filteredNotifications = notifications.filter(n => 
    filter === "all" || n.type === filter
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "request": return "📦";
      case "approval": return "✅";
      case "message": return "💬";
      case "return": return "🔄";
      case "admin": return "🛡️";
      default: return "🔔";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "request": return "text-primary";
      case "approval": return "text-green-500";
      case "message": return "text-accent";
      case "return": return "text-yellow-500";
      case "admin": return "text-red-500";
      default: return "text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="request">Requests</SelectItem>
                  <SelectItem value="approval">Approvals</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="return">Returns</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline">
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="glass-effect rounded-2xl p-12 text-center border border-border">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No notifications to show</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-effect rounded-2xl p-5 border ${
                    notif.read ? "border-border" : "border-primary/50 glow-effect"
                  } group`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`text-3xl ${getTypeColor(notif.type)}`}>
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-display font-semibold">{notif.title}</h3>
                        {!notif.read && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notif.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notif.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
