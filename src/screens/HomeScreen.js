import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import ApiService from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadInitialData();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await ApiService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [productsResponse, popularResponse] = await Promise.all([
        ApiService.getProducts({ limit: 6 }),
        ApiService.getPopularProducts(),
      ]);
      
      setProducts(productsResponse.products || []);
      setPopularProducts(popularResponse.products || []);
    } catch (error) {
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const navigateToProduct = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const navigateToProducts = () => {
    navigation.navigate('Products');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.logout();
              navigation.replace('Login');
            } catch (error) {
              navigation.replace('Login');
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigateToProduct(item)}
    >
      <Card style={styles.productCard} padding="sm">
        <View style={styles.productImageContainer}>
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImageText}>📱</Text>
          </View>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>
            ₺{item.price?.toLocaleString('tr-TR')}
          </Text>
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={styles.originalPrice}>
              ₺{item.originalPrice?.toLocaleString('tr-TR')}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Merhaba,</Text>
                <Text style={styles.userName}>
                  {user?.firstName || 'Kullanıcı'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>Çıkış</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <Card style={styles.statCard} padding="md">
                <Text style={styles.statNumber}>{products.length}</Text>
                <Text style={styles.statLabel}>Ürün</Text>
              </Card>
              <Card style={styles.statCard} padding="md">
                <Text style={styles.statNumber}>
                  {popularProducts.length}
                </Text>
                <Text style={styles.statLabel}>Popüler</Text>
              </Card>
              <Card style={styles.statCard} padding="md">
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Sepet</Text>
              </Card>
            </View>

            {/* Popular Products */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popüler Ürünler</Text>
                <TouchableOpacity onPress={navigateToProducts}>
                  <Text style={styles.seeAllText}>Tümünü Gör</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={popularProducts.slice(0, 4)}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.productRow}
              />
            </View>

            {/* All Products */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tüm Ürünler</Text>
                <TouchableOpacity onPress={navigateToProducts}>
                  <Text style={styles.seeAllText}>Tümünü Gör</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.productRow}
              />
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  
  content: {
    padding: spacing.lg,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
  },
  
  logoutText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  
  section: {
    marginBottom: spacing.xl,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  seeAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  
  productRow: {
    justifyContent: 'space-between',
  },
  
  productItem: {
    flex: 1,
    maxWidth: '48%',
    marginBottom: spacing.md,
  },
  
  productCard: {
    height: 200,
  },
  
  productImageContainer: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  
  productImagePlaceholder: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  productImageText: {
    fontSize: 32,
  },
  
  productInfo: {
    paddingTop: spacing.sm,
  },
  
  productName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  productPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  
  originalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
});

export default HomeScreen; 