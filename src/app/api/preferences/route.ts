import { NextRequest, NextResponse } from "next/server";

type Preferences = { device: string; theme: string };

declare global { var _gsPrefs: Preferences }
if (!globalThis._gsPrefs) globalThis._gsPrefs = { device: "mobile", theme: "dark" };

export function GET() {
  return NextResponse.json({ success: true, data: globalThis._gsPrefs });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (body.device) globalThis._gsPrefs.device = body.device;
  if (body.theme)  globalThis._gsPrefs.theme  = body.theme;
  return NextResponse.json({ success: true, data: globalThis._gsPrefs });
}
