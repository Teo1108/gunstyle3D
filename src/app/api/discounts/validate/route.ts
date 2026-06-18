import { NextRequest, NextResponse } from "next/server";
import { VALID_DISCOUNTS } from "@/lib/products";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ success: false, message: "Se requiere código" }, { status: 400 });

  const rule = VALID_DISCOUNTS[code.toUpperCase()];
  if (rule) {
    return NextResponse.json({ success: true, message: `Código aplicado: ${code.toUpperCase()}`, discount: rule });
  }
  return NextResponse.json({ success: false, message: "Código inválido" }, { status: 404 });
}
