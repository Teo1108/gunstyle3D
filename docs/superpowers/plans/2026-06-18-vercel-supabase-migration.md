# GunStyle — Vercel + Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Express + products.json backend with Supabase PostgreSQL and stateless JWT auth so the app deploys fully on Vercel free tier.

**Architecture:** Next.js API routes call the Supabase JS SDK directly instead of proxying to a local Express server. Products are stored in a Supabase PostgreSQL table. Auth uses stateless JWTs signed with an env var secret. The cart moves to localStorage on the client.

**Tech Stack:** Next.js 15, TypeScript, `@supabase/supabase-js`, `jose` (JWT), Vitest

## Global Constraints

- All API responses: `{ success: boolean, data?: any, message?: string }`
- Product shape used by the frontend (`Product` type in `src/lib/products.ts`): camelCase — `isNew`, `catalogImage`. API routes must map Supabase snake_case to camelCase before returning.
- Admin token stored in `sessionStorage` key `gunstyle_admin_token` AND cookie `gs_admin_token` (cookie needed for middleware)
- Cart items in `localStorage` key `gs_cart`
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never prefix with `NEXT_PUBLIC_`
- Never commit `.env.local`

---

## File Map

**New:**
- `src/lib/supabase.ts` — Supabase client factory
- `src/lib/jwt.ts` — `signToken` / `verifyToken` helpers
- `middleware.ts` — JWT guard for `/admin/dashboard`, `/admin/new`, `/admin/edit`
- `scripts/seed.js` — one-time seed from `server/products.json`

**Rewritten:**
- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/api/admin/login/route.ts`
- `src/app/api/admin/verify/route.ts`
- `src/context/CartContext.tsx`
- `src/utils/adminAuth.ts` (add cookie support)

**Deleted:**
- `src/app/api/cart/route.ts`
- `src/app/api/cart/[productId]/route.ts`
- `src/app/api/upload/route.ts`

**Stubbed (replace body only):**
- `src/app/api/checkout/route.ts`
- `src/app/api/discounts/validate/route.ts`
- `src/app/api/preferences/route.ts`

**New config:**
- `.vercelignore`

---

### Task 1: Supabase project + client setup

**Files:**
- Create: `src/lib/supabase.ts`

**Interfaces:**
- Produces: `supabaseBrowser(): SupabaseClient` (anon key, safe in client), `supabaseServer(): SupabaseClient` (service role, server-only)

- [ ] **Step 1: Create a Supabase project**

  Go to [supabase.com](https://supabase.com) → New project. Once ready, go to
  **Project Settings → API** and copy:
  - Project URL (e.g. `https://abcxyz.supabase.co`)
  - `anon` public key
  - `service_role` secret key

- [ ] **Step 2: Create the products table in Supabase**

  Go to **SQL Editor** and run:

  ```sql
  -- Use text id to keep existing numeric ids ("1", "2", ...)
  CREATE TABLE products (
    id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name          text NOT NULL,
    category      text NOT NULL,
    price         numeric NOT NULL,
    rating        numeric DEFAULT 5.0,
    is_new        boolean DEFAULT true,
    description   text DEFAULT '',
    images        text[] DEFAULT '{}',
    catalog_image text DEFAULT '',
    sizes         jsonb DEFAULT '{"XS":true,"S":true,"M":true,"L":true,"XL":true,"XXL":true}',
    created_at    timestamptz DEFAULT now()
  );

  -- Public can read; writes go through service role key in API routes
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "public read" ON products FOR SELECT USING (true);
  ```

- [ ] **Step 3: Install dependencies**

  ```bash
  npm install @supabase/supabase-js jose
  ```

  Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 4: Create `.env.local`**

  ```
  NEXT_PUBLIC_SUPABASE_URL=https://abcxyz.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  ADMIN_PASSWORD=gunstyle2023
  ADMIN_JWT_SECRET=replace-with-at-least-32-random-chars-here
  ```

  Verify `.gitignore` already ignores `.env*` (it does).

- [ ] **Step 5: Write `src/lib/supabase.ts`**

  ```typescript
  import { createClient } from '@supabase/supabase-js';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  export function supabaseBrowser() {
    return createClient(url, anon);
  }

  export function supabaseServer() {
    return createClient(url, serviceRole, {
      auth: { persistSession: false },
    });
  }
  ```

