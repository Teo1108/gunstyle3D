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
