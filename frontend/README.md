# LeloDedo - Tool Rental & Sharing Platform

A modern, full-stack ready tool rental platform built with React, TypeScript, Tailwind CSS, and Framer Motion.

## 🎨 Features

### Authentication System
- Login, Register, and Forgot Password pages
- Role-based access (Borrower, Lender, Admin)
- Session persistence with localStorage

### User Dashboard
- Personalized welcome with user stats
- Quick action cards
- Recent activity feed
- Role-based content

### Tool Catalog
- Browse all available tools
- Advanced search and filters (category, condition, distance)
- Sort by newest, nearest, or rating
- Detailed tool views with rental request system

### My Tools (Lenders)
- List and manage your tools
- Add/Edit/Delete tools
- Toggle availability
- Track tool performance

### Messaging System
- Real-time chat interface
- Conversation list with unread counts
- Message history
- Clean, modern UI

### Notifications
- System-wide notification center
- Filter by type
- Mark as read/unread
- Delete notifications

### Ratings & Reviews
- Submit reviews with star ratings
- View all reviews
- Tool-specific feedback

### Report System
- Report issues or concerns
- Multiple issue types
- Evidence upload support
- Submission confirmation

### Admin Panel
- User verification system
- Manage tool listings
- Handle disputes and reports
- Platform analytics

### Profile Management
- View and edit profile
- Account statistics
- Security settings

## 🚀 Demo Accounts

Use these credentials to test different user roles:

**Lender Account:**
- Email: `john@example.com`
- Password: any

**Borrower Account:**
- Email: `jane@example.com`
- Password: any

**Admin Account:**
- Email: `admin@lelodedo.com`
- Password: any

## 🎨 Design System

- **Primary Color:** #007AFF (Blue)
- **Accent Color:** #00BFFF (Cyan Blue)
- **Background:** #0F0F10 (Very Dark)
- **Surface:** #1E1E22 (Dark Gray)
- **Text:** #F4F4F5 (Off White)

**Typography:**
- Headings: Poppins SemiBold
- Body: Inter Regular

**Features:**
- Glassmorphism effects
- Smooth animations with Framer Motion
- Hover glow effects
- Responsive design (mobile-first)

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.tsx              # Navigation with role-based menu
│   └── ui/                     # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx         # Authentication state management
├── lib/
│   ├── mockData.ts            # Mock data for demo
│   └── utils.ts               # Utility functions
├── pages/
│   ├── Login.tsx              # Login page
│   ├── Register.tsx           # Registration page
│   ├── ForgotPassword.tsx     # Password reset
│   ├── Dashboard.tsx          # Main dashboard
│   ├── Tools.tsx              # Tool catalog
│   ├── MyTools.tsx            # Tool management
│   ├── Messages.tsx           # Chat interface
│   ├── Notifications.tsx      # Notification center
│   ├── Reviews.tsx            # Ratings & reviews
│   ├── Report.tsx             # Issue reporting
│   ├── Admin.tsx              # Admin panel
│   ├── Profile.tsx            # User profile
│   └── NotFound.tsx           # 404 page
├── types/
│   └── index.ts               # TypeScript types
└── App.tsx                    # Main app with routing
```

## 🛠️ Technologies

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **UI Components:** shadcn/ui
- **Routing:** React Router v6
- **State Management:** React Context API
- **Forms:** React Hook Form + Zod
- **Build Tool:** Vite

## 🔄 Backend Integration (Future)

The app is built with a clean separation between frontend and backend:

- All data is currently mocked in `src/lib/mockData.ts`
- Authentication uses local storage (replace with JWT tokens)
- API calls can be added using React Query (already configured)
- Ready for integration with REST API or GraphQL

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible navigation on mobile
- Touch-optimized interactions

## 🚀 Getting Started