- [ ] **Step 6: Verify TypeScript**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors in `src/lib/supabase.ts`.

- [ ] **Step 7: Commit**

  ```bash
  git add src/lib/supabase.ts package.json package-lock.json
  git commit -m "feat: Supabase client + install jose"
  ```

---

### Task 2: Seed products to Supabase

**Files:**
- Create: `scripts/seed.js`

**Interfaces:**
- Consumes: `server/products.json`, env vars from `.env.local`
- Produces: rows in the `products` table

- [ ] **Step 1: Write `scripts/seed.js`**

  ```javascript
  // Run once: node scripts/seed.js
  require('dotenv').config({ path: '.env.local' });
  const { createClient } = require('@supabase/supabase-js');
  const products = require('../server/products.json');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  async function seed() {
    const rows = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      rating: p.rating,
      is_new: p.isNew,
      description: p.description || '',
      images: p.images || [],
      catalog_image: p.catalogImage || (p.images && p.images[0]) || '',
      sizes: p.sizes || {},
    }));

    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' });

    if (error) { console.error('Seed failed:', error.message); process.exit(1); }
    console.log(`Seeded ${rows.length} products.`);
  }

  seed();
  ```

- [ ] **Step 2: Run the seed**

  ```bash
  node scripts/seed.js
  ```

  Expected: `Seeded 12 products.`

- [ ] **Step 3: Verify in Supabase**

  Go to **Table Editor → products**. Should see 12 rows.

- [ ] **Step 4: Commit**

  ```bash
  git add scripts/seed.js
  git commit -m "feat: seed script for products table"
  ```

---

### Task 3: Products GET routes

**Files:**
- Modify: `src/app/api/products/route.ts`
- Modify: `src/app/api/products/[id]/route.ts`
- Create: `src/app/api/products/route.test.ts`

**Interfaces:**
- Consumes: `supabaseServer()` from `src/lib/supabase.ts`
- Produces:
  - `GET /api/products` → `{ success: true, data: Product[] }` (camelCase)
  - `GET /api/products/[id]` → `{ success: true, data: Product }` or `{ success: false, message: 'Not found' }` 404

The `mapProduct` helper (used in both route files) converts Supabase rows to the frontend `Product` shape:

```typescript
function mapProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    rating: row.rating,
    isNew: row.is_new,
    description: row.description,
    images: row.images ?? [],
    catalogImage: row.catalog_image,
    sizes: row.sizes ?? {},
  };
}
```

- [ ] **Step 1: Write the failing test**

  Create `src/app/api/products/route.test.ts`:

  ```typescript
  import { describe, it, expect, vi } from 'vitest';

  vi.mock('@/lib/supabase', () => ({
    supabaseServer: () => ({
      from: () => ({
        select: () => Promise.resolve({
          data: [{ id: '1', name: 'Test Tee', category: 'T-Shirts', price: 45,
                   rating: 4.8, is_new: true, description: '', images: [], catalog_image: '', sizes: {} }],
          error: null,
        }),
      }),
    }),
  }));

  describe('GET /api/products', () => {
    it('returns camelCase product list', async () => {
      const { GET } = await import('./route');
      const res = await GET();
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data[0].isNew).toBe(true);
      expect(body.data[0].is_new).toBeUndefined();
    });
  });
  ```

- [ ] **Step 2: Run — expect FAIL**

  ```bash
  npx vitest run src/app/api/products/route.test.ts
  ```

  Expected: FAIL — current route proxies to localhost.

