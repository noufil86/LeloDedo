import { useState, useRef, useEffect } from "react";
// Error logging utility
function logError(context, error) {
  // eslint-disable-next-line no-console
  console.error(`[Messages][${context}]`, error);
}
import { motion } from "framer-motion";
import { Search, Send, Image as ImageIcon, X, CheckCircle, XCircle, AlertCircle, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { Message, BorrowRequest } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { io, Socket } from "socket.io-client";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLender = user?.role === "lender";
  const isBorrower = user?.role === "borrower";
  const isAdmin = user?.role === "admin";

  // Fetch borrow requests on mount AND periodically refresh them
  useEffect(() => {
    const fetchBorrowRequests = async () => {
      try {
        let requestsData: any[] = [];
        
        // Fetch both incoming and sent requests
        const incomingRes = await api.borrowRequest.getIncoming().catch(() => ({ data: [] }));
        const sentRes = await api.borrowRequest.getSent().catch(() => ({ data: [] }));
        
        requestsData = [...(incomingRes.data || []), ...(sentRes.data || [])];

        // Map API response to BorrowRequest format
        const mappedRequests = requestsData.map((req: any) => ({
          id: req.requestId?.toString() || req.id?.toString(),
          toolId: req.itemId?.toString() || req.toolId?.toString(),
          toolName: req.item?.title || req.toolName || "",
          borrowerId: req.borrower?.userId || req.borrowerId,
          borrowerName: req.borrower?.name || req.borrowerName || "",
          lenderId: req.lender?.userId || req.lenderId,
          lenderName: req.lender?.name || req.lenderName || "",
          startDate: req.startDate || req.start_date,
          endDate: req.endDate || req.end_date,
          status: (req.status || "PENDING").toLowerCase(),
          timestamp: req.requestDate || req.request_date || new Date().toISOString(),
        }));

        setBorrowRequests(mappedRequests);
      } catch (error) {
        console.error("Error fetching borrow requests:", error);
      }
    };

    if (user?.userId) {
      fetchBorrowRequests();
      
      // Refresh every 3 seconds
      const interval = setInterval(fetchBorrowRequests, 3000);
      return () => clearInterval(interval);
    }
  }, [user?.userId]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user?.userId) return;

    // Connect to WebSocket server
    const newSocket = io("http://localhost:3000", {
      query: { user_id: user.userId },
      reconnection: true,
    });

    newSocket.on("connect", () => {
      // ...existing code...
    });

    newSocket.on("new_message", (msg: any) => {
      try {
        const newMsg: Message = {
          id: msg.messageId?.toString() || msg.id?.toString(),
          senderId: msg.sender?.userId || msg.senderId,
          senderName: msg.sender?.name || msg.senderName || "",
          receiverId: msg.receiver?.userId || msg.receiverId,
          content: msg.content || msg.text || "",
          timestamp: msg.sentAt || msg.createdAt || msg.timestamp || new Date().toISOString(),
          read: msg.read || msg.isRead || false,
          imageUrl: msg.imageUrl || msg.image || undefined,
        };
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } catch (error) {
        logError('socket new_message', error);
        toast({ title: 'Socket Error', description: 'Failed to process incoming message', variant: 'destructive' });
      }
    });

    newSocket.on("message_sent", (msg: any) => {
      try {
        // Message is already added via new_message event, this is just confirmation
      } catch (error) {
        logError('socket message_sent', error);
      }
    });

    newSocket.on("disconnect", () => {
      try {
        // ...existing code...
      } catch (error) {
        logError('socket disconnect', error);
      }
    });

    setSocket(newSocket);

    return () => {
      try {
        newSocket.disconnect();
      } catch (error) {
        logError('socket cleanup', error);
      }
    };
  }, [user?.userId]);

  // Fetch messages for all accepted conversations
  useEffect(() => {
    const fetchConversationMessages = async () => {
      try {
        const acceptedRequests = borrowRequests.filter(req => req.status === "accepted");
        const allMessages: Message[] = [];

        // Fetch messages for each accepted request
        for (const request of acceptedRequests) {
          try {
            // First get the conversation ID from the borrow request ID
            const convRes = await api.message.getConversationByBorrowRequest(parseInt(request.id));
            // ...existing code...
            const conversationId = convRes.data.conversation_id || convRes.data?.conversationId;
            // ...existing code...

            if (!conversationId) {
              // ...existing code...
              continue;
            }

            // Then fetch conversation history using the conversation ID
            const response = await api.message.getConversation(conversationId.toString());
            const apiMessages = response.data || [];

            // Map API messages to Message format
            const mappedMessages = apiMessages.map((msg: any) => ({
              id: msg.messageId?.toString() || msg.id?.toString(),
              senderId: msg.sender?.userId || msg.senderId,
              senderName: msg.sender?.name || msg.senderName || "",
              receiverId: msg.receiver?.userId || msg.receiverId,
              content: msg.content || msg.text || "",
              timestamp: msg.sentAt || msg.createdAt || msg.timestamp || new Date().toISOString(),
              read: msg.read || msg.isRead || false,
              imageUrl: msg.imageUrl || msg.image || undefined,
            }));

            allMessages.push(...mappedMessages);
          } catch (error) {
            // ...existing code...
          }
        }

        // If we got messages from API, use them. Otherwise create placeholders for empty conversations
        if (allMessages.length > 0) {
          setMessages(allMessages);
        } else {
          // Create placeholder messages only if no real messages exist
          const initialMessages: Message[] = [];
          acceptedRequests.forEach(request => {
            const messageId = `initial-${request.id}`;
            const messageExists = initialMessages.some(msg => msg.id === messageId);
            
            if (!messageExists) {
              initialMessages.push({
                id: messageId,
                senderId: request.borrowerId,
                senderName: request.borrowerName,
                receiverId: request.lenderId,
                content: `Hi! I want to rent your ${request.toolName}. From ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()}.`,
                timestamp: request.timestamp,
                read: false,
              });
            }
          });
          setMessages(initialMessages);
        }
      } catch (error) {
        console.error("Error fetching conversation messages:", error);
      }
    };

    if (borrowRequests.length > 0) {
      fetchConversationMessages();
    }
  }, [borrowRequests]);

  // Get accepted request IDs to enable chat (using consistent lexicographic ordering)
  const acceptedRequestIds = borrowRequests
    .filter(req => req.status === "accepted")
    .map(req => {
      // Use consistent ordering (smaller ID first)
      return req.borrowerId < req.lenderId 
        ? `${req.borrowerId}-${req.lenderId}`
        : `${req.lenderId}-${req.borrowerId}`;
    });

  // Use a consistent conversation key for all messages
  function getConversationKey(a, b) {
    // Always order IDs numerically for consistency
    const id1 = Number(a);
    const id2 = Number(b);
    return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  }

  // Filter messages for accepted conversations only
  const validMessages = messages.length > 0
    ? messages.filter(msg => {
        const conversationKey = getConversationKey(msg.senderId, msg.receiverId);
        return acceptedRequestIds.includes(conversationKey);
      })
    : [];

  // Also create empty conversation entries for accepted requests with no messages yet
  const conversationKeysWithMessages = new Set(
    validMessages.map(msg => getConversationKey(msg.senderId, msg.receiverId))
  );

  const emptyConversations: Message[] = [];
  for (const req of borrowRequests.filter(r => r.status === "accepted")) {
    const key = getConversationKey(req.borrowerId, req.lenderId);
    if (!conversationKeysWithMessages.has(key)) {
      // Create a placeholder message to ensure conversation shows up
      emptyConversations.push({
        id: `placeholder-${req.id}`,
        senderId: req.borrowerId,
        senderName: req.borrowerName,
        receiverId: req.lenderId,
        content: `Hi! I want to rent your ${req.toolName}. From ${new Date(req.startDate).toLocaleDateString()} to ${new Date(req.endDate).toLocaleDateString()}.`,
        timestamp: req.timestamp,
        read: false,
      });
    }
  }

  const allValidMessages = [...validMessages, ...emptyConversations];

  // Group messages by conversation, filter by role

  // Group all messages by consistent conversation key
  const conversations = allValidMessages.reduce((acc, message) => {
    const conversationKey = getConversationKey(message.senderId, message.receiverId);
    if (!acc[conversationKey]) {
      acc[conversationKey] = [];
    }
    acc[conversationKey].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  // When a conversation is selected, show all messages for that conversation key
  const selectedMessages = selectedConversation
    ? conversations[selectedConversation] || []
    : [];

  const conversationList = Object.entries(conversations).map(([conversationKey, msgs]) => {
    const sortedMsgs = msgs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastMsg = sortedMsgs[0];
    
    if (isAdmin) {
      // For admin: conversationKey is "userId1-userId2" format
      const [userId1, userId2] = conversationKey.split('-');
      const user1Name = msgs.find(m => m.senderId === userId1)?.senderName || 
                        msgs.find(m => m.receiverId === userId1 && m.senderId !== userId1)?.senderName || "User";
      const user2Name = msgs.find(m => m.senderId === userId2)?.senderName || 
                        msgs.find(m => m.receiverId === userId2 && m.senderId !== userId2)?.senderName || "User";
      
      return {
        userId: conversationKey, // Keep composite key for admin
        userName: `${user1Name} ↔ ${user2Name}`,
        lastMessage: lastMsg.imageUrl ? "📷 Image" : lastMsg.content,
        timestamp: lastMsg.timestamp,
        unread: msgs.filter(m => !m.read && m.receiverId === user?.userId).length,
      };
    } else {
      // For regular users: conversationKey is the other user's ID
      let otherUserName = "Other User";
      if (lastMsg.senderId === user?.userId) {
        // I sent the message, so get receiver's name from the borrow request
        const request = borrowRequests.find(
          req => (req.borrowerId === lastMsg.receiverId || req.lenderId === lastMsg.receiverId)
        );
        otherUserName = request?.borrowerId === lastMsg.receiverId 
          ? request.borrowerName 
          : request?.lenderName || "Other User";
      } else {
        // They sent the message, use their name
        otherUserName = lastMsg.senderName;
      }
      
      return {
        userId: conversationKey,
        userName: otherUserName,
        lastMessage: lastMsg.imageUrl ? "📷 Image" : lastMsg.content,
        timestamp: lastMsg.timestamp,
        unread: msgs.filter(m => !m.read && m.receiverId === user?.userId).length,
      };
    }
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Get pending borrow requests for lender
  const pendingRequests = isLender 
    ? borrowRequests.filter(req => req.lenderId?.toString() === user?.userId?.toString() && req.status === "pending")
    : [];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedImage) || !selectedConversation || !socket) return;

    try {
      // Find the borrow request for this conversation
      const borrowRequest = borrowRequests.find(req => 
        req.status === "accepted" && (
          (req.borrowerId?.toString() === selectedConversation) ||
          (req.lenderId?.toString() === selectedConversation)
        )
      );

      if (!borrowRequest) {
        console.error("Available requests:", borrowRequests);
        console.error("Selected conversation:", selectedConversation);
        toast({
          title: "Error",
          description: "No accepted borrow request found for this conversation",
          variant: "destructive",
        });
        return;
      }

      // ...existing code...

      // Optimistically add the message to the UI
      const optimisticMsg = {
        id: `optimistic-${Date.now()}`,
        senderId: user?.userId,
        senderName: user?.name || "You",
        receiverId: user?.userId === borrowRequest.lenderId ? borrowRequest.borrowerId : borrowRequest.lenderId,
        content: messageText,
        timestamp: new Date().toISOString(),
        read: false,
        imageUrl: selectedImage || undefined,
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // Emit message via WebSocket using borrow_request_id
      socket.emit("send_message", {
        borrow_request_id: parseInt(borrowRequest.id),
        sender_id: parseInt(user?.userId || "0"),
        text: messageText,
        image: selectedImage,
      });

      setMessageText("");
      setSelectedImage(null);
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const request = borrowRequests.find(req => req.id === requestId);
    if (!request) return;

    try {
      // ...existing code...
      // Call API to approve the borrow request in the database
      const approveRes = await api.borrowRequest.approve(requestId);
      // ...existing code...
      
      // Update local state
      setBorrowRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: "accepted" as const } : req)
      );
      
      // ...existing code...
      // Fetch messages for this newly accepted request from the database
      const convRes = await api.message.getConversationByBorrowRequest(parseInt(requestId));
      // ...existing code...
      // ...existing code...
      const conversationId = convRes.data.conversation_id || convRes.data?.conversationId;
      // ...existing code...
      
      if (!conversationId) {
        throw new Error("Conversation ID not found in response");
      }
      
      const response = await api.message.getConversation(conversationId.toString());
      const apiMessages = response.data || [];

      if (apiMessages.length > 0) {
        // We have real messages from the database
        const mappedMessages = apiMessages.map((msg: any) => ({
          id: msg.messageId?.toString() || msg.id?.toString(),
          senderId: msg.sender?.userId || msg.senderId,
          senderName: msg.sender?.name || msg.senderName || "",
          receiverId: msg.receiver?.userId || msg.receiverId,
          content: msg.content || msg.text || "",
          timestamp: msg.sentAt || msg.createdAt || msg.timestamp || new Date().toISOString(),
          read: msg.read || msg.isRead || false,
          imageUrl: msg.imageUrl || msg.image || undefined,
        }));
        
        setMessages(prev => [...prev, ...mappedMessages]);
      } else {
        // No messages yet, create initial placeholder
        const initialMessage: Message = {
          id: `initial-${requestId}-${Date.now()}`,
          senderId: request.borrowerId,
          senderName: request.borrowerName,
          receiverId: request.lenderId,
          content: `Hi! I want to rent your ${request.toolName}. From ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()}.`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setMessages(prev => [initialMessage, ...prev]);
      }
      
      // Auto-select the new conversation (use lender ID for lender's view, borrower ID for borrower's view)
      // Since this is typically called when lender accepts, set to borrower ID
      setSelectedConversation(request.borrowerId);
      
      toast({
        title: "Request Accepted",
        description: "Chat created successfully. You can now message each other.",
      });
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
    
    setSelectedRequest(null);
  };

  const handleRejectRequest = (requestId: string) => {
    setBorrowRequests(prev => 
      prev.map(req => req.id === requestId ? { ...req, status: "rejected" as const } : req)
    );
    
    toast({
      title: "Request rejected",
      description: "The request has been declined",
    });
    
    setSelectedRequest(null);
  };

  const handleReportUser = () => {
    if (!reportReason.trim()) {
      toast({
        title: "Enter a reason",
        description: "Please provide a reason for the report",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "User reported",
      description: "Your report has been sent to the admin",
    });
    
    setReportDialogOpen(false);
    setReportReason("");
  };

  const handleRateUser = () => {
    if (userRating === 0) {
      toast({
        title: "Select a rating",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Rating submitted",
      description: `You rated ${otherUserName} ${userRating} stars`,
    });
    
    setRatingDialogOpen(false);
    setUserRating(0);
    setHoveredRating(0);
  };

  const currentConversationMessages = selectedConversation
    ? (conversations[selectedConversation] || []).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [];

  const otherUserName = selectedConversation
    ? (() => {
        if (isAdmin) {
          // For admin, show both participants
          const [userId1, userId2] = selectedConversation.split('-');
          if (currentConversationMessages.length > 0) {
            const user1Name = currentConversationMessages.find(m => m.senderId === userId1)?.senderName || 
                              currentConversationMessages.find(m => m.receiverId === userId1)?.senderName || "User 1";
            const user2Name = currentConversationMessages.find(m => m.senderId === userId2)?.senderName || 
                              currentConversationMessages.find(m => m.receiverId === userId2)?.senderName || "User 2";
            return `${user1Name} ↔ ${user2Name}`;
          }
          return "Conversation";
        }
        
        // For regular users
        // First try from messages
        if (currentConversationMessages.length > 0) {
          const firstMsg = currentConversationMessages[0];
          if (firstMsg.senderId === user?.userId) {
            // Get the receiver's name from borrow requests
            const request = borrowRequests.find(
              req => (req.borrowerId === firstMsg.receiverId || req.lenderId === firstMsg.receiverId)
            );
            return request?.borrowerId === firstMsg.receiverId 
              ? request.borrowerName 
              : request?.lenderName || "Other User";
          }
          return firstMsg.senderName;
        }
        
        // Fallback: get from borrow request using selectedConversation
        const request = borrowRequests.find(
          req => req.borrowerId === selectedConversation || req.lenderId === selectedConversation
        );
        if (request) {
          return selectedConversation === request.borrowerId 
            ? request.borrowerName 
            : request.lenderName;
        }
        return "Other User";
      })()
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-[calc(100vh-12rem)]"
        >
          {isLender ? (
            <Tabs defaultValue="messages" className="h-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                <TabsTrigger value="messages">
                  Messages
                  {conversationList.reduce((sum, c) => sum + c.unread, 0) > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-xs">
                      {conversationList.reduce((sum, c) => sum + c.unread, 0)}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="requests">
                  Borrow Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-xs">
                      {pendingRequests.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="messages" className="h-[calc(100%-4rem)]">
                <div className="grid md:grid-cols-[350px_1fr] gap-4 h-full">
                  {/* Conversations List */}
                  <div className="glass-effect rounded-2xl border border-border overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search conversations..."
                          className="pl-10 bg-secondary border-border"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {conversationList.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <p>No conversations yet</p>
                          <p className="text-sm mt-2">Accept a borrow request to start chatting</p>
                        </div>
                      ) : (
                        conversationList.map((conv) => (
                          <div
                            key={conv.userId}
                            onClick={() => setSelectedConversation(conv.userId)}
                            className={`p-4 border-b border-border cursor-pointer transition-colors ${
                              selectedConversation === conv.userId
                                ? "bg-primary/10"
                                : "hover:bg-secondary/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-semibold shrink-0">
                                {conv.userName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium truncate">{conv.userName}</p>
                                  {conv.unread > 0 && (
                                    <span className="h-5 w-5 rounded-full bg-primary text-xs flex items-center justify-center text-white font-semibold shrink-0">
                                      {conv.unread}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chat Window */}
                  <div className="glass-effect rounded-2xl border border-border flex flex-col overflow-hidden">
                    {selectedConversation ? (
                      <>
                        <div className="p-4 border-b border-border flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-semibold">
                              {otherUserName.charAt(0)}
                            </div>
                            <div>
                              <button
                                onClick={() => !isAdmin && setRatingDialogOpen(true)}
                                className={`font-medium ${!isAdmin ? 'hover:text-primary cursor-pointer transition-colors' : ''}`}
                                disabled={isAdmin}
                              >
                                {otherUserName}
                              </button>
                            </div>
                          </div>
                          {!isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReportDialogOpen(true)}
                              className="text-destructive hover:text-destructive"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Report User
                            </Button>
                          )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {currentConversationMessages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${msg.senderId === user?.userId ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`max-w-[70%] ${msg.senderId === user?.userId ? "order-2" : ""}`}>
                                {msg.imageUrl && (
                                  <img
                                    src={msg.imageUrl}
                                    alt="Shared"
                                    className="rounded-lg mb-2 max-h-64 object-cover"
                                  />
                                )}
                                {msg.content && (
                                  <div
                                    className={`rounded-2xl px-4 py-2 ${
                                      msg.senderId === user?.userId
                                        ? "bg-primary text-white"
                                        : "bg-secondary"
                                    }`}
                                  >
                                    <p>{msg.content}</p>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="p-4 border-t border-border">
                          {selectedImage && (
                            <div className="mb-3 relative inline-block">
                              <img src={selectedImage} alt="Preview" className="h-24 rounded-lg" />
                              <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <ImageIcon className="h-5 w-5" />
                            </Button>
                            <Input
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                              placeholder="Type a message..."
                              className="flex-1 bg-secondary border-border"
                            />
                            <Button onClick={handleSendMessage} className="bg-primary">
                              <Send className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p>Select a conversation to start messaging</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="requests" className="h-[calc(100%-4rem)]">
                <div className="glass-effect rounded-2xl border border-border p-6 h-full overflow-y-auto">
                  <h2 className="text-2xl font-display font-semibold mb-6">Borrow Requests</h2>
                  
                  {pendingRequests.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <p>No pending borrow requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{request.borrowerName}</p>
                              <p className="text-sm text-muted-foreground">wants to rent {request.toolName}</p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-medium">
                              Pending
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            From {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(request.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="grid md:grid-cols-[350px_1fr] gap-4 h-full">
              {/* Same messages UI for borrowers */}
              <div className="glass-effect rounded-2xl border border-border overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {conversationList.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No conversations yet</p>
                      <p className="text-sm mt-2">Request a tool to start chatting</p>
                    </div>
                  ) : (
                    conversationList.map((conv) => (
                      <div
                        key={conv.userId}
                        onClick={() => setSelectedConversation(conv.userId)}
                        className={`p-4 border-b border-border cursor-pointer transition-colors ${
                          selectedConversation === conv.userId
                            ? "bg-primary/10"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-semibold shrink-0">
                            {conv.userName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-medium truncate">{conv.userName}</p>
                              {conv.unread > 0 && (
                                <span className="h-5 w-5 rounded-full bg-primary text-xs flex items-center justify-center text-white font-semibold shrink-0">
                                  {conv.unread}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="glass-effect rounded-2xl border border-border flex flex-col overflow-hidden">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-semibold">
                          {otherUserName.charAt(0)}
                        </div>
                      <div>
                        <button
                          onClick={() => setRatingDialogOpen(true)}
                          className="font-medium hover:text-primary cursor-pointer transition-colors"
                        >
                          {otherUserName}
                        </button>
                      </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportDialogOpen(true)}
                        className="text-destructive hover:text-destructive"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Report User
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {currentConversationMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.senderId === user?.userId ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[70%] ${msg.senderId === user?.userId ? "order-2" : ""}`}>
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="Shared"
                                className="rounded-lg mb-2 max-h-64 object-cover"
                              />
                            )}
                            {msg.content && (
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  msg.senderId === user?.userId
                                    ? "bg-primary text-white"
                                    : "bg-secondary"
                                }`}
                              >
                                <p>{msg.content}</p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-border">
                      {selectedImage && (
                        <div className="mb-3 relative inline-block">
                          <img src={selectedImage} alt="Preview" className="h-24 rounded-lg" />
                          <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 bg-secondary border-border"
                        />
                        <Button onClick={handleSendMessage} className="bg-primary">
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p>Select a conversation to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="bg-card border-border">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Borrow Request</DialogTitle>
                <DialogDescription>
                  From {selectedRequest.borrowerName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Tool</p>
                  <p className="font-medium">{selectedRequest.toolName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                    <p className="font-medium">{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">End Date</p>
                    <p className="font-medium">{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium">
                    Hi! I want to rent your {selectedRequest.toolName}. From {new Date(selectedRequest.startDate).toLocaleDateString()} to {new Date(selectedRequest.endDate).toLocaleDateString()}.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAcceptRequest(selectedRequest.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report User Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Describe the issue with this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason for Report</label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="bg-secondary border-border min-h-32"
                placeholder="Describe the issue..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleReportUser} className="flex-1 bg-destructive hover:bg-destructive/90">
                Submit Report
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setReportDialogOpen(false);
                  setReportReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rate User Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Rate User</DialogTitle>
            <DialogDescription>
              Rate your experience with {otherUserName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || userRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleRateUser} className="flex-1">
                Submit Rating
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRatingDialogOpen(false);
                  setUserRating(0);
                  setHoveredRating(0);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
