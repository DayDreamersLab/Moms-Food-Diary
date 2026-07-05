import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const result = await query(
      `select users.id, users.email, profiles.username, profiles.display_name, profiles.mom_name
       from users
       join profiles on profiles.id = users.id
       where users.id = $1`,
      [payload.sub],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    next(error);
  }
}

export function optionalAuth(req, res, next) {
  const header = req.get('authorization') ?? '';

  if (!header.startsWith('Bearer ')) {
    return next();
  }

  return requireAuth(req, res, next);
}
