import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

function mapProduct(row: any) {
  return {
    id: row.id, name: row.name, category: row.category, price: row.price,
    rating: row.rating, isNew: row.is_new, description: row.description,
    images: row.images ?? [], catalogImage: row.catalog_image, sizes: row.sizes ?? {},
  };
}

async function requireAuth(request: NextRequest): Promise<boolean> {
  const token = (request.headers.get('authorization') ?? '').replace('Bearer ', '');
  return verifyToken(token);
}

export async function GET() {
  const { data, error } = await supabaseServer().from('products').select('*');
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data.map(mapProduct) });
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth(request)))
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabaseServer()
    .from('products')
    .insert({
      name: body.name,
      category: body.category,
      price: body.price,
      rating: body.rating ?? 5.0,
      is_new: body.isNew ?? true,
      description: body.description ?? '',
      images: body.images ?? [],
      catalog_image: body.catalogImage ?? body.images?.[0] ?? '',
      sizes: body.sizes ?? { XS: true, S: true, M: true, L: true, XL: true, XXL: true },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: mapProduct(data) }, { status: 201 });
}
