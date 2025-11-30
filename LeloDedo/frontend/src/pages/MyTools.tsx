import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X, Cloud, Loader } from "lucide-react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
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
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories on mount (independent of user)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('🔄 Fetching categories...');
        const categoriesResponse = await api.toolCategory.getAll();
        console.log('📂 Full Categories Response:', categoriesResponse);
        let categoriesData = categoriesResponse.data;
        
        if (categoriesData && categoriesData.data) {
          console.log('📂 Data is nested! Using categoriesData.data');
          categoriesData = categoriesData.data;
        }
        
        console.log('📂 Final categoriesData:', categoriesData);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Fetch user's tools when user is loaded
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const response = await api.item.getAll({ owner_id: user?.userId });
        
        const normalizedTools = (response.data || []).map((tool: any) => {
          return normalizeTool(tool);
        });
        
        setTools(normalizedTools);
      } catch (error) {
        console.error('Error fetching tools:', error);
        setTools([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId && !authLoading) {
      fetchTools();
    }
  }, [user?.userId, authLoading]);

  // Helper to normalize tool data from API
  const normalizeTool = (tool: any) => {
    // Convert relative image URLs to absolute URLs
    const imageUrl = tool.imageUrl || tool.image;
    const absoluteImageUrl = imageUrl && !imageUrl.startsWith('http') 
      ? `http://localhost:3000${imageUrl}` 
      : imageUrl;
    
    const imageUrls = (tool.imageUrls || (tool.imageUrl ? [tool.imageUrl] : [])).map((url: string) => 
      url && !url.startsWith('http') ? `http://localhost:3000${url}` : url
    );
    
    return {
      ...tool,
      id: tool.itemId || tool.id,
      image: absoluteImageUrl,
      images: imageUrls,
      category: typeof tool.category === 'object' ? tool.category.categoryName : tool.category,
      available: tool.availabilityStatus === 'available',
      pricePerDay: tool.pricePerDay || tool.price_per_day || 0,
    };
  };

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

  const processImageFiles = async (files: File[]) => {
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    let validFiles = [];
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
      validFiles.push(file);
    }

    if (formData.images.length + validFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} images allowed.`,
        variant: "destructive",
      });
      validFiles = validFiles.slice(0, maxFiles - formData.images.length);
    }

    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, e.target?.result as string]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processImageFiles(files);
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
    processImageFiles(files);
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if token exists
    const token = localStorage.getItem('lelodedo_token');
    console.log('🔑 Token in localStorage:', token ? 'YES (length: ' + token.length + ')' : 'NO');
    console.log('👤 User object:', user);
    console.log('👤 User ID:', user?.userId);
    
    if (!token) {
      toast({
        title: "Not authenticated",
        description: "Please login first",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.images.length === 0) {
      toast({
        title: "Add at least one image",
        description: "Please upload at least one image of your tool",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Find category ID from category name
      const selectedCategoryObj = categories.find(cat => cat.categoryName === formData.category);
      if (!selectedCategoryObj) {
        toast({
          title: "Invalid category",
          description: "Please select a valid category",
          variant: "destructive",
        });
        return;
      }
      
      if (editingTool) {
        // Update tool
        await api.item.update(editingTool.id, {
          title: formData.title,
          description: formData.description,
          category_id: selectedCategoryObj.categoryId,
          condition: formData.condition,
          price_per_day: formData.pricePerDay,
        });
        
        // Upload new images if added
        for (let i = 0; i < formData.images.length; i++) {
          if (formData.images[i].startsWith('data:')) {
            const formDataUpload = new FormData();
            const blob = await (await fetch(formData.images[i])).blob();
            formDataUpload.append('file', blob);
            await api.item.uploadImage(editingTool.id, formDataUpload);
          }
        }
        
        // Refresh tools
        const response = await api.item.getAll({ owner_id: user?.userId });
        const normalizedRefresh = (response.data || []).map(normalizeTool);
        setTools(normalizedRefresh);
        
        toast({ title: "Tool updated!", description: "Your tool listing has been updated." });
      } else {
        // Create new tool - send as JSON, not FormData
        const response = await api.item.create({
          title: formData.title,
          description: formData.description,
          category_id: selectedCategoryObj.categoryId,
          condition: formData.condition,
          price_per_day: formData.pricePerDay,
        });
        const newTool = response.data;
        console.log('✅ Tool created:', newTool);
        console.log('✅ Item ID:', newTool.itemId);
        
        // Upload images
        let uploadErrors = [];
        for (let i = 0; i < formData.images.length; i++) {
          if (formData.images[i].startsWith('data:')) {
            try {
              const formDataUpload = new FormData();
              const blob = await (await fetch(formData.images[i])).blob();
              formDataUpload.append('file', blob);
              console.log(`📸 Uploading image ${i + 1}/${formData.images.length}`);
              const uploadResult = await api.item.uploadImage(newTool.itemId, formDataUpload);
              console.log(`✅ Image ${i + 1} uploaded:`, uploadResult);
            } catch (imgError: any) {
              console.error(`❌ Image ${i + 1} upload failed:`, imgError);
              uploadErrors.push(`Image ${i + 1}: ${imgError.message}`);
            }
          }
        }
        
        if (uploadErrors.length > 0) {
          console.warn('⚠️ Some images failed to upload:', uploadErrors);
        }
        
        // Refresh tools
        console.log('🔄 Refreshing tools list...');
        const listResponse = await api.item.getAll({ owner_id: user?.userId });
        console.log('📋 Updated tools list:', listResponse.data);
        const normalizedList = (listResponse.data || []).map(normalizeTool);
        setTools(normalizedList);
        
        toast({ title: "Tool added!", description: "Your tool is now listed." });
      }
      
      setDialogOpen(false);
      setEditingTool(null);
      setFormData({ title: "", description: "", condition: "good", category: "", pricePerDay: 0, images: [] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save tool.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    // Extract category name if it's an object, otherwise use as string
    const categoryValue = typeof tool.category === 'object' ? (tool.category as any).categoryName : tool.category;
    setFormData({
      title: tool.title,
      description: tool.description,
      condition: tool.condition,
      category: categoryValue,
      pricePerDay: tool.pricePerDay,
      images: tool.images || [tool.image],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await api.item.delete(id);
      setTools(tools.filter(t => t.id !== id));
      toast({ title: "Tool removed", description: "Your tool has been removed from listings." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tool.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const tool = tools.find(t => t.id === id);
      if (!tool) return;
      
      const newStatus = tool.available ? 'unavailable' : 'available';
      console.log(`🔄 Toggling tool ${id} to ${newStatus}`);
      
      await api.item.update(id, {
        availability_status: newStatus,
      });
      
      setTools(tools.map(t => t.id === id ? { ...t, available: !t.available } : t));
      toast({ 
        title: "Availability updated", 
        description: `Tool is now ${newStatus}.` 
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability.",
        variant: "destructive",
      });
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
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">My Tools</h1>
              <p className="text-muted-foreground">Manage your tool listings</p>
              <p className="text-xs text-yellow-500 mt-2">DEBUG: {tools.length} tools loaded, user: {user?.userId}, authLoading: {authLoading}</p>
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
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {categories && categories.length > 0 ? (
                            categories.map((cat) => (
                              <SelectItem key={cat.categoryId} value={cat.categoryName}>
                                {cat.categoryName}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">No categories available</div>
                          )}
                        </SelectContent>
                      </Select>
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
                    
                    {/* Drag & Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        dragActive
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      } ${formData.images.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Cloud className="h-8 w-8 text-primary" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Drag images here or click to browse</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, WebP, GIF up to 5MB each • {formData.images.length}/5 uploaded
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Gallery Preview */}
                    {formData.images.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Preview ({formData.images.length} image{formData.images.length !== 1 ? 's' : ''})</p>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                          {formData.images.map((img, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group"
                            >
                              <img 
                                src={img} 
                                alt={`Preview ${idx + 1}`} 
                                className="w-full h-20 object-cover rounded-lg border border-border"
                              />
                              {idx === 0 && (
                                <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                                  Primary
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(idx);
                                }}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  key={tool.id || `tool-${index}`}
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
                          <p className="text-muted-foreground text-sm">
                            {typeof tool.category === 'object' ? tool.category?.categoryName : tool.category}
                          </p>
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
