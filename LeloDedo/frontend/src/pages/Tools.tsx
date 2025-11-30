import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Star, MapPin, Plus, Sliders, X, Loader } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Tool } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import api from "@/lib/api";

export default function Tools() {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  
  const isAdmin = user?.role === "admin";
  const isLender = user?.role === "lender";
  const isBorrower = user?.role === "borrower";
  const canRequestTools = isBorrower;

  // Fetch items from API
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const response = await api.item.getAll();
        const normalizedTools = (response.data || []).map((tool: any) => {
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
            distance: tool.distance || 0,
            rating: tool.rating || 0,
            ownerId: tool.owner?.userId || tool.ownerId || '',
            ownerName: tool.owner?.name || tool.ownerName || 'Unknown',
          };
        }).filter((tool: any) => tool.ownerId !== user?.userId);  // Exclude user's own tools
        setTools(normalizedTools);
      } catch (error) {
        console.error('Error fetching tools:', error);
        setTools([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [user?.userId]);

  // Search and filter with API
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await api.item.search({
        search: searchQuery,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        condition: selectedCondition !== "all" ? selectedCondition : undefined,
        minRating,
        maxDistance,
      });
      // Normalize category: if it's an object, extract the name; if it's a string, keep it
      const normalizedTools = (response.data || []).map((tool: any) => ({
        ...tool,
        id: tool.item_id || tool.id,
        image: tool.image_url || tool.image,
        images: tool.image_urls || (tool.image_url ? [tool.image_url] : []),
        category: typeof tool.category === 'object' ? tool.category.categoryName : tool.category,
        available: tool.availability_status === 'AVAILABLE',
        pricePerDay: tool.price_per_day || tool.pricePerDay,
      }));
      setTools(normalizedTools);
    } catch (error) {
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...Array.from(new Set(tools.map(t => t.category)))];
  const conditions = ["all", "excellent", "good", "fair"];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesCondition = selectedCondition === "all" || tool.condition === selectedCondition;
    const matchesRating = tool.rating >= minRating;
    const matchesDistance = tool.distance <= maxDistance;
    return matchesSearch && matchesCategory && matchesCondition && matchesRating && matchesDistance;
  });

  const sortedTools = [...filteredTools].sort((a, b) => {
    if (sortBy === "nearest") return a.distance - b.distance;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price-low") return a.pricePerDay - b.pricePerDay;
    if (sortBy === "price-high") return b.pricePerDay - a.pricePerDay;
    return 0;
  });

  const handleRequestRental = async () => {
    if (!selectedTool || !startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Please select start and end dates for your rental.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await api.borrowRequest.create({
        item_id: selectedTool.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      toast({
        title: "Rental request sent!",
        description: `Request for ${selectedTool?.title} has been sent to the owner.`,
      });
      setSelectedTool(null);
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message || "Failed to send rental request.",
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
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {isAdmin ? "Listings" : "Browse Tools"}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? "View and manage all tool listings" : "Find the perfect tool for your project"}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="glass-effect rounded-2xl p-6 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Condition Filter */}
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {conditions.map(cond => (
                    <SelectItem key={cond} value={cond} className="capitalize">
                      {cond}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="nearest">Nearest</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters Button & Active Filters */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="gap-2"
              >
                <Sliders className="h-4 w-4" />
                Advanced Filters
              </Button>
              {(minRating > 0 || maxDistance < 50) && (
                <div className="flex gap-2 flex-wrap">
                  {minRating > 0 && (
                    <button
                      onClick={() => setMinRating(0)}
                      className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1"
                    >
                      Rating ≥ {minRating} <X className="h-3 w-3" />
                    </button>
                  )}
                  {maxDistance < 50 && (
                    <button
                      onClick={() => setMaxDistance(50)}
                      className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1"
                    >
                      Distance ≤ {maxDistance}km <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-border space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Minimum Rating Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium min-w-12">
                        {minRating > 0 ? `${minRating}★` : "Any"}
                      </span>
                    </div>
                  </div>

                  {/* Distance Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Maximum Distance</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium min-w-20">{maxDistance} km</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMinRating(0);
                    setMaxDistance(50);
                    toast({
                      title: "Filters reset",
                      description: "All advanced filters have been cleared.",
                    });
                  }}
                >
                  Reset Advanced Filters
                </Button>
              </motion.div>
            )}
          </div>

          {/* Results Count */}
          <p className="text-muted-foreground">
            {sortedTools.length} {sortedTools.length === 1 ? "tool" : "tools"} found
          </p>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTool(tool)}
                className="glass-effect rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={tool.image}
                    alt={tool.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {!tool.available && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <span className="px-4 py-2 bg-destructive rounded-lg font-semibold">
                        Not Available
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-background/90 backdrop-blur rounded-full flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">{tool.rating}</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {tool.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{tool.distance} km away</span>
                    </div>
                    <div className="font-semibold text-primary">
                      ${tool.pricePerDay}/day
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="px-3 py-1 bg-secondary rounded-lg text-xs capitalize">
                      {tool.condition}
                    </div>
                    <div className="px-3 py-1 bg-secondary rounded-lg text-xs">
                      {tool.category}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Tool Details Dialog */}
      <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          {selectedTool && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">{selectedTool.title}</DialogTitle>
                <DialogDescription className="text-base">
                  Listed by {selectedTool.ownerName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {selectedTool.images && selectedTool.images.length > 0 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {selectedTool.images.map((img, idx) => (
                        <CarouselItem key={idx}>
                          <div className="relative h-72 rounded-xl overflow-hidden">
                            <img
                              src={img}
                              alt={`${selectedTool.title} ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </Carousel>
                ) : (
                  <div className="relative h-72 rounded-xl overflow-hidden">
                    <img
                      src={selectedTool.image}
                      alt={selectedTool.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Price</p>
                    <p className="font-semibold text-lg">${selectedTool.pricePerDay}/day</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Condition</p>
                    <p className="font-semibold capitalize">{selectedTool.condition}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Rating</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      {selectedTool.rating}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Distance</p>
                    <p className="font-semibold">{selectedTool.distance} km</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedTool.description}</p>
                </div>

                {canRequestTools && selectedTool.available && (
                  <div>
                    <h3 className="font-display font-semibold mb-4">Request Rental</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Start Date</label>
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          className="rounded-lg border border-border bg-secondary p-3 pointer-events-auto"
                          disabled={(date) => date < new Date()}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">End Date</label>
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          className="rounded-lg border border-border bg-secondary p-3 pointer-events-auto"
                          disabled={(date) => !startDate || date < startDate}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleRequestRental}
                      className="w-full glow-effect bg-gradient-to-r from-primary to-accent"
                    >
                      Send Request
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
