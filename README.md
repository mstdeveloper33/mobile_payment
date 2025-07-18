# Mobile Payment Server

React Native ve Flutter uygulamaları için Iyzico ödeme sistemi entegrasyonu içeren Node.js backend servisi.

## 🚀 Özellikler

- **Iyzico Ödeme Entegrasyonu**: Tam Iyzico API entegrasyonu
- **Mobil Uygulama Desteği**: React Native ve Flutter için optimize edilmiş
- **JWT Authentication**: Güvenli kullanıcı kimlik doğrulama
- **3D Secure Ödeme**: Güvenli kart ödemeleri
- **Taksit Seçenekleri**: Dinamik taksit hesaplama
- **Sipariş Yönetimi**: Kapsamlı sipariş takip sistemi
- **Ödeme Geçmişi**: Detaylı ödeme kayıtları
- **İade/İptal**: Tam iade ve iptal sistemi
- **RESTful API**: Standart REST API yapısı
- **CORS Desteği**: Mobil uygulamalar için CORS yapılandırması

## 📋 Gereksinimler

- Node.js 18.0.0 veya üzeri
- Iyzico API hesabı
- NPM veya Yarn

## 🛠 Kurulum

### 1. Projeyi klonlayın
```bash
git clone <repository-url>
cd mobile_payment_server
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Ortam değişkenlerini ayarlayın
`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli bilgileri doldurun:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h

# Iyzico Configuration
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# Payment Configuration
PAYMENT_SUCCESS_URL=http://localhost:3000/api/payments/success
PAYMENT_FAILURE_URL=http://localhost:3000/api/payments/failure
```

### 4. Serveri başlatın

Development modunda:
```bash
npm run dev
```

Production modunda:
```bash
npm start
```

Server başarıyla başlatıldığında şu mesajları göreceksiniz:
```
🚀 Mobile Payment Server started on port 3000
📱 Ready to serve React Native and Flutter apps
💳 Iyzico payment integration enabled
🔗 Health check: http://localhost:3000/health
```

## 📚 API Dökümantasyonu

### Base URL
```
http://localhost:3000/api
```

### Authentication
Çoğu endpoint JWT token gerektirir. Token'ı `Authorization` header'ında `Bearer` format ile gönderin:
```
Authorization: Bearer <your_jwt_token>
```

## 🔐 Auth Endpoints

### Kullanıcı Kaydı
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456",
  "firstName": "Test",
  "lastName": "User",
  "phone": "+905551234567"
}
```

### Kullanıcı Girişi
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
```

### Profil Bilgisi
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

## 🛍 Product Endpoints

### Ürünleri Listele
```http
GET /api/products?page=1&limit=10&category=Telefon&search=iPhone
```

### Ürün Detayı
```http
GET /api/products/{productId}
```

### Kategoriler
```http
GET /api/products/categories
```

### Popüler Ürünler
```http
GET /api/products/popular
```

## 📦 Order Endpoints

### Sipariş Oluştur
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "address": "Örnek Mahalle, Örnek Sokak No:1",
    "city": "İstanbul",
    "zipCode": "34000"
  }
}
```

### Siparişleri Listele
```http
GET /api/orders?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

### Sipariş Detayı
```http
GET /api/orders/{orderId}
Authorization: Bearer <token>
```

### Sipariş İptal
```http
PUT /api/orders/{orderId}/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Fikrim değişti"
}
```

## 💳 Payment Endpoints

### Taksit Seçenekleri
```http
POST /api/payments/installments
Authorization: Bearer <token>
Content-Type: application/json

