import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

const createPostSchema = z.object({
  dish_name: z.string().min(1).max(140),
  occasion: z.string().max(160).optional().nullable(),
  review: z.string().min(1).max(5000),
  recipe: z.string().max(10000).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  mood: z.string().max(80).optional().nullable(),
});

function normalizePost(row) {
  return {
    id: Number(row.id),
    user_id: row.user_id,
    dish_name: row.dish_name,
    occasion: row.occasion,
    review: row.review,
    recipe: row.recipe,
    rating: row.rating,
    photo_url: row.photo_url,
    mood: row.mood,
    created_at: row.created_at,
    profiles: {
      id: row.profile_id,
      username: row.username,
      display_name: row.display_name,
      mom_name: row.mom_name,
      avatar_url: row.avatar_url,
      bio: row.bio,
    },
    like_count: Number(row.like_count ?? 0),
    user_liked: Boolean(row.user_liked),
    likes: row.likes ?? [],
  };
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 40), 100);
    const result = await query(
      `select posts.*,
              profiles.id as profile_id,
              profiles.username,
              profiles.display_name,
              profiles.mom_name,
              profiles.avatar_url,
              profiles.bio,
              count(likes.id) as like_count,
              coalesce(bool_or(likes.user_id = $1), false) as user_liked,
              coalesce(
                jsonb_agg(
                  jsonb_build_object('id', likes.id, 'user_id', likes.user_id, 'emoji', likes.emoji)
                ) filter (where likes.id is not null),
                '[]'::jsonb
              ) as likes
       from posts
       join profiles on profiles.id = posts.user_id
       left join likes on likes.post_id = posts.id
       group by posts.id, profiles.id
       order by posts.created_at desc
       limit $2`,
      [req.user?.id ?? null, limit],
    );

    res.json({ posts: result.rows.map(normalizePost) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const input = createPostSchema.parse(req.body);
    const result = await query(
      `insert into posts (user_id, dish_name, occasion, review, recipe, rating, photo_url, mood)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        req.user.id,
        input.dish_name.trim(),
        input.occasion?.trim() || null,
        input.review.trim(),
        input.recipe?.trim() || null,
        input.rating ?? null,
        input.photo_url ?? null,
        input.mood?.trim() || null,
      ],
    );

    const post = await query(
      `select posts.*,
              profiles.id as profile_id,
              profiles.username,
              profiles.display_name,
              profiles.mom_name,
              profiles.avatar_url,
              profiles.bio,
              0 as like_count,
              false as user_liked,
              '[]'::jsonb as likes
       from posts
       join profiles on profiles.id = posts.user_id
       where posts.id = $1`,
      [result.rows[0].id],
    );

    res.status(201).json({ post: normalizePost(post.rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `delete from posts where id = $1 and user_id = $2 returning id`,
      [req.params.id, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
