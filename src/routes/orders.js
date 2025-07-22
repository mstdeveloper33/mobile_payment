const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { validateOrder, validatePagination, validateUUID } = require('../middleware/validation');

const router = express.Router();

// In-memory storage (production'da gerçek veritabanı kullanılacak)
const orders = new Map();
const products = require('./products'); // Ürün bilgilerine erişim için

// Sipariş durumları
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Kullanıcının siparişlerini listele
router.get('/', authenticateToken, validatePagination, (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let userOrders = Array.from(orders.values()).filter(order => order.userId === userId);

    // Durum filtrelemesi
    if (status) {
      userOrders = userOrders.filter(order => order.status === status);
    }

    // Tarihe göre sırala (en yeni önce)
    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Sayfalama
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = userOrders.slice(startIndex, endIndex);

    const totalOrders = userOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders: paginatedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    next(error);
  }
});

// Sipariş detayını getir
router.get('/:orderId', authenticateToken, validateUUID('orderId'), (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.userId;
    
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Sipariş bulunamadı'
      });
    }

    // Kullanıcının kendi siparişini görebilir
    if (order.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bu siparişe erişim yetkiniz yok'
      });
    }

    res.json({
      order
    });

  } catch (error) {
    next(error);
  }
});

// Yeni sipariş oluştur
router.post('/', authenticateToken, validateOrder, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { items, shippingAddress, notes } = req.body;

    // Ürün bilgilerini ve fiyatlarını doğrula
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      // Burada gerçek ürün bilgilerini kontrol etmek gerekiyor
      // Demo için basit validasyon yapıyorum
      const product = {
        id: item.productId,
        name: `Ürün ${item.productId.slice(0, 8)}`,
        price: Math.random() * 1000 + 100, // Demo fiyat
        category: 'General'
      };
      
      if (item.quantity <= 0) {
        return res.status(400).json({
          error: 'Invalid quantity',
          message: 'Ürün adedi 0 veya negatif olamaz'
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
        category: product.category
      });
    }

    // Kargo ücreti hesapla (demo)
    const shippingFee = totalAmount > 500 ? 0 : 29.99;
    totalAmount += shippingFee;

    const orderId = uuidv4();
    const newOrder = {
      id: orderId,
      userId,
      items: orderItems,
      subtotal: totalAmount - shippingFee,
      shippingFee,
      totalAmount,
      shippingAddress,
      notes: notes || '',
      status: ORDER_STATUS.PENDING,
      paymentStatus: 'pending',
      trackingNumber: null,
      estimatedDelivery: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: ORDER_STATUS.PENDING,
          timestamp: new Date().toISOString(),
          note: 'Sipariş oluşturuldu'
        }
      ]
    };

    orders.set(orderId, newOrder);

    res.status(201).json({
      message: 'Sipariş başarıyla oluşturuldu',
      order: newOrder
    });

  } catch (error) {
    next(error);
  }
});

