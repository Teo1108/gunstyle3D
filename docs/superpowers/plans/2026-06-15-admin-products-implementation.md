# Admin Panel & Product Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-protected admin panel for product CRUD (with multi-photo upload, catalog-photo selection, and size toggles) and a customer-facing product detail page with a photo gallery, replacing the hardcoded product array with a JSON-file-backed store.

**Architecture:** Backend gets three new pure/testable modules (`productsStore.js`, `auth.js`, `upload.js`) wired into `server.js` via dependency injection (env-var-overridable paths/password) so they're unit- and integration-testable with vitest/supertest. Frontend gets two custom hooks (`useProductForm`, `useProductGallery`) holding all business logic, tested with `@testing-library/react`, with thin page components on top that are verified manually. Product image field renames from `image` to `images[]` + `catalogImage` across all consumers.

**Tech Stack:** Express 5, multer (file upload), Node `crypto.randomUUID` (tokens), React 19, react-router-dom 7, vitest + supertest (backend tests), vitest + jsdom + @testing-library/react (frontend tests).

---

## Task 1: Backend dependencies

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: Add dependencies**

Edit `server/package.json` dependencies and devDependencies:

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "vitest run"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "cors": "^2.8.6",
    "express": "^5.2.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Install**

Run: `cd server && npm install`
Expected: installs `multer`, `supertest`, `vitest` with no errors.

- [ ] **Step 3: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: add multer, vitest, supertest to server"
```

---

## Task 2: Products data store (`server/productsStore.js`)

**Files:**
- Create: `server/productsStore.js`
- Test: `server/productsStore.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/productsStore.test.js`:

```js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { describe, it, expect, beforeEach, afterEach } = require('vitest');
const { createProductsStore, defaultSizes, ALL_SIZES } = require('./productsStore');

let dataPath;

beforeEach(() => {
  dataPath = path.join(os.tmpdir(), `products-test-${Date.now()}-${Math.random()}.json`);
});

afterEach(() => {
  if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
});

describe('defaultSizes', () => {
  it('enables every size in ALL_SIZES', () => {
    const sizes = defaultSizes();
    ALL_SIZES.forEach(size => expect(sizes[size]).toBe(true));
  });
});

