import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentWebViewScreen from '../screens/PaymentWebViewScreen';
import PaymentResultScreen from '../screens/PaymentResultScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundPrimary }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      >
        {isAuthenticated ? (
          // Authenticated Stack
          <>
            <Stack.Screen 
              name="Main" 
              component={HomeScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen 
              name="Products" 
              component={ProductsScreen}
              options={{ 
                gestureEnabled: true,
                cardStyleInterpolator: ({ current, layouts }) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                }),
              }}
            />
            <Stack.Screen 
              name="ProductDetail" 
              component={ProductDetailScreen}
              options={{ 
                gestureEnabled: true,
                cardStyleInterpolator: ({ current, layouts }) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                }),
              }}
            />
            <Stack.Screen 
              name="Cart" 
              component={CartScreen}
              options={{ 
                gestureEnabled: true,
                cardStyleInterpolator: ({ current, layouts }) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                }),
              }}
            />
                         <Stack.Screen 
               name="Checkout" 
               component={CheckoutScreen}
               options={{ 
                 gestureEnabled: true,
                 cardStyleInterpolator: ({ current, layouts }) => ({
                   cardStyle: {
                     transform: [
                       {
                         translateX: current.progress.interpolate({
                           inputRange: [0, 1],
                           outputRange: [layouts.screen.width, 0],
                         }),
                       },
                     ],
                   },
                 }),
               }}
             />
             <Stack.Screen 
               name="PaymentWebView" 
               component={PaymentWebViewScreen}
               options={{ 
                 gestureEnabled: false,
                 headerShown: false
               }}
             />
             <Stack.Screen 
               name="PaymentResult" 
               component={PaymentResultScreen}
               options={{ 
                 gestureEnabled: false,
                 headerShown: false
               }}
             />
             <Stack.Screen 
               name="OrderHistory" 
               component={OrderHistoryScreen}
               options={{ 
                 gestureEnabled: true,
                 cardStyleInterpolator: ({ current, layouts }) => ({
                   cardStyle: {
                     transform: [
                       {
                         translateX: current.progress.interpolate({
                           inputRange: [0, 1],
                           outputRange: [layouts.screen.width, 0],
                         }),
                       },
                     ],
                   },
                 }),
               }}
             />
          </>
        ) : (
          // Unauthenticated Stack
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ 
                gestureEnabled: true,
                cardStyleInterpolator: ({ current, layouts }) => ({
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                }),
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 