import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  BackHandler
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const PaymentWebViewScreen = ({ route, navigation }) => {
  const { htmlContent, paymentId, orderId } = route.params;
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // Hardware back button için
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        
        Alert.alert(
          'Ödeme İşlemi',
          'Ödeme işlemini iptal etmek istediğinizden emin misiniz?',
          [
            { text: 'Hayır', style: 'cancel' },
            { 
              text: 'Evet', 
              onPress: () => navigation.goBack(),
              style: 'destructive'
            },
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [canGoBack, navigation])
  );

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'PAYMENT_SUCCESS') {
        navigation.replace('PaymentResult', {
          success: true,
          paymentId: data.paymentId,
          orderId: orderId
        });
      } else if (data.type === 'PAYMENT_FAILED') {
        navigation.replace('PaymentResult', {
          success: false,
          error: data.error,
          paymentId: paymentId,
          orderId: orderId
        });
      }
    } catch (error) {
      console.warn('WebView message parsing error:', error);
    }
  };

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    
    // URL'yi kontrol et - success/failure sayfalarını yakala
    const { url } = navState;
    
    if (url.includes('/payments/success') || url.includes('/success')) {
      navigation.replace('PaymentResult', {
        success: true,
        paymentId: paymentId,
        orderId: orderId
      });
    } else if (url.includes('/payments/failure') || url.includes('/failure')) {
      navigation.replace('PaymentResult', {
        success: false,
        paymentId: paymentId,
        orderId: orderId
      });
    }
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error:', nativeEvent);
    
    Alert.alert(
      'Bağlantı Hatası',
      'Ödeme sayfası yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
      [
        { text: 'Geri Dön', onPress: () => navigation.goBack() }
      ]
    );
  };

  const injectedJavaScript = `
    // Ödeme sonucunu yakalamak için JavaScript
    window.addEventListener('message', function(event) {
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    // Form submit'lerini izle
    document.addEventListener('DOMContentLoaded', function() {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        form.addEventListener('submit', function() {
          // Loading indicator göster
          const loadingDiv = document.createElement('div');
          loadingDiv.style.position = 'fixed';
          loadingDiv.style.top = '50%';
          loadingDiv.style.left = '50%';
          loadingDiv.style.transform = 'translate(-50%, -50%)';
          loadingDiv.style.zIndex = '9999';
          loadingDiv.style.background = 'rgba(0,0,0,0.8)';
          loadingDiv.style.color = 'white';
          loadingDiv.style.padding = '20px';
          loadingDiv.style.borderRadius = '10px';
          loadingDiv.innerHTML = 'Ödeme işleniyor...';
          document.body.appendChild(loadingDiv);
        });
      });
    });

    true; // Bu satır zorunlu
  `;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => {
            Alert.alert(
              'Ödeme İşlemi',
              'Ödeme işlemini iptal etmek istediğinizden emin misiniz?',
              [
                { text: 'Hayır', style: 'cancel' },
                { 
                  text: 'Evet', 
                  onPress: () => navigation.goBack(),
                  style: 'destructive'
                },
              ]
            );
          }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Güvenli Ödeme</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Ödeme sayfası yükleniyor...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mixedContentMode="compatibility"
        userAgent="Mozilla/5.0 (Mobile; rv:40.0) Gecko/40.0 Firefox/40.0"
      />

      {/* SSL Güvenlik Göstergesi */}
      <View style={styles.securityBanner}>
        <Text style={styles.securityText}>🔒 SSL ile korumalı ödeme</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  webView: {
    flex: 1,
  },
  securityBanner: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    alignItems: 'center',
  },
  securityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PaymentWebViewScreen; 