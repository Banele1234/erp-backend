const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, requiresAuth = true } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (requiresAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth API
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any; customer?: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      requiresAuth: false,
    });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async register(data: any) {
    const response = await this.request<{ token: string; user: any; customer?: any }>('/auth/register', {
      method: 'POST',
      body: data,
      requiresAuth: false,
    });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async getMe() {
    return this.request<{ user: any; customer?: any }>('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Customers API
  async getCustomers(params?: { page?: number; limit?: number; search?: string; type?: string; rating?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.rating) searchParams.set('rating', params.rating);
    return this.request<any[]>(`/customers?${searchParams.toString()}`);
  }

  async getCustomer(id: string) {
    return this.request<any>(`/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request<any>('/customers', { method: 'POST', body: data });
  }

  async updateCustomer(id: string, data: any) {
    return this.request<any>(`/customers/${id}`, { method: 'PUT', body: data });
  }

  async deleteCustomer(id: string) {
    return this.request<void>(`/customers/${id}`, { method: 'DELETE' });
  }

  // Products API
  async getProducts(params?: { page?: number; limit?: number; search?: string; category?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    return this.request<any[]>(`/products?${searchParams.toString()}`);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request<any>('/products', { method: 'POST', body: data });
  }

  async updateProduct(id: string, data: any) {
    return this.request<any>(`/products/${id}`, { method: 'PUT', body: data });
  }

  async deleteProduct(id: string) {
    return this.request<void>(`/products/${id}`, { method: 'DELETE' });
  }

  // Warehouses API
  async getWarehouses() {
    return this.request<any[]>('/warehouses');
  }

  async getWarehouse(id: string) {
    return this.request<any>(`/warehouses/${id}`);
  }

  async createWarehouse(data: any) {
    return this.request<any>('/warehouses', { method: 'POST', body: data });
  }

  async updateWarehouse(id: string, data: any) {
    return this.request<any>(`/warehouses/${id}`, { method: 'PUT', body: data });
  }

  // Inventory API
  async getInventory(params?: { page?: number; limit?: number; warehouse_id?: string; low_stock?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.warehouse_id) searchParams.set('warehouse_id', params.warehouse_id);
    if (params?.low_stock) searchParams.set('low_stock', 'true');
    return this.request<any[]>(`/inventory?${searchParams.toString()}`);
  }

  async adjustInventory(data: { product_id: string; warehouse_id: string; movement_type: string; quantity: number; to_warehouse_id?: string; notes?: string }) {
    return this.request<void>('/inventory/adjust', { method: 'POST', body: data });
  }

  async getInventoryMovements(params?: { page?: number; product_id?: string; warehouse_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.warehouse_id) searchParams.set('warehouse_id', params.warehouse_id);
    return this.request<any[]>(`/inventory/movements?${searchParams.toString()}`);
  }

  // Orders API
  async getOrders(params?: { page?: number; limit?: number; status?: string; customer_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.customer_id) searchParams.set('customer_id', params.customer_id);
    return this.request<any[]>(`/orders?${searchParams.toString()}`);
  }

  async getOrder(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async createOrder(data: { customer_id: string; warehouse_id: string; items: any[]; required_date?: string; notes?: string }) {
    return this.request<any>('/orders', { method: 'POST', body: data });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request<any>(`/orders/${id}/status`, { method: 'PUT', body: { status } });
  }

  async cancelOrder(id: string) {
    return this.request<any>(`/orders/${id}/cancel`, { method: 'POST' });
  }

  // Invoices API
  async getInvoices(params?: { page?: number; limit?: number; payment_status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.payment_status) searchParams.set('payment_status', params.payment_status);
    return this.request<any[]>(`/invoices?${searchParams.toString()}`);
  }

  async getInvoice(id: string) {
    return this.request<any>(`/invoices/${id}`);
  }

  async createInvoice(data: { order_id: string; customer_id: string; due_date?: string; notes?: string }) {
    return this.request<any>('/invoices', { method: 'POST', body: data });
  }

  // Payments API
  async getPayments(params?: { page?: number; limit?: number; customer_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.customer_id) searchParams.set('customer_id', params.customer_id);
    return this.request<any[]>(`/payments?${searchParams.toString()}`);
  }

  async createPayment(data: { invoice_id?: string; customer_id: string; amount: number; payment_method?: string; reference_number?: string; bank_name?: string; notes?: string }) {
    return this.request<any>('/payments', { method: 'POST', body: data });
  }

  // Rejections API
  async getRejections(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    return this.request<any[]>(`/rejections?${searchParams.toString()}`);
  }

  async createRejection(data: { order_id?: string; invoice_id?: string; customer_id: string; product_id: string; quantity: number; reason: string }) {
    return this.request<any>('/rejections', { method: 'POST', body: data });
  }

  async resolveRejection(id: string, data: { resolution: string; credit_issued: number; notes?: string }) {
    return this.request<any>(`/rejections/${id}/resolve`, { method: 'POST', body: data });
  }

  // Production API
  async getProduction(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    return this.request<any[]>(`/production?${searchParams.toString()}`);
  }

  async createProductionBatch(data: { product_id: string; planned_quantity: number; factory: string; expected_completion_date?: string }) {
    return this.request<any>('/production', { method: 'POST', body: data });
  }

  async updateProductionProgress(id: string, data: { produced_quantity?: number; rejected_quantity?: number; status?: string; notes?: string }) {
    return this.request<any>(`/production/${id}`, { method: 'PUT', body: data });
  }

  // Notifications API
  async getNotifications(unreadOnly: boolean = false) {
    return this.request<any[]>(`/notifications?unread_only=${unreadOnly}`);
  }

  async markNotificationRead(id: string) {
    return this.request<void>(`/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request<void>('/notifications/read-all', { method: 'POST' });
  }

  async deleteNotification(id: string) {
    return this.request<void>(`/notifications/${id}`, { method: 'DELETE' });
  }

  // Dashboard API
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getCustomerDashboard() {
    return this.request<any>('/dashboard/customer');
  }

  async getSalesChartData() {
    return this.request<any[]>('/dashboard/sales-chart');
  }
}

export const apiService = new ApiService();
export default apiService;
