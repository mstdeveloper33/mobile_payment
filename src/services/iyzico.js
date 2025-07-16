const Iyzipay = require('iyzipay');
const { v4: uuidv4 } = require('uuid');

class IyzicoService {
  constructor() {
    this.iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL
    });
  }

  // Ödeme işlemini başlat
  async initiatePayment(orderData, userInfo, paymentCard) {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        price: orderData.totalAmount.toString(),
        paidPrice: orderData.totalAmount.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        installment: '1',
        basketId: orderData.orderId,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.MOBILE,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
          cardHolderName: paymentCard.cardHolderName,
          cardNumber: paymentCard.cardNumber,
          expireMonth: paymentCard.expireMonth.toString().padStart(2, '0'),
          expireYear: paymentCard.expireYear.toString(),
          cvc: paymentCard.cvc,
          registerCard: '0'
        },
        buyer: {
          id: userInfo.id,
          name: userInfo.firstName,
          surname: userInfo.lastName,
          gsmNumber: userInfo.phone,
          email: userInfo.email,
          identityNumber: userInfo.identityNumber || '11111111111',
          lastLoginDate: new Date().toISOString().split('T')[0] + ' 00:00:00',
          registrationDate: userInfo.createdAt || new Date().toISOString().split('T')[0] + ' 00:00:00',
          registrationAddress: orderData.shippingAddress.address,
          ip: userInfo.ip || '127.0.0.1',
          city: orderData.shippingAddress.city,
          country: 'Turkey',
          zipCode: orderData.shippingAddress.zipCode
        },
        shippingAddress: {
          contactName: `${userInfo.firstName} ${userInfo.lastName}`,
          city: orderData.shippingAddress.city,
          country: 'Turkey',
          address: orderData.shippingAddress.address,
          zipCode: orderData.shippingAddress.zipCode
        },
        billingAddress: {
          contactName: `${userInfo.firstName} ${userInfo.lastName}`,
          city: orderData.shippingAddress.city,
          country: 'Turkey',
          address: orderData.shippingAddress.address,
          zipCode: orderData.shippingAddress.zipCode
        },
        basketItems: orderData.items.map((item, index) => ({
          id: item.productId,
          name: item.productName,
          category1: item.category || 'General',
          category2: 'Mobile App',
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: (item.price * item.quantity).toString(),
          subMerchantKey: null,
          subMerchantPrice: null
        }))
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.payment.create(request, (err, result) => {
          if (err) {
            reject(new Error(`Iyzico API Error: ${err.message}`));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  // 3D Secure ödeme başlat
  async initiate3DPayment(orderData, userInfo, paymentCard, callbackUrl) {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        price: orderData.totalAmount.toString(),
        paidPrice: orderData.totalAmount.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        basketId: orderData.orderId,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: callbackUrl,
        paymentCard: {
          cardHolderName: paymentCard.cardHolderName,
          cardNumber: paymentCard.cardNumber,
          expireMonth: paymentCard.expireMonth.toString().padStart(2, '0'),
          expireYear: paymentCard.expireYear.toString(),
          cvc: paymentCard.cvc,
          registerCard: '0'
        },
        buyer: {
          id: userInfo.id,
          name: userInfo.firstName,
          surname: userInfo.lastName,
          gsmNumber: userInfo.phone,
          email: userInfo.email,
          identityNumber: userInfo.identityNumber || '11111111111',
          lastLoginDate: new Date().toISOString().split('T')[0] + ' 00:00:00',
          registrationDate: userInfo.createdAt || new Date().toISOString().split('T')[0] + ' 00:00:00',
          registrationAddress: orderData.shippingAddress.address,
          ip: userInfo.ip || '127.0.0.1',
          city: orderData.shippingAddress.city,
          country: 'Turkey',
          zipCode: orderData.shippingAddress.zipCode
        },
        shippingAddress: {
          contactName: `${userInfo.firstName} ${userInfo.lastName}`,
          city: orderData.shippingAddress.city,
          country: 'Turkey',
          address: orderData.shippingAddress.address,
          zipCode: orderData.shippingAddress.zipCode
        },
        billingAddress: {
          contactName: `${userInfo.firstName} ${userInfo.lastName}`,
          city: orderData.shippingAddress.city,
          country: 'Turkey',
          address: orderData.shippingAddress.address,
          zipCode: orderData.shippingAddress.zipCode
        },
        basketItems: orderData.items.map((item, index) => ({
          id: item.productId,
          name: item.productName,
          category1: item.category || 'General',
          category2: 'Mobile App',
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: (item.price * item.quantity).toString()
        }))
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.threedsInitialize.create(request, (err, result) => {
          if (err) {
            reject(new Error(`3D Secure initialization failed: ${err.message}`));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      throw new Error(`3D Secure payment initiation failed: ${error.message}`);
    }
  }

  // 3D Secure doğrulama sonucu
  async complete3DPayment(paymentId, conversationData) {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationData,
        paymentId: paymentId
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.threedsPayment.create(request, (err, result) => {
          if (err) {
            reject(new Error(`3D Secure completion failed: ${err.message}`));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      throw new Error(`3D Secure payment completion failed: ${error.message}`);
    }
  }

  // Ödeme sorgulama
  async retrievePayment(paymentId) {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        paymentId: paymentId
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.payment.retrieve(request, (err, result) => {
          if (err) {
            reject(new Error(`Payment retrieval failed: ${err.message}`));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      throw new Error(`Payment query failed: ${error.message}`);
    }
  }

  // İade işlemi
  async refundPayment(paymentTransactionId, refundAmount, reason) {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        paymentTransactionId: paymentTransactionId,
        price: refundAmount.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        description: reason || 'Müşteri talebi ile iade'
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.refund.create(request, (err, result) => {
          if (err) {
            reject(new Error(`Refund failed: ${err.message}`));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  // İptal işlemi
  async cancelPayment(paymentId, reason) {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        paymentId: paymentId,
        description: reason || 'Müşteri talebi ile iptal'
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.cancel.create(request, (err, result) => {
          if (err) {
            reject(new Error(`Cancellation failed: ${err.message}`));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      throw new Error(`Payment cancellation failed: ${error.message}`);
    }
  }

  // Taksit seçeneklerini getir
  async getInstallmentInfo(binNumber, price) {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        binNumber: binNumber,
        price: price.toString()
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.installmentInfo.retrieve(request, (err, result) => {
          if (err) {
            reject(new Error(`Installment info retrieval failed: ${err.message}`));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      throw new Error(`Installment info query failed: ${error.message}`);
    }
  }
}

module.exports = new IyzicoService(); 