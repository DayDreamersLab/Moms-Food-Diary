'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Post, Profile } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import NewPostModal from '@/components/NewPostModal';

export default function DiaryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile|null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const supabase = createClient();

  const fetchDiary = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*), likes(id, user_id, emoji)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data.map((p: any) => ({
        ...p,
        like_count: p.likes?.length ?? 0,
        user_liked: p.likes?.some((l: any) => l.user_id === uid) ?? false,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/auth'); return; }
      const uid = data.session.user.id;
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (!prof) { router.replace('/auth'); return; }
      setProfile(prof);
      fetchDiary(uid);
    });
  }, []);

  function handleCreated(post: Post) {
    setPosts(prev => [{ ...post, like_count:0, user_liked:false }, ...prev]);
  }
  function handleDelete(id: number) {
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <>
      <Navbar username={profile?.username} />
      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }} className="fade-up">
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:'2rem', color:'var(--deep-brown)' }}>
            {profile ? `${profile.display_name}'s` : 'My'} <em style={{ color:'var(--rust)' }}>{profile?.mom_name}'s</em> Kitchen
          </h1>
          <p style={{ fontFamily:"'Caveat', cursive", fontSize:'1.1rem', color:'var(--warm-gray)', marginTop:'0.3rem' }}>
            A diary of love, one dish at a time 🌿
          </p>
        </div>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <button onClick={() => setShowModal(true)} style={{
            padding:'0.85rem 2.2rem',
            background:'linear-gradient(135deg, var(--soft-brown), var(--rust))',
            color:'white', border:'none', borderRadius:'50px',
            fontFamily:"'Playfair Display', serif", fontSize:'1.05rem',
            cursor:'pointer', boxShadow:'0 4px 16px rgba(184,92,42,0.3)',
            transition:'transform 0.15s',
          }}>✏️ &nbsp;Add a New Memory</button>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', fontFamily:"'Caveat', cursive", fontSize:'1.2rem', color:'var(--warm-gray)' }}>
            Loading your diary… 📖
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem' }}>
            <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>📖</div>
            <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.5rem', color:'var(--deep-brown)' }}>Your diary is waiting</h3>
            <p style={{ fontFamily:"'Caveat', cursive", color:'var(--warm-gray)', fontSize:'1.1rem' }}>
              Add your first memory of {profile?.mom_name}'s cooking
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUserId={profile?.id} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showModal && profile && (
        <NewPostModal
          userId={profile.id}
          momName={profile.mom_name}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
