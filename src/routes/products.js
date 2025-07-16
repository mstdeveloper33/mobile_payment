const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateProduct, validatePagination, validateUUID } = require('../middleware/validation');

const router = express.Router();

// In-memory product storage (production'da gerçek veritabanı kullanılacak)
const products = new Map();

// Demo ürünleri oluştur
const initializeProducts = () => {
  const demoProducts = [
    {
      id: uuidv4(),
      name: 'iPhone 15 Pro',
      description: 'Apple iPhone 15 Pro 128GB Doğal Titanyum',
      price: 34999.99,
      originalPrice: 39999.99,
      category: 'Telefon',
      subcategory: 'Akıllı Telefon',
      brand: 'Apple',
      stock: 50,
      images: [
        'https://example.com/iphone15pro-1.jpg',
        'https://example.com/iphone15pro-2.jpg'
      ],
      rating: 4.8,
      reviewCount: 245,
      specifications: {
        'Ekran Boyutu': '6.1 inç',
        'İşlemci': 'A17 Pro',
        'RAM': '8GB',
        'Depolama': '128GB',
        'Kamera': '48MP Ana + 12MP Ultra Wide + 12MP Telephoto'
      },
      tags: ['yeni', 'popüler', 'premium'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Samsung Galaxy S24',
      description: 'Samsung Galaxy S24 256GB Phantom Black',
      price: 27999.99,
      originalPrice: 29999.99,
      category: 'Telefon',
      subcategory: 'Akıllı Telefon',
      brand: 'Samsung',
      stock: 30,
      images: [
        'https://example.com/galaxys24-1.jpg',
        'https://example.com/galaxys24-2.jpg'
      ],
      rating: 4.6,
      reviewCount: 178,
      specifications: {
        'Ekran Boyutu': '6.2 inç',
        'İşlemci': 'Snapdragon 8 Gen 3',
        'RAM': '8GB',
        'Depolama': '256GB',
        'Kamera': '50MP Ana + 12MP Ultra Wide + 10MP Telephoto'
      },
      tags: ['yeni', 'android'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'MacBook Air M3',
      description: 'Apple MacBook Air 13" M3 çip 8GB RAM 256GB SSD',
      price: 42999.99,
      originalPrice: 44999.99,
      category: 'Bilgisayar',
      subcategory: 'Laptop',
      brand: 'Apple',
      stock: 25,
      images: [
        'https://example.com/macbookair-1.jpg',
        'https://example.com/macbookair-2.jpg'
      ],
      rating: 4.9,
      reviewCount: 89,
      specifications: {
        'Ekran Boyutu': '13.6 inç',
        'İşlemci': 'Apple M3',
        'RAM': '8GB',
        'Depolama': '256GB SSD',
        'Batarya': '18 saate kadar'
      },
      tags: ['yeni', 'laptop', 'apple'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'AirPods Pro 2',
      description: 'Apple AirPods Pro (2. nesil) USB-C ile',
      price: 7999.99,
      originalPrice: 8999.99,
      category: 'Elektronik',
      subcategory: 'Kulaklık',
      brand: 'Apple',
      stock: 100,
      images: [
        'https://example.com/airpodspro-1.jpg',
        'https://example.com/airpodspro-2.jpg'
      ],
      rating: 4.7,
      reviewCount: 356,
      specifications: {
        'Bağlantı': 'Bluetooth 5.3',
        'Gürültü Engelleme': 'Aktif',
        'Batarya': '6 saat + 24 saat kılıf ile',
        'Su Direnci': 'IPX4'
      },
      tags: ['wireless', 'anc', 'apple'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  demoProducts.forEach(product => {
    products.set(product.id, product);
  });
};

// Demo ürünlerini başlat
initializeProducts();

// Tüm ürünleri listele (sayfalama ile)
router.get('/', validatePagination, optionalAuth, (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const brand = req.query.brand;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    let filteredProducts = Array.from(products.values()).filter(product => product.isActive);

    // Filtreleme
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (brand) {
      filteredProducts = filteredProducts.filter(product => 
        product.brand.toLowerCase().includes(brand.toLowerCase())
      );
    }

    if (!isNaN(minPrice)) {
      filteredProducts = filteredProducts.filter(product => product.price >= minPrice);
    }

    if (!isNaN(maxPrice)) {
      filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sıralama
    filteredProducts.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'price' || sortBy === 'rating') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Sayfalama
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        category,
        brand,
        minPrice,
        maxPrice,
        search
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    next(error);
  }
});

// Kategorileri listele
router.get('/categories', (req, res, next) => {
  try {
    const categories = Array.from(products.values())
      .filter(product => product.isActive)
      .reduce((acc, product) => {
        if (!acc.find(cat => cat.name === product.category)) {
          acc.push({
            name: product.category,
            productCount: Array.from(products.values())
              .filter(p => p.category === product.category && p.isActive).length
          });
        }
        return acc;
      }, []);

    res.json({
      categories
    });

  } catch (error) {
    next(error);
  }
});

// Markaları listele
router.get('/brands', (req, res, next) => {
  try {
    const brands = Array.from(products.values())
      .filter(product => product.isActive)
      .reduce((acc, product) => {
        if (!acc.find(brand => brand.name === product.brand)) {
          acc.push({
            name: product.brand,
            productCount: Array.from(products.values())
              .filter(p => p.brand === product.brand && p.isActive).length
          });
        }
        return acc;
      }, []);

    res.json({
      brands
    });

  } catch (error) {
    next(error);
  }
});

// Popüler ürünler
router.get('/popular', optionalAuth, (req, res, next) => {
  try {
    const popularProducts = Array.from(products.values())
      .filter(product => product.isActive)
      .sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount))
      .slice(0, 10);

    res.json({
      products: popularProducts
    });

  } catch (error) {
    next(error);
  }
});

// İndirimli ürünler
router.get('/discounted', optionalAuth, (req, res, next) => {
  try {
    const discountedProducts = Array.from(products.values())
      .filter(product => product.isActive && product.originalPrice > product.price)
      .map(product => ({
        ...product,
        discountPercentage: Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      }))
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, 10);

    res.json({
      products: discountedProducts
    });

  } catch (error) {
    next(error);
  }
});

// Tek ürün detayı
router.get('/:productId', validateUUID('productId'), optionalAuth, (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = products.get(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Ürün bulunamadı veya artık mevcut değil'
      });
    }

    // İlgili ürünler (aynı kategori)
    const relatedProducts = Array.from(products.values())
      .filter(p => 
        p.isActive && 
        p.id !== productId && 
        p.category === product.category
      )
      .slice(0, 4);

    res.json({
      product: {
        ...product,
        discountPercentage: product.originalPrice > product.price ? 
          Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
      },
      relatedProducts
    });

  } catch (error) {
    next(error);
  }
});

