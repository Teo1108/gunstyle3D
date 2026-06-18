import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const formData = await request.formData();

    const backendResponse = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      headers: { 'Authorization': authHeader },
      body: formData,
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error en upload' }, { status: 500 });
  }
}
