import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wrench, Bell, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Filter notifications based on user role
  const filteredNotifications = user?.role === "admin" 
    ? notifications.filter(n => n.type === "bug_report" || n.type === "admin")
    : notifications.filter(n => n.type !== "bug_report");
  
  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  const handleNotificationClick = () => {
    if (!notificationsOpen) {
      // Mark filtered notifications as read when opening
      setNotifications(prev => prev.map(n => {
        const shouldMarkRead = user?.role === "admin" 
          ? (n.type === "bug_report" || n.type === "admin")
          : n.type !== "bug_report";
        return shouldMarkRead ? { ...n, read: true } : n;
      }));
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const navItems = [
    { label: "Home", path: "/dashboard" },
    { label: user?.role === "admin" ? "Listings" : "Browse Tools", path: "/tools" },
    { label: "My Tools", path: "/my-tools", roleRequired: ["lender"] },
    { label: "Messages", path: "/messages" },
    { label: "Admin Panel", path: "/admin", roleRequired: ["admin"] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.roleRequired) return true;
    return user && item.roleRequired.includes(user.role);
  });

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 text-xl font-display font-semibold">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LeloDedo
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {filteredNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link text-sm font-medium transition-colors ${
                isActive(item.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs flex items-center justify-center text-white font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 glass-effect rounded-2xl shadow-xl p-4 z-50"
                >
                  <h3 className="font-display font-semibold mb-3">Notifications</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredNotifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-lg ${
                          notif.read ? "bg-secondary/50" : "bg-secondary"
                        } hover:bg-secondary transition-colors cursor-pointer`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-medium text-sm">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                          </div>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/notifications"
                    className="block text-center text-sm text-primary hover:text-accent mt-3 font-medium"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    View All
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/profile">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-sm font-medium">{user?.name || "User"}</span>
              </div>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => {
              logout();
              navigate('/login');
            }}>
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {filteredNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-white"
                      : "hover:bg-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="border-border my-2" />
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-secondary"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-secondary text-destructive"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
