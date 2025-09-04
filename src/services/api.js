import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const errorMessage = error.response?.data?.error?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/password', passwordData),
  logout: () => api.post('/auth/logout')
};

// Content API
export const contentAPI = {
  generate: (contentData) => api.post('/content/generate', contentData),
  generateStream: (contentData) => {
    // For streaming, we need to use EventSource
    const token = localStorage.getItem('token');
    const url = new URL('/content/generate-stream', api.defaults.baseURL);
    
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(contentData)
    });
  },
  getHistory: (params = {}) => api.get('/content/history', { params }),
  getContent: (requestId) => api.get(`/content/${requestId}`),
  updateContent: (requestId, updates) => api.put(`/content/${requestId}`, updates),
  deleteContent: (requestId) => api.delete(`/content/${requestId}`),
  getContentTypes: () => api.get('/content/types')
};

// Repurpose API
export const repurposeAPI = {
  repurposeText: (textData) => api.post('/repurpose/text', textData),
  repurposeVideo: (videoData) => api.post('/repurpose/video', videoData),
  repurposeAudio: (audioData) => api.post('/repurpose/audio', audioData),
  getHistory: (params = {}) => api.get('/repurpose/history', { params })
};

// Payments API
export const paymentsAPI = {
  getPlans: () => api.get('/payments/plans'),
  createCheckoutSession: (planData) => api.post('/payments/create-checkout-session', planData),
  getCheckoutSession: (sessionId) => api.get(`/payments/checkout-session/${sessionId}`),
  getSubscription: () => api.get('/payments/subscription'),
  cancelSubscription: () => api.post('/payments/cancel-subscription'),
  reactivateSubscription: () => api.post('/payments/reactivate-subscription'),
  updatePaymentMethod: () => api.post('/payments/update-payment-method'),
  getBillingHistory: () => api.get('/payments/billing-history')
};

// Usage API
export const usageAPI = {
  getStats: () => api.get('/usage/stats'),
  getHistory: (params = {}) => api.get('/usage/history', { params })
};

// Utility functions
export const handleStreamResponse = async (response, onChunk, onComplete, onError) => {
  if (!response.ok) {
    const errorData = await response.json();
    onError(new Error(errorData.error?.message || 'Stream failed'));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'chunk') {
              onChunk(data.content);
            } else if (data.type === 'complete') {
              onComplete(data);
            } else if (data.type === 'error') {
              onError(new Error(data.message));
            }
          } catch (e) {
            // Ignore malformed JSON
          }
        }
      }
    }
  } catch (error) {
    onError(error);
  } finally {
    reader.releaseLock();
  }
};

// Error handling utility
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  if (error.response?.data?.error?.code === 'USAGE_LIMIT_EXCEEDED') {
    return {
      type: 'usage_limit',
      message: error.response.data.error.message,
      currentUsage: error.response.data.error.currentUsage,
      limit: error.response.data.error.limit,
      subscriptionPlan: error.response.data.error.subscriptionPlan
    };
  }
  
  if (error.response?.data?.error?.code === 'QUOTA_EXCEEDED') {
    return {
      type: 'quota_exceeded',
      message: 'OpenAI API quota exceeded. Please try again later.'
    };
  }
  
  return {
    type: 'general',
    message: error.message || 'An unexpected error occurred'
  };
};

export default api;
