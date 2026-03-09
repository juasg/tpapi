import { Router, Request, Response } from 'express';
import { validateCredentials } from '../auth/customerStore';
import { signToken } from '../auth/jwt';

const router = Router();

/**
 * POST /oauth/token
 * OAuth2 Client Credentials flow (application/x-www-form-urlencoded)
 *
 * Body:
 *   grant_type    = client_credentials
 *   client_id     = <KUNNR>
 *   client_secret = <plain secret>
 *
 * Response:
 *   { access_token, token_type, expires_in, customer_id, company_name }
 */
router.post('/token', async (req: Request, res: Response) => {
  // Accept both JSON and form-encoded
  const body = req.body as Record<string, string>;
  const { grant_type, client_id, client_secret } = body;

  if (grant_type !== 'client_credentials') {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      message: 'Only client_credentials is supported',
    });
  }

  if (!client_id || !client_secret) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'client_id and client_secret are required',
    });
  }

  const customer = await validateCredentials(client_id, client_secret);
  if (!customer) {
    return res.status(401).json({
      error: 'invalid_client',
      message: 'Invalid client_id or client_secret',
    });
  }

  const token = signToken({
    sub:         customer.clientId,
    customerId:  customer.clientId,
    companyName: customer.companyName,
    email:       customer.email,
  });

  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN ?? '3600');
  res.json({
    access_token: token,
    token_type:   'Bearer',
    expires_in:   expiresIn,
    customer_id:  customer.clientId,
    company_name: customer.companyName,
  });
});

/**
 * GET /oauth/me — introspect current token
 */
router.get('/me', (req: Request, res: Response) => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const { verifyToken } = require('../auth/jwt');
    const payload = verifyToken(header.slice(7));
    res.json({
      customer_id:  payload.customerId,
      company_name: payload.companyName,
      email:        payload.email,
    });
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
});

export default router;
