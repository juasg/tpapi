import jwt from 'jsonwebtoken';

const SECRET  = process.env.JWT_SECRET!;
const EXPIRES = parseInt(process.env.JWT_EXPIRES_IN ?? '3600');

export interface TokenPayload {
  sub:         string;   // clientId / KUNNR
  customerId:  string;
  companyName: string;
  email:       string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
