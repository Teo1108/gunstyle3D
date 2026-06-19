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
