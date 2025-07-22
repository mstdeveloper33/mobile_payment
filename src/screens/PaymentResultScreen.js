import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../context/CartContext';

const PaymentResultScreen = ({ route, navigation }) => {
  const { success, paymentId, orderId, error } = route.params;
  const { clearCart } = useCart();

  // Başarılı ödeme sonrası sepeti temizle
  useEffect(() => {
    if (success) {
      clearCart();
    }
  }, [success, clearCart]);

  // Hardware back button'u devre dışı bırak
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Bu ekrandan geri gidilmesini engelle
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleContinue = () => {
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }]
      });
    } else {
      navigation.goBack(); // Ödeme sayfasına geri dön
    }
  };

  const handleViewOrder = () => {
    if (orderId) {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { 
            name: 'OrderDetail', 
            params: { orderId } 
          }
        ]
      });
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Müşteri Desteği',
      'Destek için bizimle iletişime geçin:\n\nE-posta: destek@example.com\nTelefon: 0850 123 45 67',
      [
        { text: 'Tamam', style: 'default' }
      ]
    );
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>

          {/* Success Message */}
          <Text style={styles.title}>Ödeme Başarılı!</Text>
          <Text style={styles.subtitle}>
            Ödemeniz başarıyla tamamlandı. Siparişiniz işleme alındı ve kısa sürede kargo ile tarafınıza iletilecektir.
          </Text>

          {/* Payment Details */}
          <View style={styles.detailsContainer}>
            {paymentId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ödeme ID:</Text>
                <Text style={styles.detailValue}>{paymentId}</Text>
              </View>
            )}
            {orderId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sipariş ID:</Text>
                <Text style={styles.detailValue}>{orderId}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durum:</Text>
              <Text style={[styles.detailValue, styles.successText]}>Tamamlandı</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {orderId && (
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleViewOrder}
              >
                <Text style={styles.secondaryButtonText}>Siparişi Görüntüle</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Alışverişe Devam Et</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              📧 Sipariş onay e-postanız gönderilmiştir.
            </Text>
            <Text style={styles.infoText}>
              📦 Kargo takip bilgileriniz SMS ile iletilecektir.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.errorIcon}>❌</Text>
          </View>

          {/* Error Message */}
          <Text style={styles.title}>Ödeme Başarısız</Text>
          <Text style={styles.subtitle}>
            Üzgünüz, ödeme işleminiz tamamlanamadı. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.
          </Text>

          {/* Error Details */}
          <View style={styles.detailsContainer}>
            {paymentId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ödeme ID:</Text>
                <Text style={styles.detailValue}>{paymentId}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durum:</Text>
              <Text style={[styles.detailValue, styles.errorText]}>Başarısız</Text>
            </View>
            {error && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hata:</Text>
                <Text style={[styles.detailValue, styles.errorText]}>{error}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleContactSupport}
            >
              <Text style={styles.secondaryButtonText}>Destek Al</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>

          {/* Help Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 Kart bilgilerinizi kontrol edin
            </Text>
            <Text style={styles.infoText}>
              💳 Kart limitinizi kontrol edin
            </Text>
            <Text style={styles.infoText}>
              📞 Sorun devam ederse müşteri hizmetleri ile iletişime geçin
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 80,
  },
  errorIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default PaymentResultScreen; 