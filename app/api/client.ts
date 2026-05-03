const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Helper to get user data from localStorage
const getUserData = () => {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem('user');
    if (userJson && userJson !== 'undefined') {
      return JSON.parse(userJson);
    }
  }
  return null;
};

// Helper to get user_id from localStorage
const getUserId = () => {
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('user_id');
    return userId ? parseInt(userId) : null;
  }
  return null;
};

const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
};

export const apiClient = {
  async post(endpoint: string, data: any, includeAuth = true) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(includeAuth),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async get(endpoint: string, params?: Record<string, string>, includeAuth = true) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    }
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(includeAuth),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async postFormData(endpoint: string, formData: FormData, includeAuth = true) {
    const headers: Record<string, string> = {};
    if (includeAuth) {
      const token = getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },
};

// Export user data helpers for use in components and API calls
export const userDataClient = {
  getUserId,
  getUserData,
  getUser: () => getUserData(),
  getEmail: () => getUserData()?.email,
  getFullName: () => getUserData()?.full_name,
  getRoleId: () => getUserData()?.role_id,
  isSuperAdmin: () => getUserData()?.is_super_admin || false,
};

// Auth APIs
export const login = (email: string, passwordHash: string) =>
  apiClient.post('/api/auth/login-service/', { email, password_hash: passwordHash }, false);

export const register = (userData: { email: string; password_hash: string; full_name: string; role_id: number; is_super_admin: boolean }) =>
  apiClient.post('/api/auth/users-service/', userData, false);

export const logout = (refreshToken: string) =>
  apiClient.post('/api/auth/logout-service/', { refresh_token: refreshToken });

export const refreshTokenApi = (refreshToken: string) =>
  apiClient.post('/api/auth/refresh-token-service/', { refresh_token: refreshToken });

// Property APIs
export const getProperties = (params?: { property_id?: string; company_id?: string }) =>
  apiClient.get('/api/com/property-info-service/', params);

export const createProperty = (propertyData: { company_id: number; property_code: string; property_name: string; owner_id: number; is_active: boolean; created_by: number; remarks: string }) =>
  apiClient.post('/api/com/property-info-service/', propertyData);

export const getPropertyMonthlyConfig = (params?: { property_id?: string; year?: string; month?: string }) =>
  apiClient.get('/api/com/property-monthly-config-service/', params);

export const createPropertyMonthlyConfig = (configData: { property_id: number; year: number; month: number; market_adr: number; market_occupancy: number; paf: number; pace_threshold: number; nights_low_threshold: number; nights_high_threshold: number; adr_low_threshold: number; adr_high_threshold: number; early_month_guard_days: number; created_by: number; remarks: string }) =>
  apiClient.post('/api/com/property-monthly-config-service/', configData);

export const createPropertyPerformance = (performanceData: { source_upload_id: number; approved_by: number }) =>
  apiClient.post('/api/com/property-performance-service/', performanceData);
export const createPropertyPerformanceEntry = (performanceData: {
  source_upload_id: number;
  company_id: number;
  property_id: number;
  date: string;
  rooms: number;
  revenue: number;
}) => apiClient.post('/api/com/property-performance-service/', performanceData);
export const getPropertyPerformance = (params?: { property_id?: string; date?: string }) =>
  apiClient.get('/api/com/property-performance-service/', params);

export const getPropertyDiagnosisReport = (params?: { property_id?: string; month?: string }) =>
  apiClient.get('/api/com/property-diagnosis-report-service/', params);

export const getPropertyPerformanceReport = (params?: { property_id?: string; month?: string }) =>
  apiClient.get('/api/com/property-performance-report-service/', params);

// Upload API
export const uploadPerformance = (formData: FormData) =>
  apiClient.postFormData('/api/mgn/performance-uploads-service/', formData);

export const getPerformanceUploads = () =>
  apiClient.get('/api/mgn/performance-uploads-service/', { id: '-1' });

export const getPerformanceUploadDetails = (id: number) =>
  apiClient.get('/api/mgn/performance-uploads-service/', { id: String(id) });