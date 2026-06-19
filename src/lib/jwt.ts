import { SignJWT, jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

export async function signToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret());
}

export async function verifyToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}
