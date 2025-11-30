export type UserRole = "borrower" | "lender" | "admin";

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  rating: number;
  totalRentals: number;
  joinedDate: string;
  verifiedStatus?: boolean;
  warningCount?: number;
  banned?: boolean;
  banUntil?: string;
  banReason?: string;
  suspensionReason?: string;
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  condition: "excellent" | "good" | "fair";
  category: string;
  image: string;
  images: string[];
  ownerId: string;
  ownerName: string;
  distance: number;
  available: boolean;
  rating: number;
  pricePerDay: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  imageUrl?: string;
}

export interface Notification {
  id: string;
  type: "request" | "approval" | "message" | "return" | "admin" | "bug_report";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Review {
  id: string;
  toolId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface BugReport {
  id: string;
  type: string;
  description: string;
  reporterId: string;
  reporterName: string;
  timestamp: string;
  status: "pending" | "resolved" | "in-progress";
  evidenceImages: string[];
}

export interface ToolCategory {
  id: string;
  name: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalItems: number;
  totalBorrows: number;
  averageRating: number;
  pendingVerifications: number;
  activeUsers: number;
}

export interface BorrowRequest {
  id: string;
  toolId: string;
  toolName: string;
  borrowerId: string;
  borrowerName: string;
  lenderId: string;
  lenderName: string;
  startDate: string;
  endDate: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "returned" | "return_requested";
  timestamp: string;
  extensionRequested?: boolean;
  extensionRequestedUntil?: string;
  extensionRequestedAt?: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  description: string;
  timestamp: string;
  status: "pending" | "resolved" | "in-progress";
  evidenceUrls?: string[];
}
