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
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
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

    if (!form.firstName.trim()) {
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Telefon numarası gereklidir';
    }

    if (!form.password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    } else if (form.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler uyuşmuyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const userData = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      password: form.password,
    };

    const result = await register(userData);
    
    if (result.success) {
      Alert.alert(
        'Başarılı',
        'Hesabınız oluşturuldu!',
        [{ text: 'Tamam' }]
      );
      // AuthContext will automatically handle navigation
    } else {
      Alert.alert('Hata', result.error || 'Kayıt oluşturulamadı');
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
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
              <Text style={styles.title}>Hesap Oluştur</Text>
              <Text style={styles.subtitle}>
                Yeni hesabınızı oluşturun
              </Text>
            </View>

            <Card style={styles.formCard}>
              <View style={styles.nameRow}>
                <Input
                  label="Ad"
                  placeholder="Adınız"
                  value={form.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  error={errors.firstName}
                  style={styles.halfInput}
                />
                <Input
                  label="Soyad"
                  placeholder="Soyadınız"
                  value={form.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  error={errors.lastName}
                  style={styles.halfInput}
                />
              </View>

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
                label="Telefon"
                placeholder="+90 555 123 45 67"
                value={form.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                error={errors.phone}
                keyboardType="phone-pad"
              />

              <Input
                label="Şifre"
                placeholder="Şifrenizi girin"
                value={form.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                secureTextEntry
              />

              <Input
                label="Şifre Tekrar"
                placeholder="Şifrenizi tekrar girin"
                value={form.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry
              />

              <Button
                title="Hesap Oluştur"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.registerButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Zaten Hesabım Var"
                onPress={navigateToLogin}
                variant="outline"
                disabled={isLoading}
              />
            </Card>
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
    paddingVertical: spacing['2xl'],
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
  
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  halfInput: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  
  registerButton: {
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
});

export default RegisterScreen; 