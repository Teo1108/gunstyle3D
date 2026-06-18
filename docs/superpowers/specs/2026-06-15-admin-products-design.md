# Admin Panel & Product Detail — Design Spec
**Date:** 2026-06-15  
**Project:** GunStyle E-Commerce

---

## Overview

Add two new capabilities to GunStyle:
1. **Admin panel** (`/admin`) — página protegida con contraseña para crear y editar productos con múltiples fotos, talles y precios.
2. **Product detail page** (`/product/:id`) — página pública que muestra galería de fotos, info del producto y talles disponibles.

Los productos dejan de estar hardcodeados en `server.js` y pasan a un archivo `server/products.json` persistente.

---

## Architecture

### Data Layer
- **`server/products.json`**: fuente de verdad. Se crea automáticamente si no existe, migrando el array `productsDB` actual.
- Cada producto agrega campos nuevos: `images[]` (array de rutas), `catalogImage` (índice o ruta de la foto de catálogo), `sizes` (objeto con XS/S/M/L/XL/XXL habilitados).
- Las imágenes subidas se guardan en `public/images/uploads/` y se sirven en `/images/uploads/filename`.

### Nuevo schema de producto
```json
{
  "id": "1",
  "name": "Premium Black Tee",
  "category": "T-Shirts",
  "price": 45.00,
  "rating": 4.8,
  "isNew": true,
  "description": "A timeless black tee.",
  "images": ["/images/uploads/1-main.jpg", "/images/uploads/1-detail1.jpg"],
  "catalogImage": "/images/uploads/1-main.jpg",
  "sizes": { "XS": true, "S": true, "M": true, "L": false, "XL": true, "XXL": false }
}
```

### Backend (Express — `server/server.js`)
- Reemplaza array hardcodeado por lectura de `products.json` al arrancar.
- **`GET /api/products`** — sin cambios.
- **`GET /api/products/:id`** — nuevo, devuelve un producto completo con todas sus fotos.
- **`POST /api/products`** — crea producto nuevo, escribe al JSON.
- **`PUT /api/products/:id`** — edita producto existente, escribe al JSON.
- **`DELETE /api/products/:id`** — elimina producto, escribe al JSON.
- **`POST /api/upload`** — recibe archivo de imagen (`multipart/form-data`), lo guarda en `public/images/uploads/`, devuelve la ruta `/images/uploads/filename`.
- **`POST /api/admin/login`** — valida contraseña (variable de entorno `ADMIN_PASSWORD`, default `gunstyle2023`). Devuelve un token simple.
- **`GET /api/admin/verify`** — verifica token de sesión.

### Frontend (React/Vite)
Nuevas rutas en `App.jsx`:
- `/admin` → `AdminLogin.jsx` (si no hay sesión) o `AdminDashboard.jsx` (lista de productos si está autenticado)
- `/admin/new` → `AdminProduct.jsx` en modo creación
- `/admin/edit/:id` → `AdminProduct.jsx` en modo edición
- `/product/:id` → `ProductDetail.jsx`

---

## Components

### `AdminLogin.jsx`
- Formulario con campo contraseña y botón entrar.
- Guarda token en `sessionStorage`.
- Redirige a `/admin` tras login exitoso.

### `AdminDashboard.jsx`
- Lista de todos los productos con foto miniatura, nombre y precio.
- Botón "＋ Nuevo producto" → navega a `/admin/new`.
- Botón "Editar" por producto → navega a `/admin/edit/:id`.
- Botón "Eliminar" por producto → confirm dialog → `DELETE /api/products/:id`.

### `AdminProduct.jsx`
**Panel izquierdo — Fotos:**
- Zona de drag & drop + selector de archivo.
- Campo de URL para pegar link externo.
- Grid de miniaturas de las fotos subidas.
- Click en miniatura → la marca como foto de CATÁLOGO (badge morado).
- Botón ✕ en cada miniatura para eliminarla.

**Panel derecho — Info:**
- Campo: Nombre
- Selector: Categoría (T-Shirts / Hoodies / Accessories)
- Campo: Precio (USD)
- Textarea: Descripción
- Toggle de talles: XS / S / M / L / XL / XXL (click para activar/desactivar)
- Botón "Guardar producto" → POST o PUT según modo.
- Botón "Cancelar" → vuelve a `/admin` (lista).

### `ProductDetail.jsx`
- Foto principal grande (la `catalogImage`).
- Contador "1 / N" sobre la foto.
- Fila de miniaturas debajo; click cambia la foto principal.
- Nombre, categoría, precio.
- Descripción.
- Grid de talles: habilitados en morado, deshabilitados tachados en gris.
- Botón "Agregar al carrito".
- Botón "← Volver" al catálogo.

### `ProductCard.jsx` (modificación)
- El click en la card navega a `/product/:id`.

---

## Auth Flow

- Contraseña configurada como variable de entorno `ADMIN_PASSWORD` (default `gunstyle2023`).
- Al hacer login, el servidor devuelve un token UUID simple (sin JWT).
- Token se guarda en `sessionStorage` del navegador.
- Cada request al admin incluye header `Authorization: Bearer <token>`.
- Si el token es inválido → redirect a `/admin` (login).
- No hay sistema de usuarios ni roles — una sola contraseña de admin.

---

## File Upload Flow

1. Usuario arrastra/selecciona archivo o pega URL.
2. **Si es archivo:** `POST /api/upload` con `multipart/form-data` → servidor guarda en `public/images/uploads/` con nombre único (timestamp + nombre original) → devuelve ruta.
3. **Si es URL:** se guarda directamente como string en el array `images[]`.
4. La miniatura aparece en el grid inmediatamente.
5. Al guardar el producto, el array `images[]` y `catalogImage` se persisten en `products.json`.

**Dependencia nueva en servidor:** `multer` (para file uploads).

---

## Migration

Al arrancar el servidor por primera vez con este código:
- Si `products.json` no existe → lo crea con los 12 productos del array actual, agregando `images`, `catalogImage` y `sizes` con defaults razonables.
- Si ya existe → lo usa tal cual.

---

## Out of Scope

- Autenticación con múltiples usuarios o roles.
- Edición de categorías (son fijas: T-Shirts, Hoodies, Accessories).
- Compresión o redimensionado de imágenes.
- Soft-delete / papelera de reciclaje.
