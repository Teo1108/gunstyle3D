---
name: vercel-supabase-migration
description: Migration from Express + products.json to Vercel (Next.js) + Supabase, enabling production deployment with persistent data
metadata:
  type: project
---

# GunStyle — Migración Vercel + Supabase

## Objetivo

Eliminar la dependencia del servidor Express local para que la app funcione completamente en Vercel free tier, con datos persistentes en Supabase PostgreSQL.

## Arquitectura resultado

```
Browser
  └── Next.js (Vercel)
        ├── /app/*           → páginas React (sin cambios de UX)
        ├── /api/products    → Supabase SDK (CRUD directo)
        ├── /api/admin/*     → JWT stateless
        └── /api/*           → stubs para rutas no terminadas

Supabase
  ├── PostgreSQL → tabla products
  └── (Storage no requerido — imágenes por URL)

Express server (server/)
  └── Solo para desarrollo local, no se despliega
```

## Base de datos

### Tabla `products`

```sql
CREATE TABLE products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category      text NOT NULL,
  price         numeric NOT NULL,
  rating        numeric DEFAULT 5.0,
  is_new        boolean DEFAULT true,
  description   text,
  images        text[],
  catalog_image text,
  sizes         jsonb,
  created_at    timestamptz DEFAULT now()
);
```

### Seed

Script de seed que lee `server/products.json` y hace un upsert en Supabase al hacer el primer deploy. Se corre una sola vez con `node scripts/seed.js`.

Las imágenes existentes (`/images/1.jpg`, etc.) son URLs relativas que Vercel sirve como archivos estáticos desde `public/images/` — no cambian.

## Autenticación

**Mecanismo:** JWT stateless firmado con `ADMIN_JWT_SECRET`.

- `POST /api/admin/login`
  - Recibe `{ password }`
  - Compara con `ADMIN_PASSWORD` (env var)
  - Si coincide, devuelve JWT firmado con 24h de expiración
  - Error 401 si no coincide

- `POST /api/admin/verify`
  - Recibe el JWT en header `Authorization: Bearer <token>`
  - Verifica firma y expiración
  - 200 si válido, 401 si no

- **Middleware de Next.js** (`middleware.ts`): protege `/admin/*` y `/api/products` (métodos POST/PUT/DELETE). Redirige a `/admin` si el JWT no es válido.

**Variables de entorno requeridas:**
```
ADMIN_PASSWORD=<contraseña del admin>
ADMIN_JWT_SECRET=<string aleatorio largo>
NEXT_PUBLIC_SUPABASE_URL=<url del proyecto Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

## API Routes

| Route | Método | Auth | Descripción |
|-------|--------|------|-------------|
| `/api/products` | GET | No | Lista todos los productos desde Supabase |
| `/api/products` | POST | JWT | Crea producto en Supabase |
| `/api/products/[id]` | GET | No | Obtiene producto por id |
| `/api/products/[id]` | PUT | JWT | Actualiza producto |
| `/api/products/[id]` | DELETE | JWT | Elimina producto |
| `/api/admin/login` | POST | No | Devuelve JWT si password correcto |
| `/api/admin/verify` | POST | JWT | Verifica JWT |
| `/api/cart` | — | — | **Eliminada** |
| `/api/cart/[productId]` | — | — | **Eliminada** |
| `/api/upload` | — | — | **Eliminada** |
| `/api/checkout` | POST | No | Stub (200 + mensaje) |
| `/api/discounts/validate` | POST | No | Stub (200 + mensaje) |
| `/api/preferences` | GET/POST | No | Stub (200 + mensaje) |

## Carrito

`CartContext` migrado a localStorage:

- Estado inicial: leer de `localStorage.getItem('gs_cart')`
- Cada cambio: escribir en `localStorage.setItem('gs_cart', ...)`
- API: mantiene la misma interfaz que consume el resto de la app (`addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `cartItems`, `total`)
- El carrito persiste entre sesiones en el mismo navegador

## Imágenes de nuevos productos

El campo `images` del formulario admin acepta URLs (texto). El admin pega la URL de la imagen (Imgur, Google Drive público, etc.). No hay upload desde el admin en producción.

Las imágenes actuales en `public/images/` siguen siendo servidas por Vercel como archivos estáticos.

## Servidor Express

El directorio `server/` se mantiene en el repositorio para desarrollo local. No se despliega a Vercel. Se agrega `.vercelignore` para excluirlo del bundle.

Para desarrollo local: `npm run dev:server` levanta el Express en `:3001`, las API routes de Next.js en dev mode pueden apuntar a él si `NEXT_PUBLIC_USE_LOCAL=true`.

## Scope fuera de este plan

- Checkout real (pago)
- Sistema de descuentos
- Preferencias de usuario
- Auth de usuarios (solo admin)
- Supabase Storage (no requerido — URLs manuales)
