'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Post, Profile } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [me, setMe] = useState<Profile|null>(null);
  const [profile, setProfile] = useState<Profile|null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/auth'); return; }
      const uid = data.session.user.id;

      // fetch my profile
      const { data: myProf } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (myProf) setMe(myProf);

      // fetch target profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (!prof) { setNotFound(true); setLoading(false); return; }
      setProfile(prof);

      // fetch their posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles(*), likes(id, user_id, emoji)')
        .eq('user_id', prof.id)
        .order('created_at', { ascending: false });

      if (postsData) {
        setPosts(postsData.map((p: any) => ({
          ...p,
          like_count: p.likes?.length ?? 0,
          user_liked: p.likes?.some((l: any) => l.user_id === uid) ?? false,
        })));
      }
      setLoading(false);
    });
  }, [username]);

  if (notFound) return (
    <>
      <Navbar username={me?.username} />
      <div style={{ textAlign:'center', padding:'6rem 2rem' }}>
        <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🫙</div>
        <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.8rem', color:'var(--deep-brown)' }}>User not found</h2>
        <p style={{ fontFamily:"'Caveat', cursive", color:'var(--warm-gray)', fontSize:'1.1rem' }}>@{username} doesn't exist</p>
      </div>
    </>
  );

  return (
    <>
      <Navbar username={me?.username} />
      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        {/* Profile header */}
        {profile && (
          <div className="fade-up" style={{
            background:'var(--warm-white)', border:'1.5px solid var(--parchment)',
            borderRadius:'18px', padding:'2rem', textAlign:'center',
            boxShadow:'0 4px 20px var(--shadow)', marginBottom:'2.5rem',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{
              position:'absolute', top:0, left:'20%', right:'20%', height:'4px',
              background:'linear-gradient(90deg, var(--soft-brown), var(--gold), var(--rust))',
              borderRadius:'0 0 4px 4px',
            }}/>
            <div style={{
              width:'72px', height:'72px', borderRadius:'50%',
              background:'linear-gradient(135deg, var(--soft-brown), var(--rust))',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'2rem', margin:'0 auto 1rem',
            }}>
              🍲
            </div>
            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.75rem', color:'var(--deep-brown)' }}>
              {profile.display_name}
            </h2>
            <p style={{ fontFamily:"'Caveat', cursive", fontSize:'1.05rem', color:'var(--warm-gray)' }}>
              @{profile.username}
            </p>
            <p style={{ fontFamily:"'Playfair Display', serif", fontSize:'1rem', color:'var(--rust)', fontStyle:'italic', marginTop:'0.4rem' }}>
              Memories from {profile.mom_name}'s Kitchen
            </p>
            {profile.bio && (
              <p style={{ fontFamily:"'Lora', serif", fontSize:'0.92rem', color:'var(--light-ink)', marginTop:'0.75rem', fontStyle:'italic' }}>
                "{profile.bio}"
              </p>
            )}
            <p style={{ fontFamily:"'Caveat', cursive", fontSize:'0.9rem', color:'var(--warm-gray)', marginTop:'0.75rem' }}>
              {posts.length} memor{posts.length===1?'y':'ies'} · Member since {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
            </p>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', fontFamily:"'Caveat', cursive", fontSize:'1.2rem', color:'var(--warm-gray)' }}>
            Loading memories… 🍲
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>📖</div>
            <p style={{ fontFamily:"'Caveat', cursive", fontSize:'1.1rem', color:'var(--warm-gray)' }}>
              {profile?.display_name} hasn't shared any memories yet
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUserId={me?.id} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
