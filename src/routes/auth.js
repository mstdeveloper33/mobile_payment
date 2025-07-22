const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// In-memory user storage (production'da gerçek veritabanı kullanılacak)
const users = new Map();

// Demo kullanıcıları oluştur
const initializeDemoUsers = async () => {
  const demoUsers = [
    {
      id: uuidv4(),
      email: 'demo@example.com',
      password: await bcrypt.hash('123456', 10),
      firstName: 'Demo',
      lastName: 'Kullanıcı',
      phone: '+905551234567',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: uuidv4(),
      email: 'test@test.com',
      password: await bcrypt.hash('123456', 10),
      firstName: 'Test',
      lastName: 'User',
      phone: '+905559876543',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: uuidv4(),
      email: 'admin@admin.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'Yönetici',
      phone: '+905551111111',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    }
  ];

  demoUsers.forEach(user => {
    users.set(user.id, user);
  });

  console.log('🔐 Demo kullanıcılar oluşturuldu:');
  console.log('   Email: demo@example.com, Şifre: 123456');
  console.log('   Email: test@test.com, Şifre: 123456');
  console.log('   Email: admin@admin.com, Şifre: admin123');
};

// Demo kullanıcıları başlat
initializeDemoUsers();

// Kullanıcı kaydı
router.post('/register', validateUserRegistration, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Kullanıcının daha önce kayıtlı olup olmadığını kontrol et
    const existingUser = Array.from(users.values()).find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Bu email adresi ile kayıtlı bir kullanıcı zaten mevcut'
      });
    }

    // Şifreyi hashle
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Yeni kullanıcı oluştur
    const userId = uuidv4();
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    users.set(userId, newUser);

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: userId,
        email: email,
        firstName: firstName,
        lastName: lastName
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Şifreyi response'dan çıkar
    const { password: _, ...userResponse } = newUser;

    res.status(201).json({
      message: 'Kullanıcı başarıyla kayıt edildi',
      user: userResponse,
      token: token
    });

  } catch (error) {
    next(error);
  }
});

// Kullanıcı girişi
router.post('/login', validateUserLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı email ile bul
    const user = Array.from(users.values()).find(user => user.email === email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email veya şifre hatalı'
      });
    }

    // Şifreyi doğrula
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email veya şifre hatalı'
      });
    }

    // Kullanıcının aktif olup olmadığını kontrol et
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Hesabınız deaktif edilmiş. Lütfen destek ekibi ile iletişime geçin.'
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Şifreyi response'dan çıkar
    const { password: _, ...userResponse } = user;

    res.json({
      message: 'Giriş başarılı',
      user: userResponse,
      token: token
    });

  } catch (error) {
    next(error);
  }
});

// Kullanıcı profili getir
router.get('/profile', authenticateToken, (req, res, next) => {
  try {
    const user = users.get(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Kullanıcı bulunamadı'
      });
    }

    const { password: _, ...userResponse } = user;
    res.json({
      user: userResponse
    });

  } catch (error) {
    next(error);
  }
});

// Kullanıcı profili güncelle
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone } = req.body;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Güncelleme
    const updatedUser = {
      ...user,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone,
      updatedAt: new Date().toISOString()
    };

    users.set(userId, updatedUser);

    const { password: _, ...userResponse } = updatedUser;
    res.json({
      message: 'Profil başarıyla güncellendi',
      user: userResponse
    });

  } catch (error) {
    next(error);
  }
});

// Şifre değiştir
router.put('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Mevcut şifre ve yeni şifre gerekli'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Yeni şifre en az 6 karakter olmalı'
      });
    }

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Mevcut şifreyi doğrula
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Invalid current password',
        message: 'Mevcut şifre hatalı'
      });
    }

    // Yeni şifreyi hashle
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Kullanıcıyı güncelle
    const updatedUser = {
      ...user,
      password: hashedNewPassword,
      updatedAt: new Date().toISOString()
    };

    users.set(userId, updatedUser);

    res.json({
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    next(error);
  }
});

// Token doğrulama endpoint'i
router.post('/verify-token', authenticateToken, (req, res) => {
  res.json({
    message: 'Token geçerli',
    user: {
      userId: req.user.userId,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    }
  });
});

// Çıkış (client-side'da token'ı silmek yeterli)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Başarıyla çıkış yapıldı'
  });
});

module.exports = router; 