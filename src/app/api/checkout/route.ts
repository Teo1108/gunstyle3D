import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ success: false, message: 'Checkout no implementado aún' }, { status: 501 });
}
