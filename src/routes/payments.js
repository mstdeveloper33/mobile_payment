const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { validatePayment, validateUUID } = require('../middleware/validation');
const iyzicoService = require('../services/iyzico');

const router = express.Router();

// In-memory storage (production'da gerçek veritabanı kullanılacak)
const payments = new Map();
const orders = new Map(); // Normalde orders route'undan import edilecek

// Ödeme durumları
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Taksit seçeneklerini getir
router.post('/installments', authenticateToken, async (req, res, next) => {
  try {
    const { binNumber, price } = req.body;

    if (!binNumber || !price) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Kart numarası (ilk 6 hane) ve tutar gerekli'
      });
    }

    if (binNumber.length !== 6) {
      return res.status(400).json({
        error: 'Invalid bin number',
        message: 'Kart numarası ilk 6 hanesi gerekli'
      });
    }

    const installmentInfo = await iyzicoService.getInstallmentInfo(binNumber, price);

    if (installmentInfo.status === 'success') {
      res.json({
        message: 'Taksit seçenekleri başarıyla getirildi',
        installments: installmentInfo.installmentDetails
      });
    } else {
      res.status(400).json({
        error: 'Installment query failed',
        message: installmentInfo.errorMessage || 'Taksit bilgileri alınamadı'
      });
    }

  } catch (error) {
    next(error);
  }
});

