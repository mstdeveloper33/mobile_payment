import AsyncStorage from '@react-native-async-storage/async-storage';

// Android emülatör için localhost yerine 10.0.2.2 kullanıyoruz
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api'  // Android emülatör için
  : 'http://localhost:3000/api';   // Production için

class ApiService {
  async request(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        ...options
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      console.error('Request URL:', `${API_BASE_URL}${endpoint}`);
      console.error('Request Options:', options);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (result.token) {
      await AsyncStorage.setItem('authToken', result.token);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async register(userData) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (result.token) {
      await AsyncStorage.setItem('authToken', result.token);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Product methods
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  }

  async getProduct(productId) {
    return this.request(`/products/${productId}`);
  }

  async getCategories() {
    return this.request('/products/categories');
  }

  async getPopularProducts() {
    return this.request('/products/popular');
  }

  async getDiscountedProducts() {
    return this.request('/products/discounted');
  }

  async searchProducts(query) {
    return this.request(`/products/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  // Order methods
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/orders?${queryString}`);
  }

  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`);
  }

  async cancelOrder(orderId, reason) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  }

  async trackOrder(orderId) {
    return this.request(`/orders/${orderId}/tracking`);
  }

  // Payment methods
  async getInstallments(binNumber, price) {
    return this.request('/payments/installments', {
      method: 'POST',
      body: JSON.stringify({ binNumber, price })
    });
  }

  async makePayment(paymentData) {
    return this.request('/payments/pay', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async processPayment(paymentData) {
    return this.makePayment(paymentData);
  }

  async getPaymentStatus(paymentId) {
    return this.request(`/payments/${paymentId}/status`);
  }

  async getPaymentHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payments/history?${queryString}`);
  }

  async refundPayment(paymentId, amount, reason) {
    return this.request(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason })
    });
  }

  // Utility methods
  async getCurrentUser() {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
}

export default new ApiService(); 