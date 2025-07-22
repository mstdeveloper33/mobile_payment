import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext({});

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from AsyncStorage on app start
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Save cart to AsyncStorage whenever cart changes
  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage();
    }
  }, [cartItems, isLoading]);

  const loadCartFromStorage = async () => {
    try {
      setIsLoading(true);
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCartToStorage = async () => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Item already exists, update quantity
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
        
        // Check if new quantity exceeds stock
        if (newQuantity > product.stock) {
          updatedItems[existingItemIndex].quantity = product.stock;
        } else {
          updatedItems[existingItemIndex].quantity = newQuantity;
        }
        
        return updatedItems;
      } else {
        // New item, add to cart
        const finalQuantity = Math.min(quantity, product.stock);
        return [...prevItems, {
          id: `${product.id}_${Date.now()}`,
          product,
          quantity: finalQuantity,
          addedAt: new Date().toISOString(),
        }];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const finalQuantity = Math.min(newQuantity, item.product.stock);
          return { ...item, quantity: finalQuantity };
        }
        return item;
      });
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }, [cartItems]);

  const getCartItemByProductId = useCallback((productId) => {
    return cartItems.find(item => item.product.id === productId);
  }, [cartItems]);

  const isProductInCart = useCallback((productId) => {
    return cartItems.some(item => item.product.id === productId);
  }, [cartItems]);

  const getProductQuantityInCart = useCallback((productId) => {
    const item = getCartItemByProductId(productId);
    return item ? item.quantity : 0;
  }, [getCartItemByProductId]);

  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemsCount,
    getCartTotal,
    getCartItemByProductId,
    isProductInCart,
    getProductQuantityInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext; 