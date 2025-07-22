import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Kart bilgileri
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: '',
    // Adres bilgileri
    address: '',
    city: 'İstanbul',
    zipCode: '34000'
  });

  const cartTotal = getCartTotal();
  const shippingFee = cartTotal > 500 ? 0 : 29.99;
  const totalAmount = cartTotal + shippingFee;

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    // Kart numarası formatla
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // 16 digit + 3 spaces
    }

    // CVC formatla
    if (field === 'cvc') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 3) return;
    }

    // Ay/Yıl formatla
    if (field === 'expireMonth' || field === 'expireYear') {
      formattedValue = value.replace(/\D/g, '');
      if (field === 'expireMonth' && formattedValue.length > 2) return;
      if (field === 'expireYear' && formattedValue.length > 4) return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const validateForm = () => {
    const { cardHolderName, cardNumber, expireMonth, expireYear, cvc, address } = formData;

    if (!cardHolderName.trim()) {
      Alert.alert('Hata', 'Kart sahibinin adını girin');
      return false;
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber || cleanCardNumber.length !== 16) {
      Alert.alert('Hata', 'Geçerli bir kart numarası girin');
      return false;
    }

    if (!expireMonth || expireMonth < 1 || expireMonth > 12) {
      Alert.alert('Hata', 'Geçerli bir ay girin (01-12)');
      return false;
    }

    const currentYear = new Date().getFullYear();
    if (!expireYear || expireYear < currentYear || expireYear > currentYear + 10) {
      Alert.alert('Hata', 'Geçerli bir yıl girin');
      return false;
    }

    if (!cvc || cvc.length < 3) {
      Alert.alert('Hata', 'Geçerli bir CVC girin');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Hata', 'Teslimat adresini girin');
      return false;
    }

    return true;
  };

  const createOrder = async () => {
    try {
      const orderItems = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode
        },
        notes: 'Mobile app order'
      };

      const response = await apiService.createOrder(orderData);
      return response.order;
    } catch (error) {
      throw new Error(error.message || 'Sipariş oluşturulamadı');
    }
  };

  const processPayment = async (orderId) => {
    try {
      const paymentCard = {
        cardHolderName: formData.cardHolderName,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        expireMonth: formData.expireMonth,
        expireYear: formData.expireYear,
        cvc: formData.cvc
      };

      const paymentData = {
        orderId,
        paymentCard,
        paymentType: 'direct' // Direct ödeme test edelim
      };

      const response = await apiService.processPayment(paymentData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Ödeme işlemi başarısız');
    }
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Siparişi oluştur
      const order = await createOrder();
      
      // 2. Ödemeyi işle
      const paymentResult = await processPayment(order.id);
      
      if (paymentResult.paymentStatus === 'success') {
        // Başarılı ödeme
        navigation.navigate('PaymentResult', {
          success: true,
          paymentId: paymentResult.paymentId,
          orderId: order.id
        });
      } else if (paymentResult.paymentStatus === 'processing' && paymentResult.redirectUrl) {
        // 3D Secure yönlendirmesi
        navigation.navigate('PaymentWebView', {
          htmlContent: paymentResult.redirectUrl,
          paymentId: paymentResult.paymentId,
          orderId: order.id
        });
      } else {
        navigation.navigate('PaymentResult', {
          success: false,
          error: 'Ödeme işlemi başarısız oldu',
          paymentId: paymentResult.paymentId,
          orderId: order.id
        });
      }
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Sipariş Özeti</Text>
      {cartItems.map(item => (
        <View key={item.id} style={styles.summaryItem}>
          <Text style={styles.summaryItemName}>{item.product?.name || item.name}</Text>
          <Text style={styles.summaryItemPrice}>
            {item.quantity}x ₺{(item.product?.price || item.price || 0).toFixed(2)}
          </Text>
        </View>
      ))}
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Ara Toplam:</Text>
        <Text style={styles.summaryValue}>₺{(cartTotal || 0).toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Kargo:</Text>
        <Text style={styles.summaryValue}>
          {shippingFee === 0 ? 'Ücretsiz' : `₺${(shippingFee || 0).toFixed(2)}`}
        </Text>
      </View>
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Toplam:</Text>
        <Text style={styles.totalValue}>₺{(totalAmount || 0).toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderOrderSummary()}

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Kart Bilgileri</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kart Sahibinin Adı</Text>
              <TextInput
                style={styles.input}
                value={formData.cardHolderName}
                onChangeText={(value) => handleInputChange('cardHolderName', value)}
                placeholder="Ad Soyad"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kart Numarası</Text>
              <TextInput
                style={styles.input}
                value={formData.cardNumber}
                onChangeText={(value) => handleInputChange('cardNumber', value)}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex]}>
                <Text style={styles.inputLabel}>Ay</Text>
                <TextInput
                  style={styles.input}
                  value={formData.expireMonth}
                  onChangeText={(value) => handleInputChange('expireMonth', value)}
                  placeholder="12"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.spacer} />
              
              <View style={[styles.inputContainer, styles.flex]}>
                <Text style={styles.inputLabel}>Yıl</Text>
                <TextInput
                  style={styles.input}
                  value={formData.expireYear}
                  onChangeText={(value) => handleInputChange('expireYear', value)}
                  placeholder="2024"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              
              <View style={styles.spacer} />
              
              <View style={[styles.inputContainer, styles.flex]}>
                <Text style={styles.inputLabel}>CVC</Text>
                <TextInput
                  style={styles.input}
                  value={formData.cvc}
                  onChangeText={(value) => handleInputChange('cvc', value)}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, styles.sectionMargin]}>Teslimat Adresi</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Adres</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Tam adresinizi yazın"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex]}>
                <Text style={styles.inputLabel}>Şehir</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  placeholder="İstanbul"
                />
              </View>
              
              <View style={styles.spacer} />
              
              <View style={[styles.inputContainer, styles.flex]}>
                <Text style={styles.inputLabel}>Posta Kodu</Text>
                <TextInput
                  style={styles.input}
                  value={formData.zipCode}
                  onChangeText={(value) => handleInputChange('zipCode', value)}
                  placeholder="34000"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                ₺{(totalAmount || 0).toFixed(2)} Öde
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionMargin: {
    marginTop: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  spacer: {
    width: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  payButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default CheckoutScreen; 