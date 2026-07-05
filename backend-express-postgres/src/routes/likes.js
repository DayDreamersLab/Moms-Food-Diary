import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const likeSchema = z.object({
  emoji: z.string().min(1).max(16).default('❤️'),
});

router.post('/posts/:postId/likes', requireAuth, async (req, res, next) => {
  try {
    const input = likeSchema.parse(req.body ?? {});
    const result = await query(
      `insert into likes (post_id, user_id, emoji)
       values ($1, $2, $3)
       on conflict (user_id, post_id)
       do update set emoji = excluded.emoji
       returning id, user_id, post_id, emoji, created_at`,
      [req.params.postId, req.user.id, input.emoji],
    );

    res.status(201).json({ like: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/posts/:postId/likes', requireAuth, async (req, res, next) => {
  try {
    await query(
      `delete from likes where post_id = $1 and user_id = $2`,
      [req.params.postId, req.user.id],
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
