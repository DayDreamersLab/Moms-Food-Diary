import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

const signupSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  display_name: z.string().min(1).max(80),
  mom_name: z.string().min(1).max(80).default('Mom'),
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

router.post('/signup', async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await withTransaction(async (client) => {
      const createdUser = await client.query(
        `insert into users (email, password_hash)
         values ($1, $2)
         returning id, email, created_at`,
        [input.email, passwordHash],
      );

      await client.query(
        `insert into profiles (id, username, display_name, mom_name)
         values ($1, $2, $3, $4)`,
        [createdUser.rows[0].id, input.username, input.display_name, input.mom_name],
      );

      return createdUser.rows[0];
    });

    res.status(201).json({
      token: signToken(user.id),
      user,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await query(
      `select id, email, password_hash, created_at from users where email = $1`,
      [input.email],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(input.password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    delete user.password_hash;

    res.json({
      token: signToken(user.id),
      user,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `select users.id, users.email, users.created_at, profiles.username,
              profiles.display_name, profiles.mom_name, profiles.avatar_url, profiles.bio
       from users
       join profiles on profiles.id = users.id
       where users.id = $1`,
      [req.user.id],
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
