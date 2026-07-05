import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim();

    if (!q) {
      return res.json({ posts: [] });
    }

    const result = await query(
      `select posts.*,
              profiles.id as profile_id,
              profiles.username,
              profiles.display_name,
              profiles.mom_name,
              profiles.avatar_url,
              profiles.bio,
              count(likes.id) as like_count
       from posts
       join profiles on profiles.id = posts.user_id
       left join likes on likes.post_id = posts.id
       where posts.search_vector @@ plainto_tsquery('english', $1)
          or posts.dish_name ilike '%' || $1 || '%'
          or posts.review ilike '%' || $1 || '%'
       group by posts.id, profiles.id
       order by posts.created_at desc
       limit 40`,
      [q],
    );

    res.json({
      posts: result.rows.map((row) => ({
        ...row,
        id: Number(row.id),
        like_count: Number(row.like_count ?? 0),
        profiles: {
          id: row.profile_id,
          username: row.username,
          display_name: row.display_name,
          mom_name: row.mom_name,
          avatar_url: row.avatar_url,
          bio: row.bio,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