- [ ] **Step 3: Rewrite `src/app/api/products/route.ts`**

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { supabaseServer } from '@/lib/supabase';

  function mapProduct(row: any) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      price: row.price,
      rating: row.rating,
      isNew: row.is_new,
      description: row.description,
      images: row.images ?? [],
      catalogImage: row.catalog_image,
      sizes: row.sizes ?? {},
    };
  }

  export async function GET() {
    const { data, error } = await supabaseServer().from('products').select('*');
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data.map(mapProduct) });
  }

  export async function POST(request: NextRequest) {
    // Auth + implementation in Task 5
    return NextResponse.json({ success: false, message: 'Not implemented' }, { status: 501 });
  }
  ```

- [ ] **Step 4: Run — expect PASS**

  ```bash
  npx vitest run src/app/api/products/route.test.ts
  ```

- [ ] **Step 5: Rewrite `src/app/api/products/[id]/route.ts`**

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { supabaseServer } from '@/lib/supabase';

  type Params = { params: Promise<{ id: string }> };

  function mapProduct(row: any) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      price: row.price,
      rating: row.rating,
      isNew: row.is_new,
      description: row.description,
      images: row.images ?? [],
      catalogImage: row.catalog_image,
      sizes: row.sizes ?? {},
    };
  }

  export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const { data, error } = await supabaseServer()
      .from('products').select('*').eq('id', id).single();
    if (error || !data)
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: mapProduct(data) });
  }

  export async function PUT(_req: NextRequest, { params }: Params) {
    return NextResponse.json({ success: false, message: 'Not implemented' }, { status: 501 });
  }

  export async function DELETE(_req: NextRequest, { params }: Params) {
    return NextResponse.json({ success: false, message: 'Not implemented' }, { status: 501 });
  }
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/api/products/route.ts src/app/api/products/[id]/route.ts src/app/api/products/route.test.ts
  git commit -m "feat: products GET routes via Supabase"
  ```

---

### Task 4: JWT auth routes

**Files:**
- Create: `src/lib/jwt.ts`
- Modify: `src/app/api/admin/login/route.ts`
- Modify: `src/app/api/admin/verify/route.ts`
- Create: `src/app/api/admin/login/route.test.ts`

**Interfaces:**
- Produces:
  - `signToken(): Promise<string>` — JWT signed with `ADMIN_JWT_SECRET`, 24h expiry
  - `verifyToken(token: string): Promise<boolean>`
  - `POST /api/admin/login` `{ password }` → `{ success: true, token }` or 401
  - `POST /api/admin/verify` `Authorization: Bearer <token>` → `{ success: true }` or 401

- [ ] **Step 1: Write `src/lib/jwt.ts`**

  ```typescript
  import { SignJWT, jwtVerify } from 'jose';

  const secret = () => new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

  export async function signToken(): Promise<string> {
    return new SignJWT({ admin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret());
  }

  export async function verifyToken(token: string): Promise<boolean> {
    if (!token) return false;
    try {
      await jwtVerify(token, secret());
      return true;
    } catch {
      return false;
    }
  }
  ```

- [ ] **Step 2: Write failing test**

  Create `src/app/api/admin/login/route.test.ts`:

  ```typescript
  import { describe, it, expect } from 'vitest';

  process.env.ADMIN_PASSWORD = 'testpass';
  process.env.ADMIN_JWT_SECRET = 'test-secret-at-least-32-chars-longXXXX';

  describe('POST /api/admin/login', () => {
    it('returns JWT on correct password', async () => {
      const { POST } = await import('./route');
      const req = new Request('http://localhost/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'testpass' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as any);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(typeof body.token).toBe('string');
      expect(body.token.split('.').length).toBe(3); // valid JWT format
    });

    it('returns 401 on wrong password', async () => {
      const { POST } = await import('./route');
      const req = new Request('http://localhost/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'wrong' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req as any);
      expect(res.status).toBe(401);
    });
  });
  ```

- [ ] **Step 3: Run — expect FAIL**

  ```bash
  npx vitest run src/app/api/admin/login/route.test.ts
  ```

- [ ] **Step 4: Rewrite `src/app/api/admin/login/route.ts`**

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { signToken } from '@/lib/jwt';

  export async function POST(request: NextRequest) {
    const { password } = await request.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
    }
    const token = await signToken();
    return NextResponse.json({ success: true, token });
  }
  ```

- [ ] **Step 5: Rewrite `src/app/api/admin/verify/route.ts`**

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { verifyToken } from '@/lib/jwt';

  export async function POST(request: NextRequest) {
    const auth = request.headers.get('authorization') ?? '';
    const token = auth.replace('Bearer ', '');
    const valid = await verifyToken(token);
    if (!valid)
      return NextResponse.json({ success: false, message: 'Token inválido' }, { status: 401 });
    return NextResponse.json({ success: true });
  }
  ```

