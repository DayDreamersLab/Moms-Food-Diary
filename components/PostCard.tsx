'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase';
import type { Post } from '@/lib/types';
import toast from 'react-hot-toast';

const REACTIONS = ['❤️','😭','🥰','🙏','😋','💛'];

export default function PostCard({ post, currentUserId, onDelete }: {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: number) => void;
}) {
  const [likes, setLikes] = useState(post.like_count ?? 0);
  const [userLiked, setUserLiked] = useState(post.user_liked ?? false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  async function handleReact(emoji: string) {
    if (!currentUserId) { toast.error('Sign in to react'); return; }
    setReactionOpen(false);
    if (userLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      setLikes(l => l - 1); setUserLiked(false);
    } else {
      const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId, emoji });
      if (!error) { setLikes(l => l + 1); setUserLiked(true); }
    }
  }

  async function handleDelete() {
    if (!confirm('Remove this memory?')) return;
    setDeleting(true);
    if (post.photo_url) {
      const path = post.photo_url.split('/post-photos/')[1];
      if (path) await supabase.storage.from('post-photos').remove([path]);
    }
    await supabase.from('posts').delete().eq('id', post.id);
    onDelete?.(post.id);
    toast.success('Memory removed');
  }

  const starsDisplay = post.rating
    ? '⭐'.repeat(post.rating)
    : null;

  return (
    <div className="fade-up" style={{
      background: 'var(--warm-white)', border: '1.5px solid var(--parchment)',
      borderRadius: '18px', overflow: 'hidden',
      boxShadow: '0 4px 20px var(--shadow)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(122,79,46,0.16)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px var(--shadow)';
      }}
    >
      {/* Card Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--parchment), #f0e2c8)',
        padding: '1.2rem 1.5rem 1rem',
        borderBottom: '1px solid rgba(200,149,108,0.25)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.35rem', color:'var(--deep-brown)' }}>
            {post.dish_name}
          </h3>
          {post.occasion && (
            <div style={{ fontFamily:"'Caveat', cursive", fontSize:'0.95rem', color:'var(--rust)', marginTop:'0.1rem' }}>
              ✦ {post.occasion}
            </div>
          )}
          {post.profiles && (
            <Link href={`/profile/${post.profiles.username}`} style={{
              fontFamily:"'Caveat', cursive", fontSize:'0.9rem',
              color:'var(--warm-gray)', textDecoration:'none', marginTop:'0.25rem', display:'block',
            }}>
              by @{post.profiles.username} · {post.profiles.mom_name}'s recipe
            </Link>
          )}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:"'Caveat', cursive", fontSize:'0.9rem', color:'var(--warm-gray)', whiteSpace:'nowrap' }}>
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </div>
          {starsDisplay && (
            <div style={{ fontSize:'0.95rem', marginTop:'0.25rem' }}>{starsDisplay}</div>
          )}
        </div>
      </div>

      {/* Photo */}
      {post.photo_url && (
        <div style={{ position:'relative', width:'100%', height:'260px' }}>
          <Image src={post.photo_url} alt={post.dish_name} fill style={{ objectFit:'cover' }} />
        </div>
      )}

      {/* Body */}
      <div style={{ padding:'1.5rem' }}>
        <blockquote style={{
          fontFamily:"'Lora', serif", fontSize:'0.95rem', color:'var(--light-ink)',
          lineHeight:1.75, fontStyle:'italic',
          borderLeft:'3px solid var(--parchment)', paddingLeft:'1rem',
          marginBottom: post.recipe ? '1.25rem' : '0',
        }}>
          "{post.review}"
        </blockquote>

        {post.recipe && (
          <details style={{ marginTop:'1rem' }}>
            <summary style={{
              fontFamily:"'Playfair Display', serif", fontSize:'0.95rem',
              color:'var(--deep-brown)', cursor:'pointer', userSelect:'none',
              display:'flex', alignItems:'center', gap:'0.4rem',
            }}>
              📜 See the recipe
            </summary>
            <div style={{
              background:'var(--cream)', borderRadius:'10px',
              padding:'1rem 1.25rem', marginTop:'0.75rem',
              fontFamily:"'Lora', serif", fontSize:'0.88rem',
              color:'var(--light-ink)', lineHeight:1.75, whiteSpace:'pre-line',
            }}>
              {post.recipe}
            </div>
          </details>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding:'0.75rem 1.5rem', borderTop:'1px solid var(--parchment)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          {/* Like / Reaction */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => currentUserId ? (userLiked ? handleReact('❤️') : setReactionOpen(r=>!r)) : toast.error('Sign in to react')}
              style={{
                background: userLiked ? 'rgba(184,92,42,0.1)' : 'none',
                border: '1.5px solid ' + (userLiked ? 'var(--rust)' : 'var(--parchment)'),
                borderRadius:'20px', padding:'0.3rem 0.8rem',
                cursor:'pointer', display:'flex', alignItems:'center', gap:'0.3rem',
                fontFamily:"'Caveat', cursive", fontSize:'1rem',
                color: userLiked ? 'var(--rust)' : 'var(--warm-gray)',
                transition:'all 0.2s',
              }}
            >
              {userLiked ? '❤️' : '🤍'} {likes > 0 ? likes : ''}
            </button>
            {reactionOpen && (
              <div style={{
                position:'absolute', bottom:'calc(100% + 8px)', left:0,
                background:'var(--warm-white)', border:'1.5px solid var(--parchment)',
                borderRadius:'12px', padding:'0.5rem',
                display:'flex', gap:'0.3rem',
                boxShadow:'0 4px 20px var(--shadow)', zIndex:10,
              }}>
                {REACTIONS.map(r => (
                  <button key={r} onClick={() => handleReact(r)} style={{
                    background:'none', border:'none', fontSize:'1.3rem',
                    cursor:'pointer', padding:'0.2rem',
                    borderRadius:'8px', transition:'transform 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.transform='scale(1.3)')}
                    onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
                  >{r}</button>
                ))}
              </div>
            )}
          </div>
          {post.mood && (
            <span style={{ fontFamily:"'Caveat', cursive", fontSize:'1rem', color:'var(--sage)' }}>
              {post.mood}
            </span>
          )}
        </div>

        {currentUserId === post.user_id && onDelete && (
          <button onClick={handleDelete} disabled={deleting} style={{
            background:'none', border:'none', color:'var(--warm-gray)',
            fontSize:'0.82rem', cursor:'pointer', fontFamily:"'Lora', serif",
            transition:'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color='#c0392b')}
            onMouseLeave={e => (e.currentTarget.style.color='var(--warm-gray)')}
          >
            🗑 Remove
          </button>
        )}
      </div>
    </div>
  );
}
