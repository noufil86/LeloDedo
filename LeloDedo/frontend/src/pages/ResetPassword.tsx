import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto glass-effect rounded-2xl p-8 border border-border"
          >
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Invalid Reset Link</h1>
            </div>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one from the login page.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Return to Login
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(token, formData.newPassword);
      
      setResetSuccess(true);
      toast({
        title: "Password reset successful!",
        description: "Your password has been updated. Redirecting to login...",
      });

      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "An error occurred while resetting your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto glass-effect rounded-2xl p-8 border border-border text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Password Reset Complete!</h1>
            <p className="text-muted-foreground">
              Your password has been successfully updated. You will be redirected to login shortly.
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="glass-effect rounded-2xl p-8 border border-border">
            <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
            <p className="text-muted-foreground mb-6">
              Enter your new password below. Make sure it's at least 8 characters long.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="bg-secondary border-border pr-10"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 8 characters, mix of letters, numbers, and symbols recommended
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-secondary border-border pr-10"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full glow-effect bg-gradient-to-r from-primary to-accent"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-secondary/50 rounded-lg border border-border text-sm text-muted-foreground">
              <p className="font-medium mb-2">Password Requirements:</p>
              <ul className="space-y-1 text-xs">
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains numbers and special characters</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
