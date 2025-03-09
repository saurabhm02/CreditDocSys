// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// API Service
const api = {
  // Base URL
  baseUrl: API_BASE_URL,
  
  // Headers with authentication
  getHeaders: function() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },
  
  // GET request
  get: async function(endpoint) {
    try {
      const response = await fetch(this.baseUrl + endpoint, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  },
  
  // POST request
  post: async function(endpoint, data) {
    try {
      const response = await fetch(this.baseUrl + endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  },
  
  // PUT request
  put: async function(endpoint, data) {
    try {
      const response = await fetch(this.baseUrl + endpoint, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error);
      throw error;
    }
  },
  
  // DELETE request
  delete: async function(endpoint) {
    try {
      const response = await fetch(this.baseUrl + endpoint, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  },
  
  // Upload file
  uploadFile: async function(endpoint, formData) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : ''
        // Note: Don't set Content-Type here, it will be set automatically with the boundary
      };
      
      const response = await fetch(this.baseUrl + endpoint, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error uploading to ${endpoint}:`, error);
      throw error;
    }
  },
  
  // Authentication
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  getProfile: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  // Documents
  scanDocument: async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/documents/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData, // FormData for file upload
      });
      
      return await response.json();
    } catch (error) {
      console.error('Document scan error:', error);
      throw error;
    }
  },
  
  getDocuments: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  },
  
  getDocumentById: async (documentId, fullContent = false) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const url = `${API_BASE_URL}/documents/${documentId}${fullContent ? '?fullContent=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  },
  
  getDocumentMatches: async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/documents/matches/${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get document matches error:', error);
      throw error;
    }
  },
  
  getDocumentHistory: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/documents/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get document history error:', error);
      throw error;
    }
  },
  
  // Credits
  requestCredits: async (requestData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/credits/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Request credits error:', error);
      throw error;
    }
  },
  
  getCreditRequests: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/credits/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get credit requests error:', error);
      throw error;
    }
  },
  
  // Admin
  getAllUsers: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  },
  
  getAllCreditRequests: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/credits/admin/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get all credit requests error:', error);
      throw error;
    }
  },
  
  updateCreditRequest: async (requestId, updateData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/credits/admin/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Update credit request error:', error);
      throw error;
    }
  },
  
  getDocumentStats: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get document stats error:', error);
      throw error;
    }
  },
  
  getCreditStats: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/analytics/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get credit stats error:', error);
      throw error;
    }
  },
  
  // Configuration
  getAIConfig: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/config/ai-matching`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get AI config error:', error);
      throw error;
    }
  },
  
  updateAIConfig: async (configData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/config/ai-matching`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Update AI config error:', error);
      throw error;
    }
  }
};
