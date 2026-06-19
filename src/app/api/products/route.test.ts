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