- [ ] **Step 6: Run tests — expect PASS**

  ```bash
  npx vitest run src/app/api/admin/login/route.test.ts
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add src/lib/jwt.ts src/app/api/admin/login/route.ts src/app/api/admin/verify/route.ts src/app/api/admin/login/route.test.ts
  git commit -m "feat: stateless JWT auth routes"
  ```

---

### Task 5: Products write routes (POST / PUT / DELETE)

**Files:**
- Modify: `src/app/api/products/route.ts` (complete the POST stub)
- Modify: `src/app/api/products/[id]/route.ts` (complete PUT + DELETE stubs)

**Interfaces:**
- Consumes: `verifyToken()` from `src/lib/jwt.ts`, `supabaseServer()` from `src/lib/supabase.ts`
- Produces:
  - `POST /api/products` (JWT required) → `{ success: true, data: Product }` 201 or 401/500
  - `PUT /api/products/[id]` (JWT required) → `{ success: true, data: Product }` or 401/404
  - `DELETE /api/products/[id]` (JWT required) → `{ success: true }` or 401/500

- [ ] **Step 1: Complete `src/app/api/products/route.ts`**

  Replace the whole file:

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { supabaseServer } from '@/lib/supabase';
  import { verifyToken } from '@/lib/jwt';

  function mapProduct(row: any) {
    return {
      id: row.id, name: row.name, category: row.category, price: row.price,
      rating: row.rating, isNew: row.is_new, description: row.description,
      images: row.images ?? [], catalogImage: row.catalog_image, sizes: row.sizes ?? {},
    };
  }

  async function requireAuth(request: NextRequest): Promise<boolean> {
    const token = (request.headers.get('authorization') ?? '').replace('Bearer ', '');
    return verifyToken(token);
  }

  export async function GET() {
    const { data, error } = await supabaseServer().from('products').select('*');
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data.map(mapProduct) });
  }

  export async function POST(request: NextRequest) {
    if (!(await requireAuth(request)))
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { data, error } = await supabaseServer()
      .from('products')
      .insert({
        name: body.name,
        category: body.category,
        price: body.price,
        rating: body.rating ?? 5.0,
        is_new: body.isNew ?? true,
        description: body.description ?? '',
        images: body.images ?? [],
        catalog_image: body.catalogImage ?? body.images?.[0] ?? '',
        sizes: body.sizes ?? { XS: true, S: true, M: true, L: true, XL: true, XXL: true },
      })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: mapProduct(data) }, { status: 201 });
  }
  ```

- [ ] **Step 2: Complete `src/app/api/products/[id]/route.ts`**

  Replace the whole file:

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { supabaseServer } from '@/lib/supabase';
  import { verifyToken } from '@/lib/jwt';

  type Params = { params: Promise<{ id: string }> };

  function mapProduct(row: any) {
    return {
      id: row.id, name: row.name, category: row.category, price: row.price,
      rating: row.rating, isNew: row.is_new, description: row.description,
      images: row.images ?? [], catalogImage: row.catalog_image, sizes: row.sizes ?? {},
    };
  }

  async function requireAuth(request: NextRequest): Promise<boolean> {
    const token = (request.headers.get('authorization') ?? '').replace('Bearer ', '');
    return verifyToken(token);
  }

  export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const { data, error } = await supabaseServer()
      .from('products').select('*').eq('id', id).single();
    if (error || !data)
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: mapProduct(data) });
  }

  export async function PUT(request: NextRequest, { params }: Params) {
    if (!(await requireAuth(request)))
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabaseServer()
      .from('products')
      .update({
        name: body.name,
        category: body.category,
        price: body.price,
        rating: body.rating,
        is_new: body.isNew,
        description: body.description,
        images: body.images,
        catalog_image: body.catalogImage,
        sizes: body.sizes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data)
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: mapProduct(data) });
  }

  export async function DELETE(request: NextRequest, { params }: Params) {
    if (!(await requireAuth(request)))
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseServer().from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  ```

