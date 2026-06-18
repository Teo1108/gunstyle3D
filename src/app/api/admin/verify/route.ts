import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const response = await fetch('http://localhost:3001/api/admin/verify', {
      method: 'GET',
      headers: { 'Authorization': authHeader },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error de conexión' }, { status: 500 });
  }
}
