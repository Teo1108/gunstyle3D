import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  const valid = await verifyToken(token);
  if (!valid)
    return NextResponse.json({ success: false, message: 'Token inválido' }, { status: 401 });
  return NextResponse.json({ success: true });
}
