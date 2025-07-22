import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

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

    const result = await login(form.email, form.password);
    
    if (result.success) {
      Alert.alert(
        'Başarılı',
        'Giriş yapıldı!',
        [{ text: 'Tamam' }]
      );
      // AuthContext will automatically handle navigation
    } else {
      Alert.alert('Hata', result.error || 'Giriş yapılamadı');
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const fillDemoCredentials = (email, password) => {
    setForm({ email, password });
    setErrors({});
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
                loading={isLoading}
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
                disabled={isLoading}
              />
            </Card>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Demo backend: localhost:3000
              </Text>
              
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Demo Hesaplar:</Text>
                <TouchableOpacity 
                  style={styles.demoButton}
                  onPress={() => fillDemoCredentials('demo@example.com', '123456')}
                >
                  <Text style={styles.demoButtonText}>Demo Kullanıcı</Text>
                  <Text style={styles.demoButtonSubtext}>demo@example.com / 123456</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.demoButton}
                  onPress={() => fillDemoCredentials('test@test.com', '123456')}
                >
                  <Text style={styles.demoButtonText}>Test Kullanıcı</Text>
                  <Text style={styles.demoButtonSubtext}>test@test.com / 123456</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.demoButton}
                  onPress={() => fillDemoCredentials('admin@admin.com', 'admin123')}
                >
                  <Text style={styles.demoButtonText}>Admin</Text>
                  <Text style={styles.demoButtonSubtext}>admin@admin.com / admin123</Text>
                </TouchableOpacity>
              </View>
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

  demoSection: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.backgroundPrimary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  demoTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  demoButton: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  demoButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  demoButtonSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default LoginScreen; 