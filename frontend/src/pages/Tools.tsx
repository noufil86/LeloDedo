import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Star, MapPin, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { mockTools } from "@/lib/mockData";
import { Tool } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function Tools() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
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

  const categories = ["all", ...Array.from(new Set(mockTools.map(t => t.category)))];
  const conditions = ["all", "excellent", "good", "fair"];

  const filteredTools = mockTools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesCondition = selectedCondition === "all" || tool.condition === selectedCondition;
    return matchesSearch && matchesCategory && matchesCondition;
  });

  const sortedTools = [...filteredTools].sort((a, b) => {
    if (sortBy === "nearest") return a.distance - b.distance;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const handleRequestRental = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Please select start and end dates for your rental.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Rental request sent!",
      description: `Request for ${selectedTool?.title} has been sent to the owner.`,
    });
    setSelectedTool(null);
    setStartDate(undefined);
    setEndDate(undefined);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                </SelectContent>
              </Select>
            </div>
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
