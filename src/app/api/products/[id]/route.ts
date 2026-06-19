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
