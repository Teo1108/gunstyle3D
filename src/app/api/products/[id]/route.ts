import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

type Params = { params: Promise<{ id: string }> };

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

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabaseServer()
    .from('products').select('*').eq('id', id).single();
  if (error || !data)
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: mapProduct(data) });
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAuth(request)))
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseServer()
    .from('products')
    .update({
      name: body.name,
      category: body.category,
      price: body.price,
      rating: body.rating,
      is_new: body.isNew,
      description: body.description,
      images: body.images,
      catalog_image: body.catalogImage,
      sizes: body.sizes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data)
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: mapProduct(data) });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireAuth(request)))
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseServer().from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
