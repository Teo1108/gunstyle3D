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
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.catalogImage || product.image,
      quantity: cartItem.quantity,
      size: cartItem.size
    };
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
  const { productId, quantity, size } = req.body;
  const existing = globalCart.find(item => item.productId === productId && item.size === size);
  if (existing) {
    if (quantity <= 0) {
      globalCart = globalCart.filter(item => !(item.productId === productId && item.size === size));
    } else {
      existing.quantity = quantity;
    }
  } else if (quantity > 0) {
    globalCart.push({ productId, quantity, size });
  }
  res.json({ success: true, data: globalCart });
});

app.delete('/api/cart/:productId', (req, res) => {
  const { productId } = req.params;
  const size = req.query.size;
  if (size) {
    globalCart = globalCart.filter(item => !(item.productId === productId && item.size === size));
  } else {
    globalCart = globalCart.filter(item => item.productId !== productId);
  }
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
