'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminProductForm from '@/components/AdminProductForm';

export default function AdminEditProduct() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProduct(data.data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div style={{ color: 'var(--primary)', padding: '40px', textAlign: 'center' }}>Cargando producto...</div>;
  }

  if (!product) {
    return <div style={{ color: '#ff4d4f', padding: '40px', textAlign: 'center' }}>Producto no encontrado</div>;
  }

  return <AdminProductForm initialProduct={product} productId={id} />;
}
