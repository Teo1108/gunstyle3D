import { NextRequest, NextResponse } from "next/server";

// Shares the same in-memory cart — must import from the parent route module
// Next.js compiles each route independently, so we keep a shared ref via globalThis
declare global { var _gsCart: Array<{ productId: string; quantity: number; size?: string }> }
if (!globalThis._gsCart) globalThis._gsCart = [];
const cart = globalThis._gsCart;

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const size = req.nextUrl.searchParams.get("size");

  const idx = size
    ? cart.findIndex((i) => i.productId === productId && i.size === size)
    : cart.findIndex((i) => i.productId === productId);

  if (idx !== -1) cart.splice(idx, 1);
  return NextResponse.json({ success: true, data: cart });
}
