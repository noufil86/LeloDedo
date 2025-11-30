import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.auth.passwordResetRequest(email);
      setSent(true);
      toast({
        title: "Reset link sent!",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to send reset link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-effect rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                LeloDedo
              </h1>
            </div>
          </div>

          <h2 className="text-2xl font-display font-semibold text-center mb-2">
            Reset Password
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Enter your email to receive a reset link
          </p>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  If an account exists with that email, you'll receive a password reset link shortly.
                </p>
              </div>
              <Link to="/login">
                <Button className="w-full glow-effect bg-gradient-to-r from-primary to-accent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-secondary border-border"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 glow-effect bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Link to="/login" className="block text-center">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
