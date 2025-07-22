import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useCart } from '../context/CartContext';

const CartScreen = ({ navigation }) => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
  } = useCart();

  const goBack = () => {
    navigation.goBack();
  };

  const handleIncreaseQuantity = (item) => {
    if (item.quantity < item.product.stock) {
      updateQuantity(item.id, item.quantity + 1);
    } else {
      Alert.alert('Stok Limitı', 'Bu üründen daha fazla stok bulunmuyor.');
    }
  };

  const handleDecreaseQuantity = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      handleRemoveItem(item);
    }
  };

  const handleRemoveItem = (item) => {
    Alert.alert(
      'Ürünü Kaldır',
      `${item.product.name} sepetinizden kaldırılsın mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => removeFromCart(item.id),
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Sepeti Temizle',
      'Sepetinizdeki tüm ürünler kaldırılsın mı?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Sepet Boş', 'Sepetinizde ürün bulunmuyor.');
      return;
    }

    navigation.navigate('Checkout');
  };

  const renderCartItem = ({ item }) => (
    <Card style={styles.cartItem} padding="md">
      <View style={styles.itemContainer}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>📱</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.productBrand}>{item.product.brand}</Text>
          <Text style={styles.productPrice}>
            ₺{item.product.price?.toLocaleString('tr-TR')}
          </Text>
          {item.product.originalPrice && item.product.originalPrice > item.product.price && (
            <Text style={styles.originalPrice}>
              ₺{item.product.originalPrice?.toLocaleString('tr-TR')}
            </Text>
          )}
        </View>

        {/* Quantity Controls */}
        <View style={styles.quantitySection}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={() => handleDecreaseQuantity(item)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={[styles.quantityButton, item.quantity >= item.product.stock && styles.quantityButtonDisabled]}
              onPress={() => handleIncreaseQuantity(item)}
              disabled={item.quantity >= item.product.stock}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.itemTotal}>
            ₺{(item.product.price * item.quantity).toLocaleString('tr-TR')}
          </Text>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item)}
          >
            <Text style={styles.removeButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text style={styles.emptyTitle}>Sepetiniz Boş</Text>
      <Text style={styles.emptyText}>
        Henüz sepetinizde ürün bulunmuyor. Alışverişe başlamak için ürünleri keşfedin!
      </Text>
      <Button
        title="Alışverişe Başla"
        onPress={() => navigation.navigate('Products')}
        style={styles.shopButton}
      />
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sepetim</Text>
          <View style={styles.placeholder} />
        </View>

        {renderEmptyCart()}
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
        <Text style={styles.headerTitle}>
          Sepetim ({getCartItemsCount()} ürün)
        </Text>
        <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Temizle</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Summary */}
      <View style={styles.bottomSection}>
        <Card style={styles.summaryCard} padding="lg">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Toplam ({getCartItemsCount()} ürün):</Text>
            <Text style={styles.summaryTotal}>
              ₺{getCartTotal().toLocaleString('tr-TR')}
            </Text>
          </View>

          <Button
            title="Ödemeye Geç"
            onPress={handleCheckout}
            style={styles.checkoutButton}
          />
        </Card>
      </View>
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

  clearButton: {
    padding: spacing.sm,
  },

  clearButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },

  placeholder: {
    width: 50,
  },

  cartList: {
    padding: spacing.lg,
  },

  cartItem: {
    marginBottom: spacing.md,
  },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  imageContainer: {
    width: 80,
    height: 80,
    marginRight: spacing.md,
  },

  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageText: {
    fontSize: 24,
  },

  productInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },

  productName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  productBrand: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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

  quantitySection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },

  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },

  quantityButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    minWidth: 32,
    alignItems: 'center',
  },

  quantityButtonDisabled: {
    opacity: 0.5,
  },

  quantityButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },

  quantityText: {
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    minWidth: 30,
    textAlign: 'center',
  },

  itemTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  removeButton: {
    padding: spacing.xs,
  },

  removeButtonText: {
    fontSize: 16,
  },

  bottomSection: {
    padding: spacing.lg,
    backgroundColor: colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  summaryCard: {
    backgroundColor: colors.backgroundSecondary,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  summaryLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },

  summaryTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  checkoutButton: {
    backgroundColor: colors.success,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },

  shopButton: {
    paddingHorizontal: spacing.xl,
  },
});

export default CartScreen; 