describe('createProductsStore', () => {
  it('migrates 12 legacy products on first load when no file exists', () => {
    const store = createProductsStore(dataPath);
    const products = store.getAllProducts();
    expect(products).toHaveLength(12);
    expect(products[0]).toMatchObject({ id: '1', catalogImage: '/images/1.jpg' });
    expect(fs.existsSync(dataPath)).toBe(true);
  });

  it('reuses the existing file on subsequent loads instead of re-migrating', () => {
    const store = createProductsStore(dataPath);
    store.deleteProduct('1');
    const store2 = createProductsStore(dataPath);
    expect(store2.getAllProducts()).toHaveLength(11);
  });

  it('getProductById returns null for an unknown id', () => {
    const store = createProductsStore(dataPath);
    expect(store.getProductById('does-not-exist')).toBeNull();
  });

  it('getProductById returns the matching product', () => {
    const store = createProductsStore(dataPath);
    const product = store.getProductById('3');
    expect(product.name).toBe('Dark Mode Forever Hoodie');
  });

  it('createProduct assigns the next numeric id and persists it', () => {
    const store = createProductsStore(dataPath);
    const created = store.createProduct({
      name: 'New Tee',
      category: 'T-Shirts',
      price: 30,
      description: 'desc',
      images: ['/images/uploads/a.jpg'],
    });
    expect(created.id).toBe('13');
    expect(created.catalogImage).toBe('/images/uploads/a.jpg');
    expect(created.sizes).toEqual(defaultSizes());

    const reloaded = createProductsStore(dataPath).getProductById('13');
    expect(reloaded.name).toBe('New Tee');
  });

  it('updateProduct merges fields and keeps the same id', () => {
    const store = createProductsStore(dataPath);
    const updated = store.updateProduct('1', { price: 99.99 });
    expect(updated.id).toBe('1');
    expect(updated.price).toBe(99.99);
    expect(updated.name).toBe('Premium Black Tee');
  });

  it('updateProduct returns null for an unknown id', () => {
    const store = createProductsStore(dataPath);
    expect(store.updateProduct('nope', { price: 1 })).toBeNull();
  });

  it('deleteProduct removes the product and returns true', () => {
    const store = createProductsStore(dataPath);
    expect(store.deleteProduct('2')).toBe(true);
    expect(store.getProductById('2')).toBeNull();
  });

  it('deleteProduct returns false for an unknown id', () => {
    const store = createProductsStore(dataPath);
    expect(store.deleteProduct('nope')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run productsStore.test.js`
Expected: FAIL with "Cannot find module './productsStore'"

- [ ] **Step 3: Write the implementation**

Create `server/productsStore.js`:

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run productsStore.test.js`
Expected: PASS, 9 tests passed

- [ ] **Step 5: Commit**

```bash
git add server/productsStore.js server/productsStore.test.js
git commit -m "feat: add JSON-backed products data store"
```

---

## Task 3: Admin auth (`server/auth.js`)

**Files:**
- Create: `server/auth.js`
- Test: `server/auth.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/auth.test.js`:

```js
const { describe, it, expect } = require('vitest');
const { createAuthService } = require('./auth');

describe('createAuthService', () => {
  it('login returns null for the wrong password', () => {
    const auth = createAuthService('correct-password');
    expect(auth.login('wrong')).toBeNull();
  });

  it('login returns a token string for the correct password', () => {
    const auth = createAuthService('correct-password');
    const token = auth.login('correct-password');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifyToken returns true for a token issued by login', () => {
    const auth = createAuthService('correct-password');
    const token = auth.login('correct-password');
    expect(auth.verifyToken(token)).toBe(true);
  });

  it('verifyToken returns false for an unknown token', () => {
    const auth = createAuthService('correct-password');
    expect(auth.verifyToken('bogus-token')).toBe(false);
  });

  it('verifyToken returns false for an empty token', () => {
    const auth = createAuthService('correct-password');
    expect(auth.verifyToken('')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run auth.test.js`
Expected: FAIL with "Cannot find module './auth'"

- [ ] **Step 3: Write the implementation**

Create `server/auth.js`:

```js
const crypto = require('crypto');

function createAuthService(password) {
  const validTokens = new Set();

  function login(attemptedPassword) {
    if (attemptedPassword !== password) return null;
    const token = crypto.randomUUID();
    validTokens.add(token);
    return token;
  }

  function verifyToken(token) {
    if (!token) return false;
    return validTokens.has(token);
  }

  return { login, verifyToken };
}

module.exports = { createAuthService };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run auth.test.js`
Expected: PASS, 5 tests passed

- [ ] **Step 5: Commit**

```bash
git add server/auth.js server/auth.test.js
git commit -m "feat: add token-based admin auth service"
```

---

## Task 4: Upload filename helper (`server/upload.js`)

**Files:**
- Create: `server/upload.js`
- Test: `server/upload.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/upload.test.js`:

```js
const { describe, it, expect } = require('vitest');
const { generateUniqueFilename } = require('./upload');

describe('generateUniqueFilename', () => {
  it('preserves the file extension', () => {
    const filename = generateUniqueFilename('photo.jpg');
    expect(filename.endsWith('.jpg')).toBe(true);
  });

  it('strips unsafe characters from the base name', () => {
    const filename = generateUniqueFilename('my photo (1)!.png');
    expect(filename).toMatch(/^\d+-myphoto1\.png$/);
  });

  it('prefixes with a numeric timestamp so two calls differ', () => {
    const a = generateUniqueFilename('a.jpg');
    const b = generateUniqueFilename('a.jpg');
    expect(a).toMatch(/^\d+-a\.jpg$/);
    expect(b).toMatch(/^\d+-a\.jpg$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run upload.test.js`
Expected: FAIL with "Cannot find module './upload'"

- [ ] **Step 3: Write the implementation**

Create `server/upload.js`:

```js
const path = require('path');
const fs = require('fs');
const multer = require('multer');

function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '');
  return `${Date.now()}-${base}${ext}`;
}

function createUploadMiddleware(uploadsDir) {
  fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, generateUniqueFilename(file.originalname)),
  });

  return multer({ storage });
}

module.exports = { createUploadMiddleware, generateUniqueFilename };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run upload.test.js`
Expected: PASS, 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add server/upload.js server/upload.test.js
git commit -m "feat: add multer upload middleware with safe filename generation"
```

---

## Task 5: Wire it all into `server/server.js`

**Files:**
- Modify: `server/server.js`
- Test: `server/server.test.js`

- [ ] **Step 1: Write the failing integration tests**

Create `server/server.test.js`:

```js
process.env.PRODUCTS_DATA_PATH = require('path').join(require('os').tmpdir(), `server-test-products-${Date.now()}.json`);
process.env.UPLOADS_DIR = require('path').join(require('os').tmpdir(), `server-test-uploads-${Date.now()}`);
process.env.ADMIN_PASSWORD = 'test-admin-pass';

const fs = require('fs');
const { describe, it, expect, afterAll } = require('vitest');
const request = require('supertest');
const app = require('./server');

afterAll(() => {
  if (fs.existsSync(process.env.PRODUCTS_DATA_PATH)) fs.unlinkSync(process.env.PRODUCTS_DATA_PATH);
});

describe('GET /api/products', () => {
  it('returns the migrated product list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(12);
  });
});

describe('GET /api/products/:id', () => {
  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/products/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('returns the product for a known id', async () => {
    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('1');
  });
});

describe('POST /api/admin/login', () => {
  it('rejects the wrong password', async () => {
    const res = await request(app).post('/api/admin/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('accepts the correct password and returns a token', async () => {
    const res = await request(app).post('/api/admin/login').send({ password: 'test-admin-pass' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});

describe('POST /api/products', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).post('/api/products').send({ name: 'X', price: 1 });
    expect(res.status).toBe(401);
  });

  it('creates a product when authenticated', async () => {
    const login = await request(app).post('/api/admin/login').send({ password: 'test-admin-pass' });
    const token = login.body.token;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Product', category: 'T-Shirts', price: 10, images: ['/images/x.jpg'] });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Product');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run server.test.js`
Expected: FAIL (server.js doesn't export `app`, and routes/middleware don't exist yet)

- [ ] **Step 3: Rewrite `server/server.js`**

Replace the full contents of `server/server.js` with:

```js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createProductsStore } = require('./productsStore');
const { createAuthService } = require('./auth');
const { createUploadMiddleware } = require('./upload');

const app = express();
const PORT = process.env.PORT || 3001;

const productsStore = createProductsStore(
  process.env.PRODUCTS_DATA_PATH || path.join(__dirname, 'products.json')
);
const authService = createAuthService(process.env.ADMIN_PASSWORD || 'gunstyle2023');
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../public/images/uploads');
const upload = createUploadMiddleware(uploadsDir);

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../public/images')));

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!authService.verifyToken(token)) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  next();
}

const VALID_DISCOUNTS = {
  'NEURAL10': { type: 'percentage', value: 10 },
  'GUNSTILE': { type: 'fixed', value: 20 }
};

// --- PRODUCTS ---
app.get('/api/products', (req, res) => {
  const data = productsStore.getAllProducts();
  res.json({ success: true, count: data.length, data });
});

app.get('/api/products/:id', (req, res) => {
  const product = productsStore.getProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  res.json({ success: true, data: product });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const product = productsStore.createProduct(req.body);
  res.status(201).json({ success: true, data: product });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const product = productsStore.updateProduct(req.params.id, req.body);
  if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  res.json({ success: true, data: product });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const ok = productsStore.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  res.json({ success: true });
});

// --- UPLOAD ---
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió archivo' });
  res.json({ success: true, path: `/images/uploads/${req.file.filename}` });
});

// --- ADMIN AUTH ---
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const token = authService.login(password);
  if (!token) return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
  res.json({ success: true, token });
});

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  res.json({ success: authService.verifyToken(token) });
});

