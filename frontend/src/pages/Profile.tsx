import { motion } from "framer-motion";
import { User, Mail, Calendar, Star, Package, Wrench, Package2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  const { user, updateRole } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleRoleToggle = () => {
    const newRole = user?.role === "borrower" ? "lender" : "borrower";
    updateRole(newRole);
    toast({
      title: "Role changed",
      description: `You are now a ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}.`,
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>

          {/* Profile Header */}
          <div className="glass-effect rounded-2xl p-8 border border-border">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-display font-bold">
                {user?.name.charAt(0)}
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold mb-1">{user?.name}</h2>
                <p className="text-muted-foreground mb-3">{user?.email}</p>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary capitalize">
                    {user?.role}
                  </div>
                  {user?.role !== "admin" && (
                    <div className="px-3 py-1 bg-secondary rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      {user?.rating} Rating
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Member Since</p>
                  <p className="text-xl font-display font-bold">
                    {new Date(user?.joinedDate || "").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Rentals</p>
                  <p className="text-xl font-display font-bold">{user?.totalRentals}</p>
                </div>
                <Package className="h-8 w-8 text-accent" />
              </div>
            </div>

            {user?.role !== "admin" && (
              <div className="glass-effect rounded-2xl p-6 border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Average Rating</p>
                    <p className="text-xl font-display font-bold">{user?.rating}/5.0</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="glass-effect rounded-2xl p-8 border border-border">
            <h2 className="text-xl font-display font-semibold mb-6">Account Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span>{user?.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-border"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{user?.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Account Type</label>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                  <span className="capitalize">{user?.role}</span>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    className="flex-1 glow-effect bg-gradient-to-r from-primary to-accent"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setName(user?.name || "");
                      setEmail(user?.email || "");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Role Toggle Section */}
          {user?.role !== "admin" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect rounded-2xl p-8 border border-border"
            >
              <h2 className="text-xl font-display font-semibold mb-4">User Type</h2>
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  {user?.role === "borrower" ? (
                    <Package2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Wrench className="h-6 w-6 text-accent" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{user?.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.role === "borrower" 
                        ? "Browse and rent tools from others"
                        : "List your tools and earn by lending"}
                    </p>
                  </div>
                </div>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                >
                  <Switch
                    checked={user?.role === "lender"}
                    onCheckedChange={handleRoleToggle}
                    className="data-[state=checked]:bg-accent"
                  />
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Switch between Borrower and Lender anytime
              </p>
            </motion.div>
          )}

          {/* Security Section */}
          <div className="glass-effect rounded-2xl p-8 border border-border">
            <h2 className="text-xl font-display font-semibold mb-4">Security</h2>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