// Ürün arama önerileri
router.get('/search/suggestions', (req, res, next) => {
  try {
    const query = req.query.q;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const queryLower = query.toLowerCase();
    const suggestions = [];

    // Ürün adlarından öneriler
    Array.from(products.values())
      .filter(product => product.isActive)
      .forEach(product => {
        if (product.name.toLowerCase().includes(queryLower)) {
          suggestions.push({
            text: product.name,
            type: 'product'
          });
        }
        
        // Marka önerileri
        if (product.brand.toLowerCase().includes(queryLower)) {
          if (!suggestions.find(s => s.text === product.brand && s.type === 'brand')) {
            suggestions.push({
              text: product.brand,
              type: 'brand'
            });
          }
        }

        // Kategori önerileri
        if (product.category.toLowerCase().includes(queryLower)) {
          if (!suggestions.find(s => s.text === product.category && s.type === 'category')) {
            suggestions.push({
              text: product.category,
              type: 'category'
            });
          }
        }
      });

    res.json({
      suggestions: suggestions.slice(0, 10)
    });

  } catch (error) {
    next(error);
  }
});

// Yeni ürün ekle (admin)
router.post('/', authenticateToken, validateProduct, (req, res, next) => {
  try {
    const productId = uuidv4();
    const newProduct = {
      id: productId,
      ...req.body,
      rating: 0,
      reviewCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.set(productId, newProduct);

    res.status(201).json({
      message: 'Ürün başarıyla eklendi',
      product: newProduct
    });

  } catch (error) {
    next(error);
  }
});

// Ürün güncelle (admin)
router.put('/:productId', authenticateToken, validateUUID('productId'), (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = products.get(productId);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Ürün bulunamadı'
      });
    }

    const updatedProduct = {
      ...product,
      ...req.body,
      id: productId, // ID değiştirilemesin
      updatedAt: new Date().toISOString()
    };

    products.set(productId, updatedProduct);

    res.json({
      message: 'Ürün başarıyla güncellendi',
      product: updatedProduct
    });

  } catch (error) {
    next(error);
  }
});

// Ürün sil (admin)
router.delete('/:productId', authenticateToken, validateUUID('productId'), (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = products.get(productId);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Ürün bulunamadı'
      });
    }

    // Soft delete
    const updatedProduct = {
      ...product,
      isActive: false,
      updatedAt: new Date().toISOString()
    };

    products.set(productId, updatedProduct);

    res.json({
      message: 'Ürün başarıyla silindi'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 