// --- DISCOUNTS ---
app.post('/api/discounts/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Se requiere código' });

  const discountCode = code.toUpperCase();
  const discountRule = VALID_DISCOUNTS[discountCode];

  if (discountRule) {
    res.json({ success: true, message: `Código aplicado: ${discountCode}`, discount: discountRule });
  } else {
    res.status(404).json({ success: false, message: 'Código inválido' });
  }
});

// --- CHECKOUT ---
app.post('/api/checkout', (req, res) => {
  const { items, discountCode, finalize } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'El carrito está vacío' });
  }

  let subtotal = 0;
  const processedItems = items.map(cartItem => {
    const product = productsStore.getProductById(cartItem.productId);
    if (!product) throw new Error(`Product ${cartItem.productId} not found`);

    subtotal += product.price * cartItem.quantity;
    return { ...product, quantity: cartItem.quantity };
  });

  let discountAmount = 0;
  if (discountCode) {
    const code = discountCode.toUpperCase();
    if (VALID_DISCOUNTS[code]) {
      if (VALID_DISCOUNTS[code].type === 'percentage') {
        discountAmount = (subtotal * VALID_DISCOUNTS[code].value) / 100;
      } else {
        discountAmount = VALID_DISCOUNTS[code].value;
      }
    }
  }

  const shipping = 0;
  const total = subtotal - discountAmount + shipping;

  setTimeout(() => {
    const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
    if (finalize) {
      globalCart = [];
    }

    res.json({
      success: true,
      message: 'Detalles calculados',
      orderId,
      receipt: {
        items: processedItems,
        subtotal,
        discountAmount,
        shipping,
        total
      }
    });
  }, finalize ? 800 : 100);
});

// --- CART STATE ---
let globalCart = [
  { productId: '2', quantity: 2 },
  { productId: '6', quantity: 1 }
];

app.get('/api/cart', (req, res) => {
  res.json({ success: true, data: globalCart });
});

app.post('/api/cart', (req, res) => {
  const { productId, quantity } = req.body;
  const existing = globalCart.find(item => item.productId === productId);
  if (existing) {
    if (quantity <= 0) {
      globalCart = globalCart.filter(item => item.productId !== productId);
    } else {
      existing.quantity = quantity;
    }
  } else if (quantity > 0) {
    globalCart.push({ productId, quantity });
  }
  res.json({ success: true, data: globalCart });
});

app.delete('/api/cart/:productId', (req, res) => {
  const { productId } = req.params;
  globalCart = globalCart.filter(item => item.productId !== productId);
  res.json({ success: true, data: globalCart });
});

// --- PREFERENCES STATE ---
let globalPreferences = {
  device: 'mobile',
  theme: 'dark',
};

const VALID_DEVICES = ['mobile', 'tablet', 'desktop'];
const VALID_THEMES = ['dark', 'light'];

app.get('/api/preferences', (req, res) => {
  res.json({ success: true, data: globalPreferences });
});

app.patch('/api/preferences', (req, res) => {
  const { device, theme } = req.body;

  if (device !== undefined) {
    if (!VALID_DEVICES.includes(device)) {
      return res.status(400).json({
        success: false,
        message: `Device must be one of: ${VALID_DEVICES.join(', ')}`,
      });
    }
    globalPreferences.device = device;
  }

  if (theme !== undefined) {
    if (!VALID_THEMES.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: `Theme must be one of: ${VALID_THEMES.join(', ')}`,
      });
    }
    globalPreferences.theme = theme;
  }

  res.json({ success: true, data: globalPreferences });
});

