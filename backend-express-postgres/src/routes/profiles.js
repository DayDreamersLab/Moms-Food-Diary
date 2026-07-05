import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/:username', async (req, res, next) => {
  try {
    const profileResult = await query(
      `select * from profiles where username = $1`,
      [req.params.username],
    );

    if (profileResult.rowCount === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const postsResult = await query(
      `select posts.*,
              count(likes.id) as like_count
       from posts
       left join likes on likes.post_id = posts.id
       where posts.user_id = $1
       group by posts.id
       order by posts.created_at desc`,
      [profileResult.rows[0].id],
    );

    res.json({
      profile: profileResult.rows[0],
      posts: postsResult.rows.map((post) => ({
        ...post,
        id: Number(post.id),
        like_count: Number(post.like_count ?? 0),
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
