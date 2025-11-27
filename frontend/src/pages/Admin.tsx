import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Package, AlertTriangle, TrendingUp, CheckCircle, XCircle, MapPin, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { mockUsers, mockTools, mockUserReports } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tool, BugReport, UserReport } from "@/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState([
    { id: "p1", name: "Alice Johnson", email: "alice@example.com", role: "lender" },
    { id: "p2", name: "Bob Wilson", email: "bob@example.com", role: "borrower" },
  ]);
  
  const [tools, setTools] = useState(mockTools);
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

  const [userReports, setUserReports] = useState<UserReport[]>(mockUserReports);

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const stats = [
    { label: "Total Users", value: mockUsers.length.toString(), icon: Users, color: "text-primary" },
    { label: "Active Listings", value: mockTools.length.toString(), icon: Package, color: "text-accent" },
    { label: "Pending Reports", value: "3", icon: AlertTriangle, color: "text-warning" },
    { label: "Total Rentals", value: "47", icon: TrendingUp, color: "text-green-500" },
  ];

  const handleVerifyUser = (id: string, approved: boolean) => {
    setPendingUsers(pendingUsers.filter(u => u.id !== id));
    toast({
      title: approved ? "User approved" : "User rejected",
      description: approved ? "User can now access the platform" : "User has been rejected",
    });
  };

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
          <Tabs defaultValue="verification" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-secondary">
              <TabsTrigger value="verification">User Verification</TabsTrigger>
              <TabsTrigger value="listings">Manage Listings</TabsTrigger>
              <TabsTrigger value="bugs">Bug Reports</TabsTrigger>
              <TabsTrigger value="reports">User Reports</TabsTrigger>
            </TabsList>

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
                      <div key={user.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-1">Role: {user.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifyUser(user.id, true)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleVerifyUser(user.id, false)}
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
                        <img src={tool.image} alt={tool.title} className="h-16 w-16 rounded-lg object-cover" />
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
