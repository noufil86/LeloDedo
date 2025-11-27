import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { mockReviews, mockTools } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Reviews() {
  const [reviews, setReviews] = useState(mockReviews);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Select a rating",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    const newReview = {
      id: Date.now().toString(),
      toolId: "1",
      userId: "2",
      userName: "You",
      rating,
      comment,
      timestamp: new Date().toISOString(),
    };

    setReviews([newReview, ...reviews]);
    toast({
      title: "Review submitted!",
      description: "Thank you for your feedback.",
    });

    setRating(0);
    setComment("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Ratings & Reviews
            </h1>
            <p className="text-muted-foreground">Share your experience with the community</p>
          </div>

          {/* Submit Review Form */}
          <div className="glass-effect rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-display font-semibold mb-4">Write a Review</h2>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this tool..."
                  className="bg-secondary border-border min-h-32"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full glow-effect bg-gradient-to-r from-primary to-accent"
              >
                Submit Review
              </Button>
            </form>
          </div>

          {/* Reviews List */}
          <div>
            <h2 className="text-xl font-display font-semibold mb-4">
              Recent Reviews ({reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.map((review, index) => {
                const tool = mockTools.find(t => t.id === review.toolId);
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-effect rounded-2xl p-6 border border-border"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-semibold">
                            {review.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{review.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {tool && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Tool: <span className="font-medium text-foreground">{tool.title}</span>
                      </p>
                    )}

                    <p className="text-muted-foreground">{review.comment}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
