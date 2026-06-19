import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { VALID_DISCOUNTS } from '@/lib/products';

export async function POST(request: NextRequest) {
  const { items, discountCode } = await request.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ success: false, message: 'Carrito vacío' }, { status: 400 });
  }

  const productIds = items.map((i: any) => i.productId);
  const { data: products, error } = await supabaseServer()
    .from('products')
    .select('id, name, category, price, catalog_image')
    .in('id', productIds);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const enrichedItems = items.map((item: any) => {
    const product = products?.find((p: any) => p.id === item.productId);
    return {
      id: item.productId,
      name: product?.name ?? 'Producto',
      category: product?.category ?? '',
      price: product?.price ?? 0,
      image: product?.catalog_image ?? '',
      quantity: item.quantity,
      size: item.size,
    };
  });

  const subtotal = enrichedItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

  let discountAmount = 0;
  if (discountCode && VALID_DISCOUNTS[discountCode]) {
    const d = VALID_DISCOUNTS[discountCode];
    discountAmount = d.type === 'percentage' ? subtotal * (d.value / 100) : d.value;
  }

  const shipping = subtotal >= 100 ? 0 : 10;
  const total = Math.max(0, subtotal - discountAmount) + shipping;

  return NextResponse.json({
    success: true,
    receipt: {
      items: enrichedItems,
      subtotal: subtotal.toFixed(2),
      discountAmount,
      shipping,
      total,
    },
  });
}
