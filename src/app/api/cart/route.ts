import { NextRequest, NextResponse } from "next/server";

type CartItem = { productId: string; quantity: number; size?: string };

declare global { var _gsCart: CartItem[] }
if (!globalThis._gsCart) globalThis._gsCart = [];
const cart = globalThis._gsCart;

export function GET() {
  return NextResponse.json({ success: true, data: cart });
}

export async function POST(req: NextRequest) {
  const { productId, quantity, size } = await req.json();
  const existing = cart.find((i) => i.productId === productId && i.size === size);
  if (existing) {
    if (quantity <= 0) cart.splice(cart.indexOf(existing), 1);
    else existing.quantity = quantity;
  } else if (quantity > 0) {
    cart.push({ productId, quantity, size });
  }
  return NextResponse.json({ success: true, data: cart });
}