- [ ] **Step 3: Re-run GET tests**

  ```bash
  npx vitest run src/app/api/products/route.test.ts
  ```

  Expected: still PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/api/products/route.ts src/app/api/products/[id]/route.ts
  git commit -m "feat: products write routes (POST/PUT/DELETE) with JWT auth"
  ```

---

### Task 6: Admin auth — add cookie + middleware

**Files:**
- Modify: `src/utils/adminAuth.ts` (also write token to cookie for middleware)
- Create: `middleware.ts` (root of repo, next to `src/`)

**Interfaces:**
- Consumes: `verifyToken()` from `src/lib/jwt.ts`
- Produces: redirect to `/admin` if no valid JWT on protected admin pages

- [ ] **Step 1: Update `src/utils/adminAuth.ts`**

  Replace the whole file:

  ```typescript
  const TOKEN_KEY = 'gunstyle_admin_token';
  const COOKIE_NAME = 'gs_admin_token';

  export function getAdminToken() {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(TOKEN_KEY);
  }

  export function setAdminToken(token: string) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(TOKEN_KEY, token);
    // Cookie is read by Next.js middleware (sessionStorage is not accessible server-side)
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=86400; SameSite=Strict`;
  }

  export function clearAdminToken() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(TOKEN_KEY);
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  }

  export function authFetch(url: string, options: RequestInit = {}) {
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

- [ ] **Step 2: Create `middleware.ts`**

  Create this file at the repo root (same level as `src/`, `package.json`):

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { verifyToken } from '@/lib/jwt';

  const PROTECTED = ['/admin/dashboard', '/admin/new', '/admin/edit'];

  export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (!PROTECTED.some(p => pathname.startsWith(p))) return NextResponse.next();

    const token = request.cookies.get('gs_admin_token')?.value ?? '';
    const valid = await verifyToken(token);
    if (!valid) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  export const config = {
    matcher: ['/admin/:path*'],
  };
  ```

- [ ] **Step 3: Verify TypeScript**

  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add middleware.ts src/utils/adminAuth.ts
  git commit -m "feat: middleware for admin route protection, cookie auth"
  ```

---

### Task 7: CartContext — migrate to localStorage

**Files:**
- Modify: `src/context/CartContext.tsx`
- Delete: `src/app/api/cart/route.ts`
- Delete: `src/app/api/cart/[productId]/route.ts`

**Interfaces:**
- Maintains exact `CartContextValue` type: `{ cart: CartItem[], loading: boolean, addToCart, updateCart, removeCartItem, fetchCart }`
- `CartItem = { productId: string; quantity: number; size?: string }`

- [ ] **Step 1: Rewrite `src/context/CartContext.tsx`**

  ```typescript
  "use client";
  import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

  type CartItem = { productId: string; quantity: number; size?: string };

  type CartContextValue = {
    cart: CartItem[];
    loading: boolean;
    addToCart: (productId: string, size?: string) => void;
    updateCart: (productId: string, quantity: number, size?: string) => void;
    removeCartItem: (productId: string, size?: string) => void;
    fetchCart: () => void;
  };

  const STORAGE_KEY = 'gs_cart';
  const CartContext = createContext<CartContextValue | null>(null);

  function readStorage(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
    catch { return []; }
  }

  function writeStorage(items: CartItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCart = useCallback(() => {
      setCart(readStorage());
      setLoading(false);
    }, []);

    useEffect(() => { fetchCart(); }, [fetchCart]);

    const updateCart = useCallback((productId: string, quantity: number, size?: string) => {
      setCart(prev => {
        const next = [...prev];
        const idx = next.findIndex(i => i.productId === productId && i.size === size);
        if (idx >= 0) {
          if (quantity <= 0) next.splice(idx, 1);
          else next[idx] = { ...next[idx], quantity };
        } else if (quantity > 0) {
          next.push({ productId, quantity, size });
        }
        writeStorage(next);
        return next;
      });
    }, []);

    const addToCart = useCallback((productId: string, size?: string) => {
      setCart(prev => {
        const existing = prev.find(i => i.productId === productId && i.size === size);
        const next = existing
          ? prev.map(i => i.productId === productId && i.size === size
              ? { ...i, quantity: i.quantity + 1 } : i)
          : [...prev, { productId, quantity: 1, size }];
        writeStorage(next);
        return next;
      });
    }, []);

    const removeCartItem = useCallback((productId: string, size?: string) => {
      setCart(prev => {
        const next = prev.filter(i => !(i.productId === productId && i.size === size));
        writeStorage(next);
        return next;
      });
    }, []);

    return (
      <CartContext.Provider value={{ cart, loading, addToCart, updateCart, removeCartItem, fetchCart }}>
        {children}
      </CartContext.Provider>
    );
  }

  export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
  }
  ```

- [ ] **Step 2: Delete the server cart routes**

  ```bash
  git rm src/app/api/cart/route.ts "src/app/api/cart/[productId]/route.ts"
  ```

- [ ] **Step 3: Verify TypeScript**

  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/context/CartContext.tsx
  git commit -m "feat: cart migrated to localStorage, remove server cart routes"
  ```

