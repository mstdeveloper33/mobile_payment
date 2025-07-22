import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useCart } from '../context/CartContext';
import ApiService from '../services/api';

const ProductsScreen = ({ navigation }) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getProducts({ limit: 50 });
      setProducts(response.products || []);
    } catch (error) {
      Alert.alert('Hata', 'Ürünler yüklenirken bir hata oluştu');
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const navigateToProduct = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const goBack = () => {
    navigation.goBack();
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    Alert.alert(
      'Sepete Eklendi',
      `${product.name} sepetinize eklendi!`,
      [
        { text: 'Alışverişe Devam', style: 'cancel' },
        { 
          text: 'Sepeti Görüntüle', 
          onPress: () => navigation.navigate('Cart')
        }
      ]
    );
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <TouchableOpacity
        onPress={() => navigateToProduct(item)}
      >
        <Card style={styles.productCard} padding="md">
          <View style={styles.productImageContainer}>
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageText}>📱</Text>
            </View>
          </View>
          
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productBrand}>
              {item.brand}
            </Text>
            <Text style={styles.productCategory}>
              {item.category}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                ₺{item.price?.toLocaleString('tr-TR')}
              </Text>
              {item.originalPrice && item.originalPrice > item.price && (
                <Text style={styles.originalPrice}>
                  ₺{item.originalPrice?.toLocaleString('tr-TR')}
                </Text>
              )}
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {item.rating}</Text>
              <Text style={styles.reviewCount}>({item.reviewCount} değerlendirme)</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.addToCartBtn}
        onPress={() => handleAddToCart(item)}
      >
        <Text style={styles.addToCartText}>+ Sepete Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tüm Ürünler</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ürün, marka veya kategori ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.productRow}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Arama kriterinize uygun ürün bulunamadı.' : 'Henüz ürün yok.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backButton: {
    padding: spacing.sm,
  },

  backButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },

  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },

  placeholder: {
    width: 50,
  },

  searchContainer: {
    padding: spacing.lg,
    backgroundColor: colors.backgroundPrimary,
  },

  searchInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },

  productList: {
    padding: spacing.lg,
  },

  productRow: {
    justifyContent: 'space-between',
  },

  productItem: {
    flex: 1,
    maxWidth: '48%',
    marginBottom: spacing.xl,
  },

  productCard: {
    height: 280,
  },

  productImageContainer: {
    height: 120,
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
    flex: 1,
    paddingTop: spacing.sm,
  },

  productName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  productBrand: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  productCategory: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  priceContainer: {
    marginBottom: spacing.xs,
  },

  productPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },

  originalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },

  rating: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  reviewCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginLeft: spacing.xs,
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

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },

  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  addToCartBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },

  addToCartText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

export default ProductsScreen; 