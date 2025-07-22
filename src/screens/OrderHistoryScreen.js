import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Orders load error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#FF9800',
      confirmed: '#2196F3',
      processing: '#9C27B0',
      shipped: '#00BCD4',
      delivered: '#4CAF50',
      cancelled: '#F44336',
      refunded: '#795548'
    };
    return statusColors[status] || '#666';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Beklemede',
      confirmed: 'Onaylandı',
      processing: 'Hazırlanıyor',
      shipped: 'Kargoda',
      delivered: 'Teslim Edildi',
      cancelled: 'İptal Edildi',
      refunded: 'İade Edildi'
    };
    return statusTexts[status] || status;
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
        </Text>
        <Text style={styles.orderAmount}>₺{item.totalAmount.toFixed(2)}</Text>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsText}>
          {item.items.length} ürün • {item.items.reduce((sum, i) => sum + i.quantity, 0)} adet
        </Text>
        {item.items.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.itemName} numberOfLines={1}>
            • {orderItem.productName}
          </Text>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>+{item.items.length - 2} ürün daha</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>Henüz Siparişiniz Yok</Text>
      <Text style={styles.emptyText}>
        İlk siparişinizi vermek için ürünleri keşfetmeye başlayın!
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Siparişleriniz yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={orders.length === 0 ? styles.flex : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
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
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  orderItems: {
    marginTop: 8,
  },
  itemsText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  moreItems: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  shopButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderHistoryScreen; 