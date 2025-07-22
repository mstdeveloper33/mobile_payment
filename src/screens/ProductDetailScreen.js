import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useCart } from '../context/CartContext';

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { addToCart, isProductInCart, getProductQuantityInCart } = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const goBack = () => {
    navigation.goBack();
  };

  const handleAddToCart = () => {
    addToCart(product, selectedQuantity);
    
    Alert.alert(
      'Sepete Eklendi',
      `${product.name} (${selectedQuantity} adet) sepetinize eklendi!`,
      [
        { text: 'Alışverişe Devam', style: 'cancel' },
        { 
          text: 'Sepeti Görüntüle', 
          onPress: () => navigation.navigate('Cart')
        }
      ]
    );
  };

  const handleBuyNow = () => {
    Alert.alert(
      'Satın Al',
      `${product.name} için ödeme sayfası henüz hazır değil.`,
      [{ text: 'Tamam' }]
    );
  };

  const increaseQuantity = () => {
    if (selectedQuantity < product.stock) {
      setSelectedQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity(prev => prev - 1);
    }
  };

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Detayı</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <Card style={styles.imageCard} padding="lg">
          <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageText}>📱</Text>
            </View>
            {discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>%{discountPercentage} İndirim</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Product Info */}
        <Card style={styles.infoCard} padding="lg">
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <Text style={styles.productCategory}>{product.category}</Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {product.rating}</Text>
            <Text style={styles.reviewCount}>({product.reviewCount} değerlendirme)</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{product.description}</Text>

          {/* Specifications */}
          {product.specifications && (
            <View style={styles.specificationsContainer}>
              <Text style={styles.specificationsTitle}>Özellikler</Text>
              {Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} style={styles.specificationRow}>
                  <Text style={styles.specificationKey}>{key}:</Text>
                  <Text style={styles.specificationValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Price and Purchase */}
        <Card style={styles.purchaseCard} padding="lg">
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              ₺{product.price?.toLocaleString('tr-TR')}
            </Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                ₺{product.originalPrice?.toLocaleString('tr-TR')}
              </Text>
            )}
          </View>

          {/* Stock Info */}
          <Text style={styles.stockInfo}>
            Stok: {product.stock} adet
          </Text>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Adet:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[styles.quantityButton, selectedQuantity <= 1 && styles.quantityButtonDisabled]}
                onPress={decreaseQuantity}
                disabled={selectedQuantity <= 1}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{selectedQuantity}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, selectedQuantity >= product.stock && styles.quantityButtonDisabled]}
                onPress={increaseQuantity}
                disabled={selectedQuantity >= product.stock}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Price */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Toplam:</Text>
            <Text style={styles.totalPrice}>
              ₺{(product.price * selectedQuantity).toLocaleString('tr-TR')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Sepete Ekle"
              onPress={handleAddToCart}
              variant="outline"
              style={styles.addToCartButton}
            />
            <Button
              title="Hemen Al"
              onPress={handleBuyNow}
              style={styles.buyNowButton}
            />
          </View>
        </Card>
      </ScrollView>
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

  content: {
    flex: 1,
    padding: spacing.lg,
  },

  imageCard: {
    marginBottom: spacing.lg,
  },

  imageContainer: {
    position: 'relative',
    height: 250,
  },

  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageText: {
    fontSize: 80,
  },

  discountBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },

  discountText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },

  infoCard: {
    marginBottom: spacing.lg,
  },

  productName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  productBrand: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  productCategory: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    marginBottom: spacing.md,
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  rating: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },

  reviewCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },

  specificationsContainer: {
    marginTop: spacing.md,
  },

  specificationsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  specificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  specificationKey: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },

  specificationValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },

  purchaseCard: {
    marginBottom: spacing.xl,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  currentPrice: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginRight: spacing.sm,
  },

  originalPrice: {
    fontSize: typography.fontSize.lg,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },

  stockInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  quantityLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },

  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },

  quantityButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
  },

  quantityButtonDisabled: {
    opacity: 0.5,
  },

  quantityButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },

  quantityText: {
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    minWidth: 50,
    textAlign: 'center',
  },

  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.lg,
  },

  totalLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },

  totalPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  addToCartButton: {
    flex: 1,
  },

  buyNowButton: {
    flex: 1,
  },
});

export default ProductDetailScreen; 