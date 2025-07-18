// In-memory data store (production'da gerçek veritabanı kullanılacak)

// Data stores
const orders = new Map();
const payments = new Map();
const users = new Map();

// Demo data'yı başlat
function initializeDemoData() {
  // Demo kullanıcılar
  users.set('demo@example.com', {
    id: 'user-demo-1',
    email: 'demo@example.com',
    firstName: 'Demo',
    lastName: 'User',
    phone: '+905551234567',
    createdAt: new Date().toISOString()
  });

  users.set('test@test.com', {
    id: 'user-test-2',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '+905557654321',
    createdAt: new Date().toISOString()
  });

  console.log('Demo data initialized');
}

// Store'u başlat
initializeDemoData();

module.exports = {
  orders,
  payments,
  users,
  initializeDemoData
}; 