import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
  status: number;
  message: string;
  error?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('lelodedo_token');
      console.log('📡 Request interceptor - Token:', token ? 'YES' : 'NO');
      console.log('📡 URL:', config.url);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('📡 Added Authorization header');
      }
      return config;
    });

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('🚨 API ERROR:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        
        if (error.response?.status === 401) {
          console.error('❌ 401 UNAUTHORIZED - DO NOT REDIRECT YET');
          // Temporarily disabled auto-redirect for debugging
          // localStorage.removeItem('lelodedo_token');
          // localStorage.removeItem('lelodedo_user');
          // window.location.href = '/login';
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        status: error.response.status,
        message: (error.response.data as any)?.message || error.message,
        error: (error.response.data as any)?.error,
      };
    }
    return {
      status: 0,
      message: error.message || 'An error occurred',
    };
  }

  // Auth endpoints
  auth = {
    login: (email: string, password: string) =>
      this.client.post('/auth/login', { email, password }),
    
    register: (data: { name: string; email: string; password: string; role: string; phone_number?: string }) =>
      this.client.post('/auth/register', data),
    
    getCurrentUser: () =>
      this.client.get('/auth/me'),
    
    requestPasswordReset: (email: string) =>
      this.client.post('/auth/password-reset-request', { email }),
    
    resetPassword: (reset_token: string, new_password: string) =>
      this.client.post('/auth/password-reset', { reset_token, new_password }),
    
    logout: () => {
      localStorage.removeItem('lelodedo_token');
      localStorage.removeItem('lelodedo_user');
    },
  };

  // User endpoints
  user = {
    getProfile: (userId: string) =>
      this.client.get(`/user/${userId}/profile`),
    
    updateProfile: (userId: string, data: any) =>
      this.client.patch(`/user/${userId}`, data),
    
    verify: (userId: string, verified: boolean) =>
      this.client.patch(`/user/${userId}/verify`, { verified }),
  };

  // Item endpoints
  item = {
    create: (data: FormData | any) => {
      if (data instanceof FormData) {
        return this.client.post('/item', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        return this.client.post('/item', data);
      }
    },
    
    getAll: (params?: any) =>
      this.client.get('/item', { params }),
    
    getById: (id: string) =>
      this.client.get(`/item/${id}`),
    
    update: (id: string, data: any) =>
      this.client.patch(`/item/${id}`, data),
    
    delete: (id: string) =>
      this.client.delete(`/item/${id}`),
    
    uploadImage: (itemId: string, formData: FormData) =>
      this.client.post(`/item/${itemId}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    
    search: (params: any) =>
      this.client.get('/item/search/query', { params }),
  };

  // Tool Category endpoints
  toolCategory = {
    getAll: () =>
      this.client.get('/tool-category'),
    
    create: (data: any) =>
      this.client.post('/tool-category', data),
    
    update: (id: string, data: any) =>
      this.client.patch(`/tool-category/${id}`, data),
    
    delete: (id: string) =>
      this.client.delete(`/tool-category/${id}`),
    
    restore: (id: string) =>
      this.client.patch(`/tool-category/${id}/restore`),
    
    merge: (sourceId: string, targetId: string) =>
      this.client.post(`/tool-category/${sourceId}/merge`, { targetId }),
  };

  // Borrow Request endpoints
  borrowRequest = {
    create: (data: any) =>
      this.client.post('/borrow-request', data),
    
    getSent: () =>
      this.client.get('/borrow-request/sent'),
    
    getIncoming: () =>
      this.client.get('/borrow-request/incoming'),
    
    getById: (id: string) =>
      this.client.get(`/borrow-request/${id}`),
    
    approve: (id: string) =>
      this.client.patch(`/borrow-request/${id}/approve`),
    
    decline: (id: string) =>
      this.client.patch(`/borrow-request/${id}/decline`),
    
    cancel: (id: string) =>
      this.client.patch(`/borrow-request/${id}/cancel`),
    
    requestReturn: (id: string) =>
      this.client.patch(`/borrow-request/${id}/return-request`),
    
    confirmReturn: (id: string) =>
      this.client.patch(`/borrow-request/${id}/confirm-return`),
    
    requestExtension: (id: string, extendUntilDays: number) =>
      this.client.post(`/borrow-request/${id}/extend-request`, { extension_days: extendUntilDays }),
    
    approveExtension: (id: string) =>
      this.client.patch(`/borrow-request/${id}/extend-approve`),
    
    declineExtension: (id: string) =>
      this.client.patch(`/borrow-request/${id}/extend-decline`),
  };

  // Message endpoints
  message = {
    send: (data: any) =>
      this.client.post('/message/send', data),
    
    getInbox: () =>
      this.client.get('/message/inbox'),
    
    getConversation: (conversationId: string) =>
      this.client.get(`/message/${conversationId}/history`),
    
    getConversationByBorrowRequest: (borrowRequestId: number) =>
      this.client.get(`/message/by-borrow-request/${borrowRequestId}`),

    markRead: (conversationId: string) =>
      this.client.post('/message/mark-read', { conversationId }),
    
    getUnreadCount: (conversationId: string) =>
      this.client.get(`/message/${conversationId}/unread-count`),
  };

  // Rating endpoints
  rating = {
    create: (requestId: string, data: any) =>
      this.client.post(`/rating/${requestId}`, data),
    
    getByUser: (userId: string) =>
      this.client.get(`/rating/user/${userId}`),
    
    getAverageByUser: (userId: string) =>
      this.client.get(`/rating/user/${userId}/average`),
  };

  // Report endpoints
  report = {
    createUserReport: (userId: string, data: FormData) =>
      this.client.post(`/report/user/${userId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    
    createMessageReport: (messageId: string, data: FormData) =>
      this.client.post(`/report/message/${messageId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    
    getAllReports: () =>
      this.client.get('/report/admin/all'),
    
    getUserReports: (userId: string) =>
      this.client.get(`/report/admin/user/${userId}`),
    
    getReportStats: () =>
      this.client.get('/report/admin/stats'),
    
    getReport: (reportId: string) =>
      this.client.get(`/report/admin/${reportId}`),
    
    resolveReport: (reportId: string) =>
      this.client.patch(`/report/admin/${reportId}/resolve`),
    
    ignoreReport: (reportId: string) =>
      this.client.patch(`/report/admin/${reportId}/ignore`),
  };

  // Admin endpoints
  admin = {
    getUsers: (params?: any) =>
      this.client.get('/admin/users', { params }),
    
    getUser: (userId: string) =>
      this.client.get(`/admin/users/${userId}`),
    
    changeUserRole: (userId: string, role: string) =>
      this.client.patch(`/admin/users/${userId}/role`, { role }),
    
    suspendUser: (userId: string, reason: string) =>
      this.client.patch(`/admin/users/${userId}/suspend`, { reason }),
    
    warnUser: (userId: string, data: any) =>
      this.client.patch(`/admin/users/${userId}/warn`, data),
    
    banUser: (userId: string, data: any) =>
      this.client.patch(`/admin/users/${userId}/ban`, data),
    
    unbanUser: (userId: string) =>
      this.client.patch(`/admin/users/${userId}/unban`),
    
    verifyUser: (userId: string) =>
      this.client.patch(`/admin/users/${userId}/verify`),
    
    unverifyUser: (userId: string) =>
      this.client.patch(`/admin/users/${userId}/unverify`),
    
    getAnalytics: () =>
      this.client.get('/admin/analytics'),
  };
}

const api = new ApiClient();
export default api;
export type { ApiError };