app.delete('/api/preferences', (req, res) => {
  globalPreferences = { device: 'mobile', theme: 'dark' };
  res.json({ success: true, data: globalPreferences, message: 'Preferences reset to defaults' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GunStile E-Commerce Backend running on port ${PORT}`);
  });
}

module.exports = app;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run server.test.js`
Expected: PASS, 7 tests passed

- [ ] **Step 5: Run the full backend test suite**

Run: `cd server && npm test`
Expected: PASS, all test files (productsStore, auth, upload, server) green

- [ ] **Step 6: Commit**

```bash
git add server/server.js server/server.test.js
git commit -m "feat: wire products store, auth, and uploads into the API"
```

---

## Task 6: Frontend test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `src/test-setup.js`

- [ ] **Step 1: Add devDependencies and a test script**

Edit `package.json`:

```json
{
  "name": "gunstyle",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "lucide-react": "^1.17.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-router-dom": "^7.17.0"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "jsdom": "^25.0.0",
    "vite": "^8.0.12",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create the vitest config**

Create `vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    globals: true,
  },
});
```

- [ ] **Step 3: Create the test setup file**

Create `src/test-setup.js`:

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Install**

Run: `npm install`
Expected: installs new devDependencies with no errors

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js src/test-setup.js
git commit -m "chore: add vitest and @testing-library/react test tooling"
```

---

## Task 7: Sizes utility (`src/utils/sizes.js`)

**Files:**
- Create: `src/utils/sizes.js`
- Test: `src/utils/sizes.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/sizes.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { ALL_SIZES, defaultSizes, toggleSize } from './sizes';

describe('defaultSizes', () => {
  it('enables every size in ALL_SIZES', () => {
    const sizes = defaultSizes();
    ALL_SIZES.forEach(size => expect(sizes[size]).toBe(true));
  });
});

describe('toggleSize', () => {
  it('flips the targeted size and leaves the rest untouched', () => {
    const sizes = defaultSizes();
    const next = toggleSize(sizes, 'M');
    expect(next.M).toBe(false);
    expect(next.S).toBe(true);
  });

  it('toggling twice returns to the original value', () => {
    const sizes = defaultSizes();
    const next = toggleSize(toggleSize(sizes, 'L'), 'L');
    expect(next.L).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/sizes.test.js`
Expected: FAIL with "Cannot find module './sizes'"

- [ ] **Step 3: Write the implementation**

Create `src/utils/sizes.js`:

```js
export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function defaultSizes() {
  return ALL_SIZES.reduce((acc, size) => ({ ...acc, [size]: true }), {});
}

export function toggleSize(sizes, size) {
  return { ...sizes, [size]: !sizes[size] };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/sizes.test.js`
Expected: PASS, 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/utils/sizes.js src/utils/sizes.test.js
git commit -m "feat: add sizes utility for product size toggles"
```

---

## Task 8: Admin auth utility (`src/utils/adminAuth.js`)

**Files:**
- Create: `src/utils/adminAuth.js`
- Test: `src/utils/adminAuth.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/adminAuth.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAdminToken, setAdminToken, clearAdminToken, authFetch } from './adminAuth';

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('token storage', () => {
  it('returns null when no token was set', () => {
    expect(getAdminToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    setAdminToken('abc-123');
    expect(getAdminToken()).toBe('abc-123');
  });

  it('clears the stored token', () => {
    setAdminToken('abc-123');
    clearAdminToken();
    expect(getAdminToken()).toBeNull();
  });
});

describe('authFetch', () => {
  it('adds an Authorization header with the stored token', async () => {
    setAdminToken('my-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await authFetch('/api/products', { method: 'POST' });

    expect(fetchMock).toHaveBeenCalledWith('/api/products', {
      method: 'POST',
      headers: { Authorization: 'Bearer my-token' },
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/adminAuth.test.js`
Expected: FAIL with "Cannot find module './adminAuth'"

- [ ] **Step 3: Write the implementation**

Create `src/utils/adminAuth.js`:

```js
const TOKEN_KEY = 'gunstyle_admin_token';

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function authFetch(url, options = {}) {
  const token = getAdminToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/adminAuth.test.js`
Expected: PASS, 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/utils/adminAuth.js src/utils/adminAuth.test.js
git commit -m "feat: add admin token storage and authFetch helper"
```

---

## Task 9: Product form hook (`src/hooks/useProductForm.js`)

**Files:**
- Create: `src/hooks/useProductForm.js`
- Test: `src/hooks/useProductForm.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useProductForm.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductForm } from './useProductForm';
import * as adminAuth from '../utils/adminAuth';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useProductForm', () => {
  it('starts empty with all sizes enabled when no initial product is given', () => {
    const { result } = renderHook(() => useProductForm());
    expect(result.current.name).toBe('');
    expect(result.current.images).toEqual([]);
    expect(result.current.sizes.M).toBe(true);
    expect(result.current.isValid).toBe(false);
  });

  it('prefills fields from an initial product', () => {
    const { result } = renderHook(() => useProductForm({
      name: 'Tee', category: 'T-Shirts', price: 20, description: 'd',
      images: ['/a.jpg'], catalogImage: '/a.jpg', sizes: { XS: false, S: true, M: true, L: true, XL: true, XXL: true },
    }));
    expect(result.current.name).toBe('Tee');
    expect(result.current.catalogImage).toBe('/a.jpg');
    expect(result.current.sizes.XS).toBe(false);
  });

  it('addImage appends the image and auto-selects it as catalogImage if none is set', () => {
    const { result } = renderHook(() => useProductForm());
    act(() => result.current.addImage('/first.jpg'));
    expect(result.current.images).toEqual(['/first.jpg']);
    expect(result.current.catalogImage).toBe('/first.jpg');

    act(() => result.current.addImage('/second.jpg'));
    expect(result.current.images).toEqual(['/first.jpg', '/second.jpg']);
    expect(result.current.catalogImage).toBe('/first.jpg');
  });

  it('selectCatalogImage changes which image is the catalog photo', () => {
    const { result } = renderHook(() => useProductForm());
    act(() => result.current.addImage('/a.jpg'));
    act(() => result.current.addImage('/b.jpg'));
    act(() => result.current.selectCatalogImage('/b.jpg'));
    expect(result.current.catalogImage).toBe('/b.jpg');
  });

  it('removeImage drops the image and clears catalogImage if it was selected', () => {
    const { result } = renderHook(() => useProductForm());
    act(() => result.current.addImage('/a.jpg'));
    act(() => result.current.removeImage('/a.jpg'));
    expect(result.current.images).toEqual([]);
    expect(result.current.catalogImage).toBe('');
  });

  it('toggleSize flips one size', () => {
    const { result } = renderHook(() => useProductForm());
    act(() => result.current.toggleSize('L'));
    expect(result.current.sizes.L).toBe(false);
  });

  it('isValid requires a name, a positive price, and at least one image', () => {
    const { result } = renderHook(() => useProductForm());
    expect(result.current.isValid).toBe(false);

    act(() => {
      result.current.setName('Tee');
      result.current.setPrice('10');
      result.current.addImage('/a.jpg');
    });
    expect(result.current.isValid).toBe(true);
  });

  it('save POSTs to /api/products when there is no productId', async () => {
    const fetchSpy = vi.spyOn(adminAuth, 'authFetch').mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    const { result } = renderHook(() => useProductForm());
    act(() => {
      result.current.setName('Tee');
      result.current.setPrice('10');
      result.current.addImage('/a.jpg');
    });

    await act(async () => result.current.save());

    expect(fetchSpy).toHaveBeenCalledWith('/api/products', expect.objectContaining({ method: 'POST' }));
  });

  it('save PUTs to /api/products/:id when a productId is given', async () => {
    const fetchSpy = vi.spyOn(adminAuth, 'authFetch').mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    const { result } = renderHook(() => useProductForm());
    act(() => {
      result.current.setName('Tee');
      result.current.setPrice('10');
      result.current.addImage('/a.jpg');
    });

    await act(async () => result.current.save('7'));

    expect(fetchSpy).toHaveBeenCalledWith('/api/products/7', expect.objectContaining({ method: 'PUT' }));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useProductForm.test.js`
Expected: FAIL with "Cannot find module './useProductForm'"

- [ ] **Step 3: Write the implementation**

Create `src/hooks/useProductForm.js`:

```js
import { useState } from 'react';
import { defaultSizes, toggleSize as toggleSizeValue } from '../utils/sizes';
import { authFetch } from '../utils/adminAuth';

export function useProductForm(initialProduct = null) {
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState(initialProduct?.category || 'T-Shirts');
  const [price, setPrice] = useState(initialProduct?.price ?? '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [images, setImages] = useState(initialProduct?.images || []);
  const [catalogImage, setCatalogImage] = useState(initialProduct?.catalogImage || '');
  const [sizes, setSizes] = useState(initialProduct?.sizes || defaultSizes());

  const addImage = (url) => {
    setImages(prev => [...prev, url]);
    setCatalogImage(prev => prev || url);
  };

  const removeImage = (url) => {
    setImages(prev => prev.filter(i => i !== url));
    setCatalogImage(prev => (prev === url ? '' : prev));
  };

  const selectCatalogImage = (url) => setCatalogImage(url);

  const toggleSize = (size) => setSizes(prev => toggleSizeValue(prev, size));

  const isValid = name.trim() !== '' && price !== '' && Number(price) > 0 && images.length > 0;

  const buildPayload = () => ({
    name,
    category,
    price: Number(price),
    description,
    images,
    catalogImage: catalogImage || images[0],
    sizes,
  });

  const save = async (productId) => {
    const payload = buildPayload();
    const url = productId ? `/api/products/${productId}` : '/api/products';
    const method = productId ? 'PUT' : 'POST';
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  return {
    name, setName,
    category, setCategory,
    price, setPrice,
    description, setDescription,
    images, addImage, removeImage,
    catalogImage, selectCatalogImage,
    sizes, toggleSize,
    isValid,
    save,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useProductForm.test.js`
Expected: PASS, 9 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useProductForm.js src/hooks/useProductForm.test.js
git commit -m "feat: add useProductForm hook for admin product create/edit"
```

---

## Task 10: Product gallery hook (`src/hooks/useProductGallery.js`)

**Files:**
- Create: `src/hooks/useProductGallery.js`
- Test: `src/hooks/useProductGallery.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useProductGallery.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductGallery } from './useProductGallery';

describe('useProductGallery', () => {
  it('starts at index 0', () => {
    const { result } = renderHook(() => useProductGallery(['/a.jpg', '/b.jpg']));
    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.selectedImage).toBe('/a.jpg');
    expect(result.current.total).toBe(2);
  });

  it('selectImage moves to a valid index', () => {
    const { result } = renderHook(() => useProductGallery(['/a.jpg', '/b.jpg']));
    act(() => result.current.selectImage(1));
    expect(result.current.selectedIndex).toBe(1);
    expect(result.current.selectedImage).toBe('/b.jpg');
  });

  it('selectImage ignores an out-of-range index', () => {
    const { result } = renderHook(() => useProductGallery(['/a.jpg', '/b.jpg']));
    act(() => result.current.selectImage(5));
    expect(result.current.selectedIndex).toBe(0);
  });

  it('selectedImage is null when there are no images', () => {
    const { result } = renderHook(() => useProductGallery([]));
    expect(result.current.selectedImage).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useProductGallery.test.js`
Expected: FAIL with "Cannot find module './useProductGallery'"

- [ ] **Step 3: Write the implementation**

Create `src/hooks/useProductGallery.js`:

```js
import { useState } from 'react';

export function useProductGallery(images = []) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = images[selectedIndex] || null;

  const selectImage = (index) => {
    if (index >= 0 && index < images.length) setSelectedIndex(index);
  };

  return { selectedIndex, selectedImage, selectImage, total: images.length };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useProductGallery.test.js`
Expected: PASS, 4 tests passed

- [ ] **Step 5: Run the full frontend test suite**

Run: `npm test`
Expected: PASS, all test files (sizes, adminAuth, useProductForm, useProductGallery) green

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useProductGallery.js src/hooks/useProductGallery.test.js
git commit -m "feat: add useProductGallery hook for product detail thumbnails"
```

---

## Task 11: Route guard (`src/components/RequireAdmin.jsx`)

**Files:**
- Create: `src/components/RequireAdmin.jsx`

No automated test for this component — it's a thin wiring component verified manually in Task 19.

- [ ] **Step 1: Create the component**

Create `src/components/RequireAdmin.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminToken, authFetch, clearAdminToken } from '../utils/adminAuth';

const RequireAdmin = ({ children }) => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    authFetch('/api/admin/verify')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('authenticated');
        } else {
          clearAdminToken();
          setStatus('unauthenticated');
        }
      })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  if (status === 'checking') {
    return <div style={{ color: 'var(--primary)', padding: '40px', textAlign: 'center' }}>Verificando sesión...</div>;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export default RequireAdmin;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RequireAdmin.jsx
git commit -m "feat: add RequireAdmin route guard"
```

---

## Task 12: Admin login page (`src/pages/AdminLogin.jsx`)

**Files:**
- Create: `src/pages/AdminLogin.jsx`

- [ ] **Step 1: Create the page**

Create `src/pages/AdminLogin.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdminToken, getAdminToken, authFetch } from '../utils/adminAuth';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    authFetch('/api/admin/verify')
      .then(res => res.json())
      .then(data => { if (data.success) navigate('/admin/dashboard'); })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          setAdminToken(data.token);
          navigate('/admin/dashboard');
        } else {
          setError(data.message || 'Contraseña incorrecta');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Error de conexión');
      });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '360px', padding: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>🔒 Admin GunStyle</h2>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none', marginBottom: '16px' }}
        />
        {error && <p style={{ color: '#ff4d4f', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AdminLogin.jsx
git commit -m "feat: add admin login page"
```

---

## Task 13: Admin dashboard page (`src/pages/AdminDashboard.jsx`)

**Files:**
- Create: `src/pages/AdminDashboard.jsx`

- [ ] **Step 1: Create the page**

Create `src/pages/AdminDashboard.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react';
import { authFetch, clearAdminToken } from '../utils/adminAuth';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const loadProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => { if (data.success) setProducts(data.data); });
  };

  useEffect(() => { loadProducts(); }, []);

  const handleDelete = (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    authFetch(`/api/products/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { if (data.success) loadProducts(); });
  };

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin');
  };

  return (
    <div style={{ padding: '24px 20px', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Admin · Productos</h1>
        <button onClick={handleLogout} className="btn-icon" title="Cerrar sesión"><LogOut size={18} /></button>
      </div>

      <button
        onClick={() => navigate('/admin/new')}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <Plus size={18} /> Nuevo producto
      </button>

      {products.map(product => (
        <div key={product.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '12px' }}>
          <img src={product.catalogImage} alt={product.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{product.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>${product.price.toFixed(2)} · {product.category}</div>
          </div>
          <button onClick={() => navigate(`/admin/edit/${product.id}`)} className="btn-icon" style={{ width: '36px', height: '36px' }}><Pencil size={16} /></button>
          <button onClick={() => handleDelete(product.id)} className="btn-icon" style={{ width: '36px', height: '36px', color: '#ff4d4f' }}><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AdminDashboard.jsx
git commit -m "feat: add admin product list dashboard"
```

---

## Task 14: Admin product form page (`src/pages/AdminProduct.jsx`)

**Files:**
- Create: `src/pages/AdminProduct.jsx`

- [ ] **Step 1: Create the page**

Create `src/pages/AdminProduct.jsx`:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProductForm } from '../hooks/useProductForm';
import { ALL_SIZES } from '../utils/sizes';
import { authFetch } from '../utils/adminAuth';

const CATEGORIES = ['T-Shirts', 'Hoodies', 'Accessories'];

const AdminProductForm = ({ initialProduct, productId }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const form = useProductForm(initialProduct);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    authFetch('/api/upload', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        setUploading(false);
        if (data.success) form.addImage(data.path);
      })
      .catch(() => setUploading(false));
    e.target.value = '';
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    form.addImage(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = () => {
    if (!form.isValid) {
      setError('Completá nombre, precio y al menos una foto.');
      return;
    }
    setSaving(true);
    setError('');
    form.save(productId)
      .then(data => {
        setSaving(false);
        if (data.success) navigate('/admin/dashboard');
        else setError(data.message || 'Error al guardar');
      })
      .catch(() => {
        setSaving(false);
        setError('Error de conexión');
      });
  };

  return (
    <div style={{ padding: '24px 20px', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="btn-icon" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={20} /></button>
        <h1 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>
          {productId ? 'Editar producto' : 'Nuevo producto'}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        <section>
          <div style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>📷 Fotos del producto</div>

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed var(--primary)', borderRadius: '12px', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '12px' }}
          >
            {uploading ? 'Subiendo...' : '+ Subir foto'}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} style={{ display: 'none' }} />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="O pegar URL de imagen"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={handleAddUrl} className="btn-primary" style={{ padding: '0 16px' }}>Agregar</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {form.images.map(img => (
              <div
                key={img}
                onClick={() => form.selectCatalogImage(img)}
                style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${form.catalogImage === img ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer', aspectRatio: '1/1' }}
              >
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {form.catalogImage === img && (
                  <span style={{ position: 'absolute', top: '4px', left: '4px', background: 'var(--primary)', color: 'white', fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>CATÁLOGO</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); form.removeImage(img); }}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}
                >✕</button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>📝 Información</div>

          <label style={{ display: 'block', marginBottom: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Nombre</div>
            <input type="text" value={form.name} onChange={e => form.setName(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
          </label>

          <label style={{ display: 'block', marginBottom: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Categoría</div>
            <select value={form.category} onChange={e => form.setCategory(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Precio (USD)</div>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => form.setPrice(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
          </label>

          <label style={{ display: 'block', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Descripción</div>
            <textarea value={form.description} onChange={e => form.setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
          </label>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px' }}>Talles disponibles</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ALL_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => form.toggleSize(size)}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-lg)', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    background: form.sizes[size] ? 'rgba(138,43,226,0.15)' : 'var(--bg-surface)',
                    color: form.sizes[size] ? 'var(--primary)' : 'var(--text-muted)',
                    border: `1px solid ${form.sizes[size] ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#ff4d4f', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 2, padding: '14px' }}>
              {saving ? 'Guardando...' : '💾 Guardar producto'}
            </button>
            <button onClick={() => navigate('/admin/dashboard')} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const AdminProduct = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [initialProduct, setInitialProduct] = useState(isEditing ? null : {});

  useEffect(() => {
    if (!isEditing) return;
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setInitialProduct(data.data); });
  }, [id, isEditing]);

  if (isEditing && !initialProduct) {
    return <div style={{ color: 'var(--primary)', padding: '40px', textAlign: 'center' }}>Cargando producto...</div>;
  }

  return <AdminProductForm initialProduct={initialProduct} productId={id} />;
};

export default AdminProduct;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AdminProduct.jsx
git commit -m "feat: add admin product create/edit page"
```

---

## Task 15: Product detail page (`src/pages/ProductDetail.jsx`)

**Files:**
- Create: `src/pages/ProductDetail.jsx`

- [ ] **Step 1: Create the page**

Create `src/pages/ProductDetail.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProductGallery } from '../hooks/useProductGallery';
import { ALL_SIZES } from '../utils/sizes';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setProduct(data.data); });
  }, [id]);

  const gallery = useProductGallery(product?.images || []);

  if (!product) {
    return <div style={{ color: 'var(--primary)', padding: '40px', textAlign: 'center' }}>Cargando producto...</div>;
  }

  return (
    <div style={{ paddingBottom: '120px' }}>
      <header style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 style={{ color: 'white', fontSize: '16px', fontWeight: 700, margin: 0 }}>{product.name}</h1>
      </header>

      <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', margin: '0 16px', background: 'rgba(0,0,0,0.2)' }}>
        <img src={gallery.selectedImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {gallery.total > 1 && (
          <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
            {gallery.selectedIndex + 1} / {gallery.total}
          </span>
        )}
      </div>

      {gallery.total > 1 && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto' }}>
          {product.images.map((img, i) => (
            <div
              key={img}
              onClick={() => gallery.selectImage(i)}
              style={{ width: '56px', height: '56px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', border: `2px solid ${i === gallery.selectedIndex ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer' }}
            >
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      <main className="page-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{product.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>{product.category}</p>
          </div>
          <span style={{ color: 'var(--primary)', fontSize: '22px', fontWeight: 800 }}>${product.price.toFixed(2)}</span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, margin: '12px 0 20px' }}>{product.description}</p>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Talle</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ALL_SIZES.map(size => {
              const enabled = Boolean(product.sizes?.[size]);
              return (
                <span
                  key={size}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-lg)', fontSize: '12px', fontWeight: 700,
                    background: enabled ? 'rgba(138,43,226,0.15)' : 'var(--bg-surface)',
                    color: enabled ? 'var(--primary)' : 'var(--text-muted)',
                    border: `1px solid ${enabled ? 'var(--primary)' : 'var(--border)'}`,
                    textDecoration: enabled ? 'none' : 'line-through',
                  }}
                >
                  {size}
                </span>
              );
            })}
          </div>
        </div>

        <button onClick={() => addToCart(product.id)} className="btn-primary" style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ShoppingCart size={18} /> Agregar al carrito
        </button>
      </main>
    </div>
  );
};

export default ProductDetail;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ProductDetail.jsx
git commit -m "feat: add customer-facing product detail page with photo gallery"
```

---

## Task 16: Update `ProductCard.jsx`

**Files:**
- Modify: `src/components/ProductCard.jsx`

- [ ] **Step 1: Make the card navigate to the detail page and use `catalogImage`**

In `src/components/ProductCard.jsx`, add the import and navigate call, and rename the image field:

```jsx
import React, { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <div
      className="glass-panel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/product/${product.id}`)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '12px',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        <img
          src={product.catalogImage}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
        />
```

Leave the rest of the file (heart button, NEW badge, price, add-to-cart button) unchanged — just make sure the add-to-cart button keeps `e.stopPropagation()` so it doesn't also trigger the card's navigate.

- [ ] **Step 2: Commit**

```bash
git add src/components/ProductCard.jsx
git commit -m "feat: navigate to product detail on card click, use catalogImage"
```

---

## Task 17: Update `Home.jsx` and `Cart.jsx` for the renamed image field

**Files:**
- Modify: `src/pages/Home.jsx:58`
- Modify: `src/pages/Cart.jsx:18`

- [ ] **Step 1: Update the featured product image in `Home.jsx`**

In `src/pages/Home.jsx`, change:

```jsx
<img src={featured.image} style={{ width: '100%', maxWidth: '280px', height: '100%', objectFit: 'cover', borderRadius: '16px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }} alt={featured.name} />
```

to:

```jsx
<img src={featured.catalogImage} style={{ width: '100%', maxWidth: '280px', height: '100%', objectFit: 'cover', borderRadius: '16px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }} alt={featured.name} />
```

- [ ] **Step 2: Update the cart item image in `Cart.jsx`**

In `src/pages/Cart.jsx`, change:

```jsx
<img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'lighten' }} />
```

to:

```jsx
<img src={item.catalogImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'lighten' }} />
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.jsx src/pages/Cart.jsx
git commit -m "fix: use catalogImage field after products schema change"
```

---

## Task 18: Wire up routes in `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the new imports and routes**

In `src/App.jsx`, add imports for the new pages and `RequireAdmin`:

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProduct from './pages/AdminProduct';
import RequireAdmin from './components/RequireAdmin';
import BottomNav from './components/BottomNav';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { Monitor, Smartphone, Tablet, Lightbulb, LightbulbOff } from 'lucide-react';
import './App.css';
```

Then change the `<Routes>` block:

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/catalog" element={<Catalog />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/product/:id" element={<ProductDetail />} />
  <Route path="/admin" element={<AdminLogin />} />
  <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
  <Route path="/admin/new" element={<RequireAdmin><AdminProduct /></RequireAdmin>} />
  <Route path="/admin/edit/:id" element={<RequireAdmin><AdminProduct /></RequireAdmin>} />
</Routes>
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire up product detail and admin routes"
```

---

## Task 19: Manual verification

**Files:** none — this is a QA pass, not a code change.

- [ ] **Step 1: Run both backend and frontend automated suites one more time**

Run: `cd server && npm test && cd .. && npm test`
Expected: all green

- [ ] **Step 2: Start the app**

Run: `start.bat` (or `cd server && node server.js` in one terminal, `npm run dev` in another)

- [ ] **Step 3: Verify the customer flow**

- Open `http://localhost:5173/catalog`, click a product card → lands on `/product/:id` with photo, price, description, sizes.
- Click a thumbnail (if the product has more than one photo) → main photo changes.
- Click "Agregar al carrito" → go to `/cart` → item appears with the correct photo.

- [ ] **Step 4: Verify the admin flow**

- Open `http://localhost:5173/admin`, try a wrong password → error shown.
- Log in with `gunstyle2023` (or your `ADMIN_PASSWORD`) → lands on `/admin/dashboard` with the product list.
- Click "Nuevo producto", upload a photo, set name/price/sizes, save → new product appears in the dashboard and in `/catalog`.
- Click "Editar" on a product, change the price, save → change reflected in catalog.
- Click "Eliminar" on a product → confirm → product disappears from dashboard and catalog.
- Reload the page after login → should stay on the dashboard (not bounced back to login) because the token is still valid in `sessionStorage`.
- Restart the backend (`Ctrl+C` then `node server.js` again) → products created/edited before the restart are still there (confirms `products.json` persistence).

- [ ] **Step 5: Report results to the user**

Summarize pass/fail for each check above before considering the feature done.
