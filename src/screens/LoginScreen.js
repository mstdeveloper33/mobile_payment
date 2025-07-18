import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../components';
import { colors, typography, spacing } from '../theme';
import ApiService from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    if (!form.password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    } else if (form.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await ApiService.login(form.email, form.password);
      
      Alert.alert(
        'Başarılı',
        'Giriş yapıldı!',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.replace('Main'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Hata', error.message || 'Giriş yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Hoş Geldiniz</Text>
              <Text style={styles.subtitle}>
                Hesabınıza giriş yapın
              </Text>
            </View>

            <Card style={styles.formCard}>
              <Input
                label="Email"
                placeholder="ornek@email.com"
                value={form.email}
                onChangeText={(value) => handleInputChange('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Şifre"
                placeholder="Şifrenizi girin"
                value={form.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                secureTextEntry
              />

              <Button
                title="Giriş Yap"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Yeni Hesap Oluştur"
                onPress={navigateToRegister}
                variant="outline"
                disabled={loading}
              />
            </Card>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Demo backend: localhost:3000
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  
  keyboardAvoid: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  
  content: {
    paddingVertical: spacing['4xl'],
  },
  
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  formCard: {
    marginBottom: spacing.xl,
  },
  
  loginButton: {
    marginBottom: spacing.lg,
  },
  
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  
  dividerText: {
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default LoginScreen; 