// Ödeme başlat (Direkt ödeme)
router.post('/pay', authenticateToken, validatePayment, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId, paymentCard, paymentType = 'direct' } = req.body;

    // Siparişi kontrol et
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

    if (order.paymentStatus === 'success') {
      return res.status(400).json({
        error: 'Already paid',
        message: 'Bu sipariş zaten ödenmiş'
      });
    }

    // Kullanıcı bilgilerini al (normalde veritabanından)
    const userInfo = {
      id: userId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: '+905551234567', // Demo
      ip: req.ip || '127.0.0.1'
    };

    // Ödeme kaydı oluştur
    const paymentId = uuidv4();
    const payment = {
      id: paymentId,
      orderId,
      userId,
      amount: order.totalAmount,
      currency: 'TRY',
      paymentType,
      status: PAYMENT_STATUS.PROCESSING,
      paymentMethod: 'credit_card',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    payments.set(paymentId, payment);

    try {
      let paymentResult;

      if (paymentType === '3d') {
        // 3D Secure ödeme
        const callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/3d-callback`;
        paymentResult = await iyzicoService.initiate3DPayment(order, userInfo, paymentCard, callbackUrl);
        
        if (paymentResult.status === 'success') {
          // 3D Secure için kullanıcıyı yönlendirme sayfasına gönder
          payment.iyzicoPaymentId = paymentResult.paymentId;
          payment.threeDSFormData = paymentResult.threeDSHtmlContent;
          payments.set(paymentId, payment);

          res.json({
            message: '3D Secure ödeme başlatıldı',
            paymentId,
            redirectUrl: paymentResult.threeDSHtmlContent,
            paymentStatus: 'processing'
          });
        } else {
          throw new Error(paymentResult.errorMessage || '3D Secure ödeme başlatılamadı');
        }
      } else {
        // Direkt ödeme
        paymentResult = await iyzicoService.initiatePayment(order, userInfo, paymentCard);
        
        if (paymentResult.status === 'success') {
          // Ödeme başarılı
          payment.status = PAYMENT_STATUS.SUCCESS;
          payment.iyzicoPaymentId = paymentResult.paymentId;
          payment.transactionId = paymentResult.paymentTransactionId;
          payment.completedAt = new Date().toISOString();
          payments.set(paymentId, payment);

          // Siparişi güncelle
          order.paymentStatus = 'success';
          order.status = 'confirmed';
          orders.set(orderId, order);

          res.json({
            message: 'Ödeme başarıyla tamamlandı',
            paymentId,
            transactionId: paymentResult.paymentTransactionId,
            paymentStatus: 'success'
          });
        } else {
          throw new Error(paymentResult.errorMessage || 'Ödeme işlemi başarısız');
        }
      }

    } catch (paymentError) {
      // Ödeme başarısız
      payment.status = PAYMENT_STATUS.FAILED;
      payment.errorMessage = paymentError.message;
      payment.updatedAt = new Date().toISOString();
      payments.set(paymentId, payment);

      res.status(400).json({
        error: 'Payment failed',
        message: paymentError.message,
        paymentId
      });
    }

  } catch (error) {
    next(error);
  }
});

// 3D Secure callback handler
router.post('/3d-callback', async (req, res, next) => {
  try {
    const { paymentId, conversationData } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        error: 'Missing payment ID',
        message: 'Ödeme ID\'si gerekli'
      });
    }

    // Ödeme kaydını bul
    const payment = Array.from(payments.values()).find(p => p.iyzicoPaymentId === paymentId);
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Ödeme kaydı bulunamadı'
      });
    }

    try {
      // 3D Secure doğrulamasını tamamla
      const result = await iyzicoService.complete3DPayment(paymentId, conversationData);

      if (result.status === 'success') {
        // Ödeme başarılı
        payment.status = PAYMENT_STATUS.SUCCESS;
        payment.transactionId = result.paymentTransactionId;
        payment.completedAt = new Date().toISOString();
        payments.set(payment.id, payment);

        // Siparişi güncelle
        const order = orders.get(payment.orderId);
        if (order) {
          order.paymentStatus = 'success';
          order.status = 'confirmed';
          orders.set(payment.orderId, order);
        }

        res.json({
          message: '3D Secure ödeme başarıyla tamamlandı',
          paymentId: payment.id,
          transactionId: result.paymentTransactionId,
          paymentStatus: 'success'
        });
      } else {
        // 3D Secure doğrulama başarısız
        payment.status = PAYMENT_STATUS.FAILED;
        payment.errorMessage = result.errorMessage;
        payment.updatedAt = new Date().toISOString();
        payments.set(payment.id, payment);

        res.status(400).json({
          error: '3D Secure verification failed',
          message: result.errorMessage || '3D Secure doğrulama başarısız',
          paymentId: payment.id
        });
      }

    } catch (error) {
      payment.status = PAYMENT_STATUS.FAILED;
      payment.errorMessage = error.message;
      payment.updatedAt = new Date().toISOString();
      payments.set(payment.id, payment);

      res.status(500).json({
        error: '3D Secure completion failed',
        message: error.message,
        paymentId: payment.id
      });
    }

  } catch (error) {
    next(error);
  }
});

// Ödeme durumunu sorgula
router.get('/:paymentId/status', authenticateToken, validateUUID('paymentId'), async (req, res, next) => {
  try {
    const paymentId = req.params.paymentId;
    const userId = req.user.userId;

    const payment = payments.get(paymentId);
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Ödeme kaydı bulunamadı'
      });
    }

    if (payment.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bu ödemeye erişim yetkiniz yok'
      });
    }

    // Iyzico'dan güncel durumu sorgula
    if (payment.iyzicoPaymentId && payment.status === PAYMENT_STATUS.PROCESSING) {
      try {
        const result = await iyzicoService.retrievePayment(payment.iyzicoPaymentId);
        
        if (result.status === 'success') {
          // Durumu güncelle
          payment.status = result.paymentStatus === 'SUCCESS' ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED;
          payment.updatedAt = new Date().toISOString();
          
          if (payment.status === PAYMENT_STATUS.SUCCESS) {
            payment.completedAt = new Date().toISOString();
          }
          
          payments.set(paymentId, payment);
        }
      } catch (error) {
        console.error('Payment status query error:', error);
      }
    }

    res.json({
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        errorMessage: payment.errorMessage
      }
    });

  } catch (error) {
    next(error);
  }
});

// Ödeme iade et
router.post('/:paymentId/refund', authenticateToken, validateUUID('paymentId'), async (req, res, next) => {
  try {
    const paymentId = req.params.paymentId;
    const userId = req.user.userId;
    const { amount, reason } = req.body;

    const payment = payments.get(paymentId);
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Ödeme kaydı bulunamadı'
      });
    }

    if (payment.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bu ödemeye erişim yetkiniz yok'
      });
    }

    if (payment.status !== PAYMENT_STATUS.SUCCESS) {
      return res.status(400).json({
        error: 'Cannot refund',
        message: 'Sadece başarılı ödemeler iade edilebilir'
      });
    }

    if (!payment.transactionId) {
      return res.status(400).json({
        error: 'No transaction ID',
        message: 'İade için gerekli işlem ID\'si bulunamadı'
      });
    }

    const refundAmount = amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      return res.status(400).json({
        error: 'Invalid refund amount',
        message: 'İade tutarı ödeme tutarından fazla olamaz'
      });
    }

    try {
      const refundResult = await iyzicoService.refundPayment(
        payment.transactionId,
        refundAmount,
        reason
      );

      if (refundResult.status === 'success') {
        // İade kaydı oluştur
        const refundId = uuidv4();
        const refund = {
          id: refundId,
          paymentId,
          orderId: payment.orderId,
          amount: refundAmount,
          reason: reason || 'Müşteri talebi',
          iyzicoRefundId: refundResult.paymentTransactionId,
          status: 'success',
          createdAt: new Date().toISOString()
        };

        // Tam iade ise ödeme durumunu güncelle
        if (refundAmount === payment.amount) {
          payment.status = PAYMENT_STATUS.REFUNDED;
          payment.refundedAt = new Date().toISOString();
          payments.set(paymentId, payment);
        }

        res.json({
          message: 'İade işlemi başarıyla tamamlandı',
          refund,
          refundTransactionId: refundResult.paymentTransactionId
        });
      } else {
        res.status(400).json({
          error: 'Refund failed',
          message: refundResult.errorMessage || 'İade işlemi başarısız'
        });
      }

    } catch (error) {
      res.status(500).json({
        error: 'Refund processing failed',
        message: error.message
      });
    }

  } catch (error) {
    next(error);
  }
});

// Ödemeyi iptal et
router.post('/:paymentId/cancel', authenticateToken, validateUUID('paymentId'), async (req, res, next) => {
  try {
    const paymentId = req.params.paymentId;
    const userId = req.user.userId;
    const { reason } = req.body;

    const payment = payments.get(paymentId);
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Ödeme kaydı bulunamadı'
      });
    }

    if (payment.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bu ödemeye erişim yetkiniz yok'
      });
    }

    // Sadece beklemede olan ödemeler iptal edilebilir
    if (payment.status !== PAYMENT_STATUS.PENDING && payment.status !== PAYMENT_STATUS.PROCESSING) {
      return res.status(400).json({
        error: 'Cannot cancel',
        message: 'Sadece beklemede olan ödemeler iptal edilebilir'
      });
    }

    try {
      if (payment.iyzicoPaymentId) {
        // Iyzico'da ödemeyi iptal et
        const cancelResult = await iyzicoService.cancelPayment(payment.iyzicoPaymentId, reason);
        
        if (cancelResult.status !== 'success') {
          return res.status(400).json({
            error: 'Cancel failed',
            message: cancelResult.errorMessage || 'İptal işlemi başarısız'
          });
        }
      }

      // Ödeme durumunu güncelle
      payment.status = PAYMENT_STATUS.CANCELLED;
      payment.cancelledAt = new Date().toISOString();
      payment.cancelReason = reason || 'Müşteri talebi';
      payments.set(paymentId, payment);

      res.json({
        message: 'Ödeme başarıyla iptal edildi',
        paymentId
      });

    } catch (error) {
      res.status(500).json({
        error: 'Cancel processing failed',
        message: error.message
      });
    }

  } catch (error) {
    next(error);
  }
});

// Kullanıcının ödeme geçmişi
router.get('/history', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let userPayments = Array.from(payments.values()).filter(payment => payment.userId === userId);

    // Durum filtrelemesi
    if (status) {
      userPayments = userPayments.filter(payment => payment.status === status);
    }

    // Tarihe göre sırala (en yeni önce)
    userPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Sayfalama
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = userPayments.slice(startIndex, endIndex);

    const totalPayments = userPayments.length;
    const totalPages = Math.ceil(totalPayments / limit);

    res.json({
      payments: paginatedPayments.map(payment => ({
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalPayments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    next(error);
  }
});

// Ödeme başarı sayfası (webhook/callback için)
router.get('/success', (req, res) => {
  res.json({
    message: 'Ödeme başarıyla tamamlandı',
    status: 'success'
  });
});

// Ödeme başarısızlık sayfası (webhook/callback için)
router.get('/failure', (req, res) => {
  res.json({
    message: 'Ödeme işlemi başarısız',
    status: 'failed'
  });
});

module.exports = router; 