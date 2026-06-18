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