---

### Task 8: Stub unfinished routes + cleanup

**Files:**
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/app/api/discounts/validate/route.ts`
- Modify: `src/app/api/preferences/route.ts`
- Delete: `src/app/api/upload/route.ts`
- Create: `.vercelignore`

- [ ] **Step 1: Replace `src/app/api/checkout/route.ts`**

  ```typescript
  import { NextResponse } from 'next/server';
  export async function POST() {
    return NextResponse.json({ success: false, message: 'Checkout no implementado aún' }, { status: 501 });
  }
  ```

- [ ] **Step 2: Replace `src/app/api/discounts/validate/route.ts`**

  ```typescript
  import { NextResponse } from 'next/server';
  export async function POST() {
    return NextResponse.json({ success: false, message: 'Descuentos no implementados aún' }, { status: 501 });
  }
  ```

- [ ] **Step 3: Replace `src/app/api/preferences/route.ts`**

  ```typescript
  import { NextResponse } from 'next/server';
  export async function GET() {
    return NextResponse.json({ success: true, data: {} });
  }
  export async function POST() {
    return NextResponse.json({ success: true });
  }
  ```

- [ ] **Step 4: Delete upload route**

  ```bash
  git rm src/app/api/upload/route.ts
  ```

- [ ] **Step 5: Create `.vercelignore`**

  ```
  server/
  scripts/
  docs/
  ```

- [ ] **Step 6: Verify TypeScript**

  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add src/app/api/checkout/route.ts src/app/api/discounts/validate/route.ts src/app/api/preferences/route.ts .vercelignore
  git commit -m "chore: stub unfinished routes, add .vercelignore, remove upload route"
  ```

---

### Task 9: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

  ```bash
  git push origin master
  ```

- [ ] **Step 2: Create Vercel project**

  1. Go to [vercel.com](https://vercel.com) → **Add New Project**
  2. Import **Teo1108/gunstyle3D** from GitHub
  3. Framework Preset: **Next.js** (auto-detected)
  4. Root directory: leave as `/`
  5. Click **Deploy** — the first build may fail because env vars are missing; that's expected

- [ ] **Step 3: Add environment variables in Vercel**

  Project → **Settings → Environment Variables**, add all five:

  ```
  NEXT_PUBLIC_SUPABASE_URL       → https://abcxyz.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY  → eyJ...
  SUPABASE_SERVICE_ROLE_KEY      → eyJ...
  ADMIN_PASSWORD                 → gunstyle2023
  ADMIN_JWT_SECRET               → (same value as .env.local)
  ```

- [ ] **Step 4: Redeploy**

  In Vercel → Deployments → **Redeploy** the latest deployment (or push an empty commit to trigger).

  ```bash
  git commit --allow-empty -m "chore: trigger Vercel redeploy"
  git push origin master
  ```

- [ ] **Step 5: Smoke test**

  - `GET https://your-app.vercel.app/api/products` → JSON with 12 products, `isNew` field present
  - Open `/catalog` → products load from Supabase
  - Open `/admin` → login with `ADMIN_PASSWORD` → redirects to `/admin/dashboard`
  - Add item to cart → reload page → cart still has the item (localStorage)
  - Navigate to `/admin/dashboard` without being logged in → redirected to `/admin`
