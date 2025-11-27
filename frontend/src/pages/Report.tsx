import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Bug, Upload, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Report() {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const issueTypes = [
    "UI Issue",
    "Performance Issue",
    "Crash/Error",
    "Feature Request",
    "Login/Authentication",
    "Data Loading",
    "Other",
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (evidenceImages.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Each image must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidenceImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setTimeout(() => {
      setSubmitted(true);
      toast({
        title: "Bug report submitted",
        description: "Our team will review your report within 24 hours.",
      });
    }, 500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center space-y-6"
          >
            <div className="glass-effect rounded-3xl p-12 border border-border">
              <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-display font-bold mb-2">Bug Report Submitted</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for helping us improve the app! Our development team will review your report and work on a fix.
              </p>
              
              <div className="p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground mb-6">
                <p>Reference ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setIssueType("");
                    setDescription("");
                    setEvidenceImages([]);
                  }}
                  variant="outline"
                >
                  Submit Another Report
                </Button>
                <Button
                  onClick={() => window.location.href = "/dashboard"}
                  className="glow-effect bg-gradient-to-r from-primary to-accent"
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
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
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="flex items-center gap-3">
            <Bug className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-1">
                Report a Bug
              </h1>
              <p className="text-muted-foreground">
                Help us improve the app by reporting issues
              </p>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6 md:p-8 border border-border">
            <div className="flex items-start gap-4 p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
              <Bug className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary mb-1">Help Us Fix It</p>
                <p className="text-sm text-muted-foreground">
                  Please describe the bug in detail and include screenshots if possible. This helps our team reproduce and fix the issue faster.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Bug Type</label>
                <Select value={issueType} onValueChange={setIssueType} required>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select bug type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {issueTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, what you expected to happen, and steps to reproduce..."
                  className="bg-secondary border-border min-h-40"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be as specific as possible. Include what you were doing when the bug occurred.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Evidence (Optional - Max 5 images)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload screenshots
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB each ({evidenceImages.length}/5)
                  </p>
                </div>
                
                {evidenceImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {evidenceImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={img} 
                          alt={`Evidence ${idx + 1}`} 
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 glow-effect bg-gradient-to-r from-primary to-accent"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Submit Bug Report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
