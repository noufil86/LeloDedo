import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BorrowRequest } from "@/types";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface BorrowExtensionProps {
  request: BorrowRequest;
  isLender?: boolean;
  onExtensionRequest?: (requestId: string, days: number) => void;
  onExtensionApprove?: (requestId: string) => void;
  onExtensionDecline?: (requestId: string) => void;
}

export function BorrowExtension({
  request,
  isLender = false,
  onExtensionRequest,
  onExtensionApprove,
  onExtensionDecline,
}: BorrowExtensionProps) {
  const { toast } = useToast();
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [extensionDays, setExtensionDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const handleRequestExtension = async () => {
    if (extensionDays < 1 || extensionDays > 30) {
      toast({
        title: "Invalid duration",
        description: "Extension must be between 1 and 30 days",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await api.borrowRequest.requestExtension(request.id, extensionDays);
      
      onExtensionRequest?.(request.id, extensionDays);
      setShowExtensionDialog(false);
      setExtensionDays(7);
      toast({
        title: "Extension requested",
        description: `Request to extend by ${extensionDays} days has been sent to the lender.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request extension",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await api.borrowRequest.approveExtension(request.id);
      
      onExtensionApprove?.(request.id);
      toast({
        title: "Extension approved",
        description: "The borrower's extension request has been approved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve extension",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      await api.borrowRequest.declineExtension(request.id);
      
      onExtensionDecline?.(request.id);
      toast({
        title: "Extension declined",
        description: "The extension request has been declined.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline extension",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const endDate = new Date(request.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-secondary/50 rounded-lg border border-border"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium">{request.toolName}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Due: {endDate.toLocaleDateString()} ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left)
            </span>
          </div>
        </div>
        {daysRemaining <= 3 && daysRemaining > 0 && (
          <div className="px-2 py-1 bg-amber-500/20 text-amber-600 rounded text-xs font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Due soon
          </div>
        )}
      </div>

      {/* Pending Extension Request */}
      {request.extensionRequested && !isLender && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded mb-3 text-sm">
          <p className="text-muted-foreground">
            ✓ Extension requested for {request.extensionRequestedUntil ? new Date(request.extensionRequestedUntil).toLocaleDateString() : 'pending approval'}
          </p>
        </div>
      )}

      {/* Lender Extension Approval */}
      {request.extensionRequested && isLender && (
        <div className="space-y-2 mb-3">
          <div className="p-3 bg-accent/10 border border-accent/20 rounded">
            <p className="text-sm font-medium mb-2">Extension Request Pending</p>
            <p className="text-xs text-muted-foreground mb-3">
              Borrower requested extension until {request.extensionRequestedUntil ? new Date(request.extensionRequestedUntil).toLocaleDateString() : 'TBD'}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleApprove}
                className="flex-1 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
                className="flex-1 text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Extension Button (Borrower only) */}
      {!request.extensionRequested && !isLender && request.status === "accepted" && (
        <Dialog open={showExtensionDialog} onOpenChange={setShowExtensionDialog}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowExtensionDialog(true)}
            className="w-full text-xs"
          >
            <Clock className="h-3 w-3 mr-2" />
            Request Extension
          </Button>

          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Request Borrow Extension</DialogTitle>
              <DialogDescription>
                Extend your borrowing period for {request.toolName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Number of Days to Extend
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExtensionDays(Math.max(1, extensionDays - 1))}
                    className="px-3 py-2 rounded border border-border hover:bg-secondary"
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(Math.min(30, Math.max(1, Number(e.target.value))))}
                    className="bg-secondary border-border text-center flex-1"
                    min="1"
                    max="30"
                  />
                  <button
                    type="button"
                    onClick={() => setExtensionDays(Math.min(30, extensionDays + 1))}
                    className="px-3 py-2 rounded border border-border hover:bg-secondary"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  (Allowed: 1-30 days)
                </p>
              </div>

              <div className="p-3 bg-secondary/50 rounded border border-border text-sm">
                <p className="font-medium mb-1">New return date:</p>
                <p className="text-muted-foreground">
                  {new Date(new Date(request.endDate).getTime() + extensionDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>

              <Button
                onClick={handleRequestExtension}
                className="w-full glow-effect bg-gradient-to-r from-primary to-accent"
              >
                Request Extension
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
