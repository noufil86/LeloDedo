import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Package, AlertTriangle, TrendingUp, CheckCircle, XCircle, MapPin, Star, AlertCircle, Trash2, RefreshCw, Settings, Loader } from "lucide-react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tool, BugReport, UserReport, ToolCategory } from "@/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolToRemove, setToolToRemove] = useState<string | null>(null);
  
  const [bugReports, setBugReports] = useState<BugReport[]>([
    { 
      id: "1", 
      type: "UI Issue", 
      reporterName: "Jane Smith", 
      reporterId: "2",
      status: "pending", 
      description: "The search bar doesn't work properly on mobile devices. When I try to type, the keyboard keeps closing.",
      timestamp: new Date().toISOString(),
      evidenceImages: ["https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800"]
    },
    { 
      id: "2", 
      type: "Performance Issue", 
      reporterName: "John Doe", 
      reporterId: "3",
      status: "pending", 
      description: "The app takes too long to load on slow connections. Sometimes it times out completely.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      evidenceImages: []
    },
  ]);
  const [selectedBugReport, setSelectedBugReport] = useState<BugReport | null>(null);

  const [userReports, setUserReports] = useState<UserReport[]>([]);

  // Fetch admin data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [usersRes, toolsRes, reportsRes, categoriesRes] = await Promise.all([
          api.admin.getUsers().catch(() => ({ data: [] })),
          api.item.getAll().catch(() => ({ data: [] })),
          api.report.getAllReports().catch(() => ({ data: [] })),
          api.toolCategory.getAll().catch(() => ({ data: [] }))
        ]);
        
        setAllUsers(usersRes.data || []);
        
        // Map API response to Tool format
        if (toolsRes.data && Array.isArray(toolsRes.data)) {
          const mappedTools = toolsRes.data.map((tool: any) => {
            let imageUrl = tool.imageUrl || tool.imageUrls?.[0] || "";
            // Add backend URL prefix if image is a relative path
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `http://localhost:3000${imageUrl}`;
            }
            
            const mappedTool = {
              id: tool.itemId?.toString() || tool.id?.toString(),
              title: tool.title || "",
              description: tool.description || "",
              condition: tool.condition || "good",
              category: tool.category?.categoryName || tool.category?.name || "",
              image: imageUrl,
              images: (tool.imageUrls || []).map((img: string) => 
                img && !img.startsWith('http') ? `http://localhost:3000${img}` : img
              ),
              ownerId: tool.owner?.userId || tool.ownerId || "",
              ownerName: tool.owner?.name || tool.ownerName || "",
              distance: tool.distance || 0,
              available: tool.availabilityStatus === 'AVAILABLE' || tool.available !== false,
              rating: tool.rating || 0,
              pricePerDay: tool.pricePerDay || 0
            };
            console.log("Mapped tool:", mappedTool.title, "Image:", mappedTool.image);
            return mappedTool;
          });
          setTools(mappedTools);
        } else {
          setTools([]);
        }
        
        setBugReports(reportsRes.data || []);
        
        // Map API response to ToolCategory format
        if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
          const mappedCategories = categoriesRes.data.map((cat: any) => {
            let createdAt = new Date().toISOString();
            try {
              if (cat.createdAt) {
                if (typeof cat.createdAt === 'string') {
                  createdAt = cat.createdAt;
                } else {
                  createdAt = new Date(cat.createdAt).toISOString();
                }
              }
            } catch (e) {
              console.warn("Invalid createdAt date:", cat.createdAt);
            }
            return {
              id: cat.categoryId?.toString() || cat.id?.toString(),
              name: cat.categoryName || cat.name,
              iconUrl: cat.iconUrl || "",
              isActive: cat.isActive !== false,
              createdAt: createdAt
            };
          });
          setCategories(mappedCategories);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        // Use empty state on error
        setAllUsers([]);
        setTools([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Advanced User Management State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [warnReason, setWarnReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState(7);

  // Computed pending users (unverified users)
  const pendingUsers = allUsers.filter(user => !user.verifiedStatus);

  // Category Management State
  const [categories, setCategories] = useState<ToolCategory[]>([
    { id: "1", name: "Power Tools", iconUrl: "⚙️", isActive: true, createdAt: new Date().toISOString() },
    { id: "2", name: "Hand Tools", iconUrl: "🔨", isActive: true, createdAt: new Date().toISOString() },
  ]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const stats = [
    { label: "Total Users", value: allUsers.length.toString(), icon: Users, color: "text-primary" },
    { label: "Active Listings", value: tools.length.toString(), icon: Package, color: "text-accent" },
    { label: "Pending Reports", value: bugReports.filter(r => r.status === "pending").length.toString(), icon: AlertTriangle, color: "text-warning" },
    { label: "Total Rentals", value: (bugReports.length + userReports.length).toString(), icon: TrendingUp, color: "text-green-500" },
  ];

  const handleRemoveListing = () => {
    if (toolToRemove) {
      setTools(tools.filter(t => t.id !== toolToRemove));
      toast({
        title: "Listing removed",
        description: "The tool listing has been removed from the platform",
      });
      setToolToRemove(null);
    }
  };

  const handleResolveBugReport = (reportId: string) => {
    setBugReports(bugReports.map(r => 
      r.id === reportId ? { ...r, status: "resolved" as const } : r
    ));
    toast({
      title: "Bug report resolved",
      description: "The bug report has been marked as resolved",
    });
    setSelectedBugReport(null);
  };

  const handleResolveUserReport = (reportId: string) => {
    setUserReports(userReports.map(r => 
      r.id === reportId ? { ...r, status: "resolved" as const } : r
    ));
    toast({
      title: "User report resolved",
      description: "The user report has been marked as resolved",
    });
  };

  // User Management Handlers
  const handleWarnUser = async (user: any) => {
    if (!warnReason.trim()) {
      toast({
        title: "Enter a reason",
        description: "Please provide a reason for the warning",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      await api.admin.warnUser(user.userId, { reason: warnReason });
      
      const newWarningCount = (user.warningCount || 0) + 1;
      const willBan = newWarningCount >= 3;
      
      setAllUsers(allUsers.map(u => u.userId === user.userId ? {
        ...u,
        warningCount: newWarningCount,
        ...(willBan && { banned: true, banUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      } : u));
      
      setShowWarnDialog(false);
      setWarnReason("");
      
      toast({
        title: "Warning issued",
        description: willBan ? `User auto-banned after 3 warnings (7 days)` : `Warning count: ${newWarningCount}/3`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to warn user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (user: any) => {
    if (!banReason.trim()) {
      toast({
        title: "Enter a reason",
        description: "Please provide a ban reason",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await api.admin.banUser(user.userId, { reason: banReason, days: banDays });

      setAllUsers(allUsers.map(u => u.userId === user.userId ? {
        ...u,
        banned: true,
        banUntil: new Date(Date.now() + banDays * 24 * 60 * 60 * 1000).toISOString(),
        banReason: banReason,
      } : u));

      setShowBanDialog(false);
      setBanReason("");
      setBanDays(7);

      toast({
        title: "User banned",
        description: `${user.name} has been banned for ${banDays} day(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async (user: any) => {
    try {
      setLoading(true);
      await api.admin.unbanUser(user.userId);
      
      setAllUsers(allUsers.map(u => u.userId === user.userId ? {
        ...u,
        banned: false,
        banUntil: undefined,
      } : u));

      toast({
        title: "User unbanned",
        description: `${user.name} has been unbanned`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (user: any) => {
    try {
      setLoading(true);
      
      if (user.verifiedStatus) {
        await api.admin.unverifyUser(user.userId);
      } else {
        await api.admin.verifyUser(user.userId);
      }

      setAllUsers(allUsers.map(u => u.userId === user.userId ? {
        ...u,
        verifiedStatus: !u.verifiedStatus,
      } : u));

      toast({
        title: user.verifiedStatus ? "Verification removed" : "User verified",
        description: `${user.name} has been ${user.verifiedStatus ? "unverified" : "verified"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update verification status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Category Handlers
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Enter a category name",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.toolCategory.create({ 
        category_name: newCategoryName,
        description: newCategoryDescription || ""
      });

      const newCategory: ToolCategory = response.data || {
        id: Date.now().toString(),
        name: newCategoryName,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowCategoryDialog(false);

      toast({
        title: "Category created",
        description: `${newCategoryName} has been added`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDeleteCategory = async (category: ToolCategory) => {
    try {
      setLoading(true);
      await api.toolCategory.update(category.id, { is_active: false });
      setCategories(categories.map(c => c.id === category.id ? { ...c, isActive: false } : c));
      toast({
        title: "Category deactivated",
        description: `${category.name} is now hidden from listings`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCategory = async (category: ToolCategory) => {
    try {
      setLoading(true);
      await api.toolCategory.update(category.id, { is_active: true });
      setCategories(categories.map(c => c.id === category.id ? { ...c, isActive: true } : c));
      toast({
        title: "Category restored",
        description: `${category.name} is now visible`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restore category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage platform operations and users</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6 border border-border"
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

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6 bg-secondary">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="verification">Verify Users</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="listings">Listings</TabsTrigger>
              <TabsTrigger value="bugs">Bug Reports</TabsTrigger>
              <TabsTrigger value="reports">User Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="glass-effect rounded-2xl p-6 border border-border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-display font-semibold">User Management</h2>
                  <span className="text-sm text-muted-foreground">{allUsers.length} users</span>
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search users by name..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allUsers
                    .filter(user => user.name.toLowerCase().includes(userSearchQuery.toLowerCase()))
                    .map(user => (
                    <div key={user.userId} className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold flex items-center gap-2">
                            {user.name}
                            {user.verifiedStatus && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {user.banned && <AlertCircle className="h-4 w-4 text-red-500" />}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email} • {user.role}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            {!user.verifiedStatus && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded">
                                Awaiting Verification
                              </span>
                            )}
                            {user.warningCount > 0 && (
                              <span className="px-2 py-1 bg-amber-500/20 text-amber-600 rounded">
                                {user.warningCount}/3 Warnings
                              </span>
                            )}
                            {user.banned && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-600 rounded">
                                Banned until {new Date(user.banUntil).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={selectedUser?.userId === user?.userId && showUserDialog} onOpenChange={setShowUserDialog}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                Actions
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader>
                                <DialogTitle>{selectedUser?.name}</DialogTitle>
                                <DialogDescription>Manage user account</DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Email</p>
                                      <p className="font-medium">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Role</p>
                                      <p className="font-medium capitalize">{selectedUser.role}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Verified</p>
                                      <p className="font-medium">{selectedUser.verifiedStatus ? '✓ Yes' : '✗ No'}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Warnings</p>
                                      <p className="font-medium">{selectedUser.warningCount || 0}/3</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      size="sm"
                                      variant={selectedUser.verifiedStatus ? "destructive" : "default"}
                                      className="flex-1"
                                      onClick={() => {
                                        handleVerifyUser(selectedUser);
                                        setShowUserDialog(false);
                                      }}
                                    >
                                      {selectedUser.verifiedStatus ? 'Unverify' : 'Verify'}
                                    </Button>
                                    <Dialog open={showWarnDialog} onOpenChange={setShowWarnDialog}>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="flex-1">
                                          Warn
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="bg-card border-border">
                                        <DialogHeader>
                                          <DialogTitle>Issue Warning</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-3">
                                          <Textarea
                                            placeholder="Reason for warning..."
                                            value={warnReason}
                                            onChange={(e) => setWarnReason(e.target.value)}
                                            className="bg-secondary border-border min-h-20"
                                          />
                                          <Button
                                            onClick={() => handleWarnUser(selectedUser)}
                                            className="w-full bg-amber-500 hover:bg-amber-600"
                                          >
                                            Issue Warning ({selectedUser.warningCount || 0}/3)
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant={selectedUser.banned ? "default" : "destructive"}
                                          className="flex-1"
                                          onClick={() => {
                                            if (selectedUser.banned) {
                                              handleUnbanUser(selectedUser);
                                              setShowUserDialog(false);
                                            }
                                          }}
                                        >
                                          {selectedUser.banned ? 'Unban' : 'Ban'}
                                        </Button>
                                      </DialogTrigger>
                                      {!selectedUser.banned && (
                                        <DialogContent className="bg-card border-border">
                                          <DialogHeader>
                                            <DialogTitle>Ban User</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-3">
                                            <div>
                                              <label className="text-sm font-medium mb-2 block">Duration (days)</label>
                                              <input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={banDays}
                                                onChange={(e) => setBanDays(Number(e.target.value))}
                                                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg"
                                              />
                                            </div>
                                            <Textarea
                                              placeholder="Ban reason..."
                                              value={banReason}
                                              onChange={(e) => setBanReason(e.target.value)}
                                              className="bg-secondary border-border min-h-20"
                                            />
                                            <Button
                                              onClick={() => handleBanUser(selectedUser)}
                                              className="w-full bg-red-500 hover:bg-red-600"
                                            >
                                              Ban for {banDays} day{banDays !== 1 ? 's' : ''}
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      )}
                                    </Dialog>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="glass-effect rounded-2xl p-6 border border-border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-display font-semibold">Tool Categories</h2>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        + Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input
                          placeholder="Category name..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="bg-secondary border-border"
                        />
                        <Input
                          placeholder="Category description..."
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                          className="bg-secondary border-border"
                        />
                        <Button
                          onClick={handleAddCategory}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          Create Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-4 bg-secondary rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold flex items-center gap-2">
                          {cat.iconUrl} {cat.name}
                          {!cat.isActive && <span className="text-xs bg-gray-500/20 text-gray-600 px-2 py-1 rounded">Inactive</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(cat.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {cat.isActive ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSoftDeleteCategory(cat)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleRestoreCategory(cat)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4">
              <div className="glass-effect rounded-2xl p-6 border border-border">
                <h2 className="text-xl font-display font-semibold mb-4">
                  Pending Verifications ({pendingUsers.length})
                </h2>
                {pendingUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No pending verifications</p>
                ) : (
                  <div className="space-y-3">
                    {pendingUsers.map(user => (
                      <div key={user.userId} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-1">Role: {user.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifyUser(user)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleVerifyUser(user)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="listings" className="space-y-4">
              <div className="glass-effect rounded-2xl p-6 border border-border">
                <h2 className="text-xl font-display font-semibold mb-4">Tool Listings</h2>
                <div className="space-y-3">
                  {tools.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div className="flex items-center gap-4">
                        <img 
                          src={tool.image || "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=100&h=100&fit=crop"} 
                          alt={tool.title} 
                          className="h-16 w-16 rounded-lg object-cover bg-muted" 
                          onError={(e) => {e.currentTarget.src = "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=100&h=100&fit=crop"}}
                        />
                        <div>
                          <p className="font-semibold">{tool.title}</p>
                          <p className="text-sm text-muted-foreground">By {tool.ownerName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{tool.category}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedTool(tool)}>
                          View Details
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setToolToRemove(tool.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bugs" className="space-y-4">
              <div className="glass-effect rounded-2xl p-6 border border-border">
                <h2 className="text-xl font-display font-semibold mb-4">Bug Reports</h2>
                <div className="space-y-3">
                  {bugReports.map(report => (
                    <div key={report.id} className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{report.type}</p>
                          <p className="text-sm text-muted-foreground">Reported by: {report.reporterName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(report.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          report.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                            : "bg-green-500/10 text-green-500 border border-green-500/20"
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{report.description}</p>
                      {report.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => setSelectedBugReport(report)}>
                            Review Evidence
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleResolveBugReport(report.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="glass-effect rounded-2xl p-6 border border-border">
                <h2 className="text-xl font-display font-semibold mb-4">User Reports</h2>
                {userReports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No user reports</p>
                ) : (
                  <div className="space-y-3">
                    {userReports.map(report => (
                      <div key={report.id} className="p-4 bg-secondary rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-red-500">Report: {report.reportedUserName}</p>
                            <p className="text-sm text-muted-foreground">Reported by: {report.reporterName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(report.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                              : "bg-green-500/10 text-green-500 border border-green-500/20"
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium">Reason: {report.reason}</p>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        {report.status === "pending" && (
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleResolveUserReport(report.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Tool Details Dialog */}
      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Tool Details</DialogTitle>
            <DialogDescription>Detailed information about this listing</DialogDescription>
          </DialogHeader>
          {selectedTool && (
            <div className="space-y-4">
              <img 
                src={selectedTool.image} 
                alt={selectedTool.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{selectedTool.title}</h3>
                  <p className="text-sm text-muted-foreground">Category: {selectedTool.category}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{selectedTool.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">${selectedTool.pricePerDay}/day</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <p className="font-medium capitalize">{selectedTool.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{selectedTool.rating}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{selectedTool.distance} km away</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-medium ${selectedTool.available ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedTool.available ? 'Available' : 'Rented'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedTool.description}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    setToolToRemove(selectedTool.id);
                    setSelectedTool(null);
                  }}
                >
                  Remove Listing
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setSelectedTool(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bug Report Details Dialog */}
      <Dialog open={!!selectedBugReport} onOpenChange={() => setSelectedBugReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Bug Report Review</DialogTitle>
            <DialogDescription>Review bug report and evidence</DialogDescription>
          </DialogHeader>
          {selectedBugReport && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Report Type</p>
                  <p className="text-lg font-semibold">{selectedBugReport.type}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Reported By</p>
                    <p className="font-medium">{selectedBugReport.reporterName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedBugReport.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-sm">{selectedBugReport.description}</p>
                  </div>
                </div>

                {selectedBugReport.evidenceImages.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Evidence ({selectedBugReport.evidenceImages.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedBugReport.evidenceImages.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    selectedBugReport.status === "pending"
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      : "bg-green-500/10 text-green-500 border border-green-500/20"
                  }`}>
                    {selectedBugReport.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedBugReport.status === "pending" && (
                  <Button 
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={() => handleResolveBugReport(selectedBugReport.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => setSelectedBugReport(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Tool Confirmation Dialog */}
      <AlertDialog open={!!toolToRemove} onOpenChange={() => setToolToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tool Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this tool listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveListing} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
