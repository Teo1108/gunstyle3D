import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
  }
  const token = await signToken();
  return NextResponse.json({ success: true, token });
}