// Sipariş durumunu güncelle
router.put('/:orderId/status', authenticateToken, validateUUID('orderId'), (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const { status, note } = req.body;
    
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Sipariş bulunamadı'
      });
    }

    // Geçerli durum kontrolü
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Geçersiz sipariş durumu'
      });
    }

    // Durum geçiş mantığı
    const currentStatus = order.status;
    
    // Basit durum geçiş kontrolü
    const validTransitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
      [ORDER_STATUS.CANCELLED]: [],
      [ORDER_STATUS.REFUNDED]: []
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        message: `${currentStatus} durumundan ${status} durumuna geçiş yapılamaz`
      });
    }

    // Sipariş durumunu güncelle
    const updatedOrder = {
      ...order,
      status,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...order.statusHistory,
        {
          status,
          timestamp: new Date().toISOString(),
          note: note || `Durum ${status} olarak güncellendi`
        }
      ]
    };

    // Kargo takip numarası ve tahmini teslimat tarihi
    if (status === ORDER_STATUS.SHIPPED) {
      updatedOrder.trackingNumber = `TK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 3);
      updatedOrder.estimatedDelivery = estimatedDate.toISOString();
    }

    orders.set(orderId, updatedOrder);

    res.json({
      message: 'Sipariş durumu başarıyla güncellendi',
      order: updatedOrder
    });

  } catch (error) {
    next(error);
  }
});

// Siparişi iptal et
router.put('/:orderId/cancel', authenticateToken, validateUUID('orderId'), (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.userId;
    const { reason } = req.body;
    
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Sipariş bulunamadı'
      });
    }

    // Kullanıcının kendi siparişini iptal edebilir
    if (order.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bu siparişi iptal etme yetkiniz yok'
      });
    }

    // İptal edilebilir durumlar
    const cancellableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        error: 'Cannot cancel order',
        message: 'Bu durumda olan sipariş iptal edilemez'
      });
    }

    const updatedOrder = {
      ...order,
      status: ORDER_STATUS.CANCELLED,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...order.statusHistory,
        {
          status: ORDER_STATUS.CANCELLED,
          timestamp: new Date().toISOString(),
          note: reason || 'Müşteri tarafından iptal edildi'
        }
      ]
    };

    orders.set(orderId, updatedOrder);

    res.json({
      message: 'Sipariş başarıyla iptal edildi',
      order: updatedOrder
    });

  } catch (error) {
    next(error);
  }
});

// Sipariş takip
router.get('/:orderId/tracking', authenticateToken, validateUUID('orderId'), (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.userId;
    
    const order = orders.get(orderId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Sipariş bulunamadı'
      });
    }

    if (order.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bu siparişe erişim yetkiniz yok'
      });
    }

    // Takip bilgileri
    const trackingInfo = {
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      statusHistory: order.statusHistory,
      currentLocation: order.trackingNumber ? 'Transit Hub - İstanbul' : null,
      lastUpdate: order.updatedAt
    };

    res.json({
      tracking: trackingInfo
    });

  } catch (error) {
    next(error);
  }
});

// Sipariş istatistikleri (kullanıcı için)
router.get('/stats/summary', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userOrders = Array.from(orders.values()).filter(order => order.userId === userId);

    const stats = {
      totalOrders: userOrders.length,
      totalSpent: userOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      statusCounts: Object.values(ORDER_STATUS).reduce((acc, status) => {
        acc[status] = userOrders.filter(order => order.status === status).length;
        return acc;
      }, {}),
      recentOrders: userOrders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt
        }))
    };

    res.json({
      stats
    });

  } catch (error) {
    next(error);
  }
});

// Tekrar sipariş ver
router.post('/:orderId/reorder', authenticateToken, validateUUID('orderId'), (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.userId;
    
    const originalOrder = orders.get(orderId);

    if (!originalOrder) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Orijinal sipariş bulunamadı'
      });
    }

    if (originalOrder.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bu siparişe erişim yetkiniz yok'
      });
    }

    // Yeni sipariş oluştur
    const newOrderId = uuidv4();
    const newOrder = {
      id: newOrderId,
      userId,
      items: originalOrder.items,
      subtotal: originalOrder.subtotal,
      shippingFee: originalOrder.shippingFee,
      totalAmount: originalOrder.totalAmount,
      shippingAddress: originalOrder.shippingAddress,
      notes: 'Tekrar sipariş',
      status: ORDER_STATUS.PENDING,
      paymentStatus: 'pending',
      trackingNumber: null,
      estimatedDelivery: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: ORDER_STATUS.PENDING,
          timestamp: new Date().toISOString(),
          note: `Tekrar sipariş (Orijinal: ${orderId})`
        }
      ]
    };

    orders.set(newOrderId, newOrder);

    res.status(201).json({
      message: 'Tekrar sipariş başarıyla oluşturuldu',
      order: newOrder
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 