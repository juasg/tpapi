import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../auth/jwt';

// Extend Express Request to carry the authenticated customer
declare global {
  namespace Express {
    interface Request {
      customer?: TokenPayload;
    }
  }
}

/**
 * requireAuth — validates Bearer JWT and attaches customer to req.
 * Returns 401 if missing/invalid, 403 if token is well-formed but expired.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Bearer token required' });
    return;
  }

  const token = header.slice(7);
  try {
    req.customer = verifyToken(token);
    next();
  } catch (err: any) {
    const expired = err.name === 'TokenExpiredError';
    res.status(expired ? 401 : 401).json({
      error:   expired ? 'token_expired' : 'invalid_token',
      message: expired ? 'Token has expired. Re-authenticate.' : 'Invalid token.',
    });
  }
}

/**
 * requireAdmin — validates x-admin-secret header for admin-only endpoints.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'forbidden', message: 'Admin access required' });
    return;
  }
  next();
}
