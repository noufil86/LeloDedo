import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Bug, Upload, X, Cloud, AlertCircle, CheckCircle, Loader } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

export default function Report() {
  const { user } = useAuth();
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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
    processImages(files);
  };

  const processImages = (files: File[]) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 5;
    
    if (evidenceImages.length + files.length > maxFiles) {
      toast({
        title: "Too many images",
        description: `You can only upload ${maxFiles - evidenceImages.length} more image(s)`,
        variant: "destructive",
      });
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed.",
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit.`,
          variant: "destructive",
        });
        continue;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidenceImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files || []);
    processImages(files);
  };

  const handleRemoveImage = (index: number) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issueType) {
      toast({
        title: "Select issue type",
        description: "Please choose what type of issue you're reporting",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast({
        title: "Description too short",
        description: "Please provide at least 10 characters describing the issue",
        variant: "destructive",
      });
      return;
    }

    if (email && !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('title', issueType);
      formData.append('description', description);
      formData.append('contact_email', email);
      
      // Add evidence images
      for (const img of evidenceImages) {
        if (img.startsWith('data:')) {
          const blob = await (await fetch(img)).blob();
          formData.append('evidence_files', blob);
        }
      }
      
      const response = await api.report.createUserReport(user?.userId || '', formData);
      const id = response.data?.id || `BUG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setSubmissionId(id);
      setSubmitted(true);
      
      toast({
        title: "Bug report submitted",
        description: "Our team will review your report within 24 hours.",
      });
      
      // Reset form
      setTimeout(() => {
        setIssueType("");
        setDescription("");
        setEmail(user?.email || "");
        setEvidenceImages([]);
        setSubmitted(false);
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="h-20 w-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="h-10 w-10 text-green-500" />
              </motion.div>
              
              <h2 className="text-2xl font-display font-bold mb-2">Report Submitted Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for helping us improve the app! Our development team will review your report and work on a fix.
              </p>
              
              <div className="p-4 bg-secondary/50 rounded-lg text-sm mb-6">
                <p className="text-muted-foreground mb-1">Reference ID</p>
                <p className="font-mono font-semibold text-lg">{submissionId}</p>
                <p className="text-xs text-muted-foreground mt-2">Keep this ID for tracking</p>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6 text-left">
                <p className="font-medium text-primary mb-2">What happens next?</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Your report is queued for review</li>
                  <li>✓ We'll investigate within 24 hours</li>
                  <li>✓ A fix will be deployed if applicable</li>
                  {email && <li>✓ We'll email you updates at {email}</li>}
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setIssueType("");
                    setDescription("");
                    setEmail("");
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
                <label className="block text-sm font-medium mb-2">Issue Type *</label>
                <Select value={issueType} onValueChange={setIssueType}>
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
                <label className="block text-sm font-medium mb-2">Email (Optional)</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com (we'll use this for updates)"
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your email if you'd like us to notify you about fixes
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, what you expected to happen, and steps to reproduce..."
                  className="bg-secondary border-border min-h-40"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Be as specific as possible. Include what you were doing when the bug occurred.
                  </p>
                  <span className={`text-xs ${description.trim().length < 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {description.length}/10 min
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Evidence (Optional - Max 5 images, 5MB each)
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
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                    dragActive
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                  } ${evidenceImages.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Cloud className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Drag screenshots here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({evidenceImages.length}/5 uploaded)
                  </p>
                </div>
                
                {evidenceImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {evidenceImages.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          <img 
                            src={img} 
                            alt={`Evidence ${idx + 1}`} 
                            className="w-full h-20 object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEvidenceImages(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 glow-effect bg-gradient-to-r from-primary to-accent"
                  disabled={loading}
                >
                  <Bug className="h-4 w-4 mr-2" />
                  {loading ? "Submitting..." : "Submit Bug Report"}
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
