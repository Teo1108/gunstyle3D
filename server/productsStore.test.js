import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createProductsStore, defaultSizes, ALL_SIZES } from './productsStore.js';

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
