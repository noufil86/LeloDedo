import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { mockTools } from "@/lib/mockData";
import { Tool } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function MyTools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tools, setTools] = useState(mockTools.filter(t => t.ownerId === user?.id));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent admin from listing tools
  if (user?.role === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="glass-effect rounded-2xl p-12 text-center border border-border">
            <p className="text-muted-foreground text-lg">Admin users cannot list tools</p>
          </div>
        </main>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    condition: "good" as "excellent" | "good" | "fair",
    category: "",
    pricePerDay: 0,
    images: [] as string[],
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 5) {
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
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      toast({
        title: "Add at least one image",
        description: "Please upload at least one image of your tool",
        variant: "destructive",
      });
      return;
    }

    if (editingTool) {
      setTools(tools.map(t => t.id === editingTool.id ? { 
        ...t, 
        ...formData,
        image: formData.images[0],
        images: formData.images 
      } : t));
      toast({ title: "Tool updated!", description: "Your tool listing has been updated." });
    } else {
      const newTool: Tool = {
        id: Date.now().toString(),
        ...formData,
        ownerId: user?.id || "1",
        ownerName: user?.name || "User",
        image: formData.images[0],
        images: formData.images,
        distance: 0,
        available: true,
        rating: 0,
      };
      setTools([...tools, newTool]);
      toast({ title: "Tool added!", description: "Your tool is now listed." });
    }

    setDialogOpen(false);
    setEditingTool(null);
    setFormData({ title: "", description: "", condition: "good", category: "", pricePerDay: 0, images: [] });
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      title: tool.title,
      description: tool.description,
      condition: tool.condition,
      category: tool.category,
      pricePerDay: tool.pricePerDay,
      images: tool.images || [tool.image],
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTools(tools.filter(t => t.id !== id));
    toast({ title: "Tool removed", description: "Your tool has been removed from listings." });
  };

  const toggleAvailability = (id: string) => {
    setTools(tools.map(t => t.id === id ? { ...t, available: !t.available } : t));
    toast({ title: "Availability updated", description: "Tool availability has been changed." });
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
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">My Tools</h1>
              <p className="text-muted-foreground">Manage your tool listings</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="glow-effect bg-gradient-to-r from-primary to-accent">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Tool
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-border">
                <DialogHeader>
                  <DialogTitle>{editingTool ? "Edit Tool" : "Add New Tool"}</DialogTitle>
                  <DialogDescription>
                    {editingTool ? "Update your tool details" : "List a new tool for rent"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-secondary border-border"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-secondary border-border min-h-24"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Condition</label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value: "excellent" | "good" | "fair") =>
                          setFormData({ ...formData, condition: value })
                        }
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="bg-secondary border-border"
                        placeholder="e.g., Power Tools"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price per Day ($)</label>
                    <Input
                      type="number"
                      value={formData.pricePerDay}
                      onChange={(e) => setFormData({ ...formData, pricePerDay: Number(e.target.value) })}
                      className="bg-secondary border-border"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Images (Required - Min: 1, Max: 5)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full mb-3"
                      disabled={formData.images.length >= 5}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Images ({formData.images.length}/5)
                    </Button>
                    
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={img} 
                              alt={`Preview ${idx + 1}`} 
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
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
                    <Button type="submit" className="flex-1 glow-effect bg-gradient-to-r from-primary to-accent">
                      {editingTool ? "Update Tool" : "Add Tool"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingTool(null);
                        setFormData({ title: "", description: "", condition: "good", category: "", pricePerDay: 0, images: [] });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tools List */}
          {tools.length === 0 ? (
            <div className="glass-effect rounded-2xl p-12 text-center border border-border">
              <p className="text-muted-foreground mb-4">You haven't listed any tools yet</p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="glow-effect bg-gradient-to-r from-primary to-accent"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Your First Tool
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect rounded-2xl p-6 border border-border"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {tool.images && tool.images.length > 1 ? (
                      <Carousel className="w-full md:w-48">
                        <CarouselContent>
                          {tool.images.map((img, idx) => (
                            <CarouselItem key={idx}>
                              <img
                                src={img}
                                alt={`${tool.title} ${idx + 1}`}
                                className="w-full h-48 object-cover rounded-xl"
                              />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </Carousel>
                    ) : (
                      <img
                        src={tool.image}
                        alt={tool.title}
                        className="w-full md:w-48 h-48 object-cover rounded-xl"
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-display font-semibold mb-1">{tool.title}</h3>
                          <p className="text-muted-foreground text-sm">{tool.category}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tool.available
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}>
                          {tool.available ? "Available" : "Unavailable"}
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4">{tool.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="px-3 py-1 bg-secondary rounded-lg text-sm">
                          Condition: <span className="font-medium capitalize">{tool.condition}</span>
                        </div>
                        <div className="px-3 py-1 bg-secondary rounded-lg text-sm">
                          Price: <span className="font-medium text-primary">${tool.pricePerDay}/day</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(tool)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAvailability(tool.id)}
                        >
                          {tool.available ? (
                            <><EyeOff className="h-4 w-4 mr-2" />Mark Unavailable</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-2" />Mark Available</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(tool.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
