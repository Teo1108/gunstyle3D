import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ success: false, message: 'Descuentos no implementados aún' }, { status: 501 });
}