{
  "binNumber": "454671",
  "price": 1000
}
```

### Ödeme Yap
```http
POST /api/payments/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "uuid",
  "paymentType": "direct", // veya "3d"
  "paymentCard": {
    "cardHolderName": "Test User",
    "cardNumber": "5528790000000008",
    "expireMonth": "12",
    "expireYear": "2025",
    "cvc": "123"
  }
}
```

### Ödeme Durumu
```http
GET /api/payments/{paymentId}/status
Authorization: Bearer <token>
```

### Ödeme Geçmişi
```http
GET /api/payments/history?page=1&limit=10&status=success
Authorization: Bearer <token>
```

### İade İşlemi
```http
POST /api/payments/{paymentId}/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.50,
  "reason": "Ürün hasarlı geldi"
}
```

## 📱 React Native Entegrasyonu

### API Client Kurulumu
```javascript
// api/client.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  async request(endpoint, options = {}) {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Auth methods
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Product methods
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  }

  async getProduct(productId) {
    return this.request(`/products/${productId}`);
  }

  // Order methods
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  // Payment methods
  async makePayment(paymentData) {
    return this.request('/payments/pay', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getPaymentHistory() {
    return this.request('/payments/history');
  }
}

export default new ApiClient();
```

### Kullanım Örneği
```javascript
// screens/PaymentScreen.js
import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import ApiClient from '../api/client';

export default function PaymentScreen({ route }) {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(false);

  const handlePayment = async (cardData) => {
    setLoading(true);
    
    try {
      const result = await ApiClient.makePayment({
        orderId,
        paymentType: 'direct',
        paymentCard: cardData
      });

      if (result.paymentStatus === 'success') {
        Alert.alert('Başarılı', 'Ödeme başarıyla tamamlandı');
        // Navigate to success page
      }
    } catch (error) {
      Alert.alert('Hata', 'Ödeme işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Payment form components */}
    </View>
  );
}
```

## 🎯 Flutter Entegrasyonu

### HTTP Client
```dart
// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';
  
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }

  Future<Map<String, dynamic>> _request(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
  }) async {
    final token = await _getToken();
    
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    http.Response response;
    
    switch (method) {
      case 'POST':
        response = await http.post(
          Uri.parse('$baseUrl$endpoint'),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'PUT':
        response = await http.put(
          Uri.parse('$baseUrl$endpoint'),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      default:
        response = await http.get(
          Uri.parse('$baseUrl$endpoint'),
          headers: headers,
        );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw Exception('HTTP Error: ${response.statusCode}');
    }
  }

  // Auth methods
  Future<Map<String, dynamic>> login(String email, String password) {
    return _request('/auth/login', method: 'POST', body: {
      'email': email,
      'password': password,
    });
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) {
    return _request('/auth/register', method: 'POST', body: userData);
  }

  // Product methods
  Future<Map<String, dynamic>> getProducts({Map<String, String>? params}) {
    String queryString = '';
    if (params != null && params.isNotEmpty) {
      queryString = '?' + params.entries.map((e) => '${e.key}=${e.value}').join('&');
    }
    return _request('/products$queryString');
  }

  // Payment methods
  Future<Map<String, dynamic>> makePayment(Map<String, dynamic> paymentData) {
    return _request('/payments/pay', method: 'POST', body: paymentData);
  }

  Future<Map<String, dynamic>> getPaymentHistory() {
    return _request('/payments/history');
  }
}
```

### Kullanım Örneği
```dart
// lib/screens/payment_screen.dart
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PaymentScreen extends StatefulWidget {
  final String orderId;
  
  const PaymentScreen({Key? key, required this.orderId}) : super(key: key);

  @override
  _PaymentScreenState createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;

  Future<void> _makePayment(Map<String, dynamic> cardData) async {
    setState(() => _isLoading = true);

    try {
      final result = await _apiService.makePayment({
        'orderId': widget.orderId,
        'paymentType': 'direct',
        'paymentCard': cardData,
      });

      if (result['paymentStatus'] == 'success') {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ödeme başarıyla tamamlandı')),
        );
        // Navigate to success page
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ödeme işlemi başarısız')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Ödeme')),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : PaymentForm(onPayment: _makePayment),
    );
  }
}
```

## 🧪 Test

### Unit testleri çalıştır
```bash
npm test
```

### API testleri için Postman collection kullanın
Postman collection dosyası `docs/` klasöründe bulunabilir.

## 📝 Notlar

- Bu proje demo amaçlıdır ve production ortamında kullanmadan önce güvenlik incelemesi yapılmalıdır
- In-memory storage kullanılmıştır, production'da gerçek veritabanı (PostgreSQL, MongoDB vb.) kullanın
- Iyzico test API anahtarları kullanın, production anahtarlarını güvenli bir şekilde saklayın
- SSL sertifikası kullanın (HTTPS)
- Rate limiting ve diğer güvenlik önlemlerini artırın

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🆘 Destek

Herhangi bir sorun veya sorunuz varsa issue açabilirsiniz.

---
**Not**: Bu proje eğitim ve demo amaçlıdır. Production ortamında kullanmadan önce güvenlik testleri yapın.