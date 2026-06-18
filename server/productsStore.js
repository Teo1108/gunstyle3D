const fs = require('fs');

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function defaultSizes() {
  return ALL_SIZES.reduce((acc, size) => ({ ...acc, [size]: true }), {});
}

const LEGACY_PRODUCTS = [
  { id: '1', name: 'Premium Black Tee', category: 'T-Shirts', price: 45.00, rating: 4.8, isNew: true, description: 'A timeless black tee tailored for creators.' },
  { id: '2', name: 'Code & Creator T-Shirt', category: 'T-Shirts', price: 45.00, rating: 4.7, isNew: false, description: 'Clean white tee with subtle code snippets.' },
  { id: '3', name: 'Dark Mode Forever Hoodie', category: 'Hoodies', price: 75.00, rating: 4.9, isNew: true, description: 'For those who prefer their environments dark.' },
  { id: '4', name: 'Neural Network Hoodie', category: 'Hoodies', price: 75.00, rating: 4.6, isNew: false, description: 'Stay warm while training your models.' },
  { id: '5', name: 'AI Commuter Backpack', category: 'Accessories', price: 95.00, rating: 4.8, isNew: false, description: 'Perfect for tech and gear on the go.' },
  { id: '6', name: 'Minimal Tech iPhone Case', category: 'Accessories', price: 25.00, rating: 4.5, isNew: true, description: 'Protect your devices in style.' },
  { id: '7', name: 'Premium AI Pen', category: 'Accessories', price: 15.00, rating: 4.7, isNew: false, description: 'For those who need to take physical notes.' },
  { id: '8', name: 'Street Style Tee', category: 'T-Shirts', price: 45.00, rating: 4.6, isNew: true, description: 'Bold streetwear for the modern creator.' },
  { id: '9', name: 'Urban Zip Hoodie', category: 'Hoodies', price: 80.00, rating: 4.7, isNew: false, description: 'Heavyweight zip hoodie for urban explorers.' },
  { id: '10', name: 'GunStyle Cap', category: 'Accessories', price: 30.00, rating: 4.5, isNew: true, description: 'Classic cap with embroidered logo.' },
  { id: '11', name: 'Tactical Tote Bag', category: 'Accessories', price: 55.00, rating: 4.8, isNew: false, description: 'Durable tote for everyday carry.' },
  { id: '12', name: 'Signature Graphic Tee', category: 'T-Shirts', price: 50.00, rating: 4.9, isNew: true, description: 'Limited edition graphic tee.' },
];

function buildLegacyProducts() {
  return LEGACY_PRODUCTS.map(p => ({
    ...p,
    images: [`/images/${p.id}.jpg`],
    catalogImage: `/images/${p.id}.jpg`,
    sizes: defaultSizes(),
  }));
}

function createProductsStore(dataPath) {
  function saveProducts(products) {
    fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
  }

  function loadProducts() {
    if (!fs.existsSync(dataPath)) {
      const migrated = buildLegacyProducts();
      saveProducts(migrated);
      return migrated;
    }
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }

  function nextId(products) {
    const maxId = products.reduce((max, p) => Math.max(max, parseInt(p.id, 10) || 0), 0);
    return String(maxId + 1);
  }

  function getAllProducts() {
    return loadProducts();
  }

  function getProductById(id) {
    return loadProducts().find(p => p.id === id) || null;
  }

  function createProduct(data) {
    const products = loadProducts();
    const product = {
      id: nextId(products),
      name: data.name,
      category: data.category,
      price: data.price,
      rating: data.rating ?? 5.0,
      isNew: data.isNew ?? true,
      description: data.description || '',
      images: data.images || [],
      catalogImage: data.catalogImage || (data.images && data.images[0]) || '',
      sizes: data.sizes || defaultSizes(),
    };
    products.push(product);
    saveProducts(products);
    return product;
  }

  function updateProduct(id, data) {
    const products = loadProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...data, id };
    saveProducts(products);
    return products[index];
  }

  function deleteProduct(id) {
    const products = loadProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    saveProducts(products);
    return true;
  }

  return { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
}

module.exports = { createProductsStore, ALL_SIZES, defaultSizes };
