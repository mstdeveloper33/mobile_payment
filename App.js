import React from 'react';
import { StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
};

export default App; 