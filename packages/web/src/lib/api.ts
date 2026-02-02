import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// API helper functions
export const apiHelpers = {
  // Contacts
  contacts: {
    list: (params?: Record<string, any>) => api.get('/contacts', { params }),
    get: (id: string) => api.get(`/contacts/${id}`),
    create: (data: any) => api.post('/contacts', data),
    update: (id: string, data: any) => api.put(`/contacts/${id}`, data),
    delete: (id: string) => api.delete(`/contacts/${id}`),
  },

  // Companies
  companies: {
    list: (params?: Record<string, any>) => api.get('/companies', { params }),
    get: (id: string) => api.get(`/companies/${id}`),
    create: (data: any) => api.post('/companies', data),
    update: (id: string, data: any) => api.put(`/companies/${id}`, data),
    delete: (id: string) => api.delete(`/companies/${id}`),
  },

  // Deals
  deals: {
    list: (params?: Record<string, any>) => api.get('/deals', { params }),
    get: (id: string) => api.get(`/deals/${id}`),
    create: (data: any) => api.post('/deals', data),
    update: (id: string, data: any) => api.put(`/deals/${id}`, data),
    delete: (id: string) => api.delete(`/deals/${id}`),
    moveToStage: (id: string, stageId: string) => api.patch(`/deals/${id}/stage`, { stageId }),
  },

  // Pipelines
  pipelines: {
    list: () => api.get('/pipelines'),
    get: (id: string) => api.get(`/pipelines/${id}`),
    create: (data: any) => api.post('/pipelines', data),
    update: (id: string, data: any) => api.put(`/pipelines/${id}`, data),
  },

  // Projects
  projects: {
    list: (params?: Record<string, any>) => api.get('/projects', { params }),
    get: (id: string) => api.get(`/projects/${id}`),
    create: (data: any) => api.post('/projects', data),
    update: (id: string, data: any) => api.put(`/projects/${id}`, data),
    delete: (id: string) => api.delete(`/projects/${id}`),
    getPhases: (id: string) => api.get(`/projects/${id}/phases`),
    updatePhase: (projectId: string, phaseId: string, data: any) =>
      api.put(`/projects/${projectId}/phases/${phaseId}`, data),
  },

  // Products
  products: {
    list: (params?: Record<string, any>) => api.get('/products', { params }),
    get: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
  },

  // Quotes
  quotes: {
    list: (params?: Record<string, any>) => api.get('/quotes', { params }),
    get: (id: string) => api.get(`/quotes/${id}`),
    create: (data: any) => api.post('/quotes', data),
    update: (id: string, data: any) => api.put(`/quotes/${id}`, data),
    generatePDF: (id: string) => api.get(`/documents/generate/quote/${id}`, { responseType: 'blob' }),
  },

  // Invoices
  invoices: {
    list: (params?: Record<string, any>) => api.get('/invoices', { params }),
    get: (id: string) => api.get(`/invoices/${id}`),
    create: (data: any) => api.post('/invoices', data),
    update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
    generatePDF: (id: string) => api.get(`/documents/generate/invoice/${id}`, { responseType: 'blob' }),
  },

  // Suppliers
  suppliers: {
    list: (params?: Record<string, any>) => api.get('/suppliers', { params }),
    get: (id: string) => api.get(`/suppliers/${id}`),
    create: (data: any) => api.post('/suppliers', data),
    update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  },

  // Warehouse
  warehouse: {
    list: () => api.get('/warehouses'),
    get: (id: string) => api.get(`/warehouses/${id}`),
    getStock: (warehouseId: string, params?: Record<string, any>) =>
      api.get(`/warehouses/${warehouseId}/stock`, { params }),
    createMovement: (data: any) => api.post('/warehouses/movements', data),
  },

  // DDT
  ddt: {
    list: (params?: Record<string, any>) => api.get('/ddt', { params }),
    get: (id: string) => api.get(`/ddt/${id}`),
    create: (data: any) => api.post('/ddt', data),
    generatePDF: (id: string) => api.get(`/documents/generate/ddt/${id}`, { responseType: 'blob' }),
  },

  // Reports
  reports: {
    list: () => api.get('/reports'),
    get: (id: string) => api.get(`/reports/${id}`),
    execute: (id: string, params?: Record<string, any>) => api.post(`/reports/${id}/execute`, params),
    getSalesSummary: (params?: Record<string, any>) => api.get('/reports/sales-summary', { params }),
    getRevenueTrend: (params?: Record<string, any>) => api.get('/reports/revenue-trend', { params }),
  },

  // Dashboard
  dashboard: {
    getStats: () => api.get('/dashboard/stats'),
    getWidgets: () => api.get('/dashboard/widgets'),
    getRecentActivities: () => api.get('/dashboard/activities'),
  },

  // Integrations
  integrations: {
    list: () => api.get('/integrations'),
    getCatalog: () => api.get('/integrations/catalog'),
    create: (data: any) => api.post('/integrations', data),
    connect: (id: string) => api.post(`/integrations/${id}/connect`),
    disconnect: (id: string) => api.post(`/integrations/${id}/disconnect`),
  },

  // Email
  email: {
    getAccounts: () => api.get('/email/accounts'),
    getEmails: (params?: Record<string, any>) => api.get('/email', { params }),
    linkEmail: (id: string, data: any) => api.post(`/email/${id}/link`, data),
  },

  // AI
  ai: {
    getConfigurations: () => api.get('/ai/configurations'),
    getConversations: () => api.get('/ai/conversations'),
    sendMessage: (conversationId: string, message: string) =>
      api.post(`/ai/conversations/${conversationId}/messages`, { message }),
    createConversation: (data: any) => api.post('/ai/conversations', data),
  },
};
