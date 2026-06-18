import { useState } from 'react';
import { defaultSizes, toggleSize as toggleSizeValue } from '@/utils/sizes';
import { authFetch } from '@/utils/adminAuth';

export interface Product {
  name: string;
  category: string;
  price: number | string;
  description: string;
  images: string[];
  catalogImage: string;
  sizes: Record<string, boolean>;
}

export function useProductForm(initialProduct: Partial<Product> | null = null) {
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState(initialProduct?.category || 'T-Shirts');
  const [price, setPrice] = useState(initialProduct?.price ?? '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [catalogImage, setCatalogImage] = useState(initialProduct?.catalogImage || '');
  const [sizes, setSizes] = useState(initialProduct?.sizes || defaultSizes());

  const addImage = (url: string) => {
    setImages(prev => [...prev, url]);
    setCatalogImage(prev => prev || url);
  };

  const removeImage = (url: string) => {
    setImages(prev => prev.filter(i => i !== url));
    setCatalogImage(prev => (prev === url ? '' : prev));
  };

  const selectCatalogImage = (url: string) => setCatalogImage(url);

  const toggleSize = (size: string) => setSizes(prev => toggleSizeValue(prev, size));

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

  const save = async (productId?: string) => {
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
