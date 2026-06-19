import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const PROTECTED = ['/admin/dashboard', '/admin/new', '/admin/edit'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get('gs_admin_token')?.value ?? '';
  const valid = await verifyToken(token);
  if (!valid) return NextResponse.redirect(new URL('/admin', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
