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
