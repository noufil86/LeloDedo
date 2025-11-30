import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { Package, MessageSquare, Plus, TrendingUp, Star, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const stats = [
    { label: "Active Rentals", value: "5", icon: Package, color: "text-primary", show: true },
    { label: "Listed Tools", value: user?.role === "lender" ? "8" : "0", icon: TrendingUp, color: "text-accent", show: true },
    { label: "Unread Messages", value: "3", icon: MessageSquare, color: "text-warning", show: true },
    { label: "Rating", value: user?.rating ? user.rating.toFixed(1) : "0", icon: Star, color: "text-yellow-500", show: user?.role !== "admin" },
  ].filter(stat => stat.show);

  const quickActions = [
    {
      title: "List New Tool",
      description: "Share your tools with the community",
      icon: Plus,
      path: "/my-tools",
      show: user?.role === "lender" || user?.role === "admin",
    },
    {
      title: "Browse Tools",
      description: "Find tools near you",
      icon: Package,
      path: "/tools",
      show: true,
    },
    {
      title: "View Messages",
      description: "Chat with other users",
      icon: MessageSquare,
      path: "/messages",
      show: true,
    },
  ].filter(action => action.show);

  const recentActivity = [
    { type: "rental", message: "Power Drill Set rented to Jane Smith", time: "2 hours ago" },
    { type: "message", message: "New message from John Doe", time: "5 hours ago" },
    { type: "review", message: "You received a 5-star review", time: "1 day ago" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Welcome Banner */}
          <div className="glass-effect rounded-3xl p-8 border border-border glow-effect">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-muted-foreground">
                  {user?.role === "lender" 
                    ? "Manage your tools and connect with borrowers" 
                    : user?.role === "admin"
                    ? "Monitor platform activity and manage users"
                    : "Find the perfect tools for your next project"}
                </p>
              </div>
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold capitalize">
                {user?.role}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${user?.role === "admin" ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-display font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-display font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Link to={action.path}>
                    <div className="glass-effect rounded-2xl p-6 border border-border hover:border-primary/50 transition-all hover:scale-105 group">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <action.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold mb-1 group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-display font-semibold mb-4">Recent Activity</h2>
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/notifications">
                <Button variant="ghost" className="w-full mt-4">
                  View All Activity
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
