'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Post, Profile } from '@/lib/types';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile|null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/auth'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
      if (prof) setProfile(prof);
    });
  }, []);

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*), likes(id, user_id, emoji)')
      .textSearch('search_vector', q.trim().split(' ').join(' & '))
      .order('created_at', { ascending: false })
      .limit(30);

    const uid = profile?.id ?? '';
    setResults((data ?? []).map((p: any) => ({
      ...p,
      like_count: p.likes?.length ?? 0,
      user_liked: p.likes?.some((l: any) => l.user_id === uid) ?? false,
    })));
    setLoading(false);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  }

  const SUGGESTIONS = ['sinigang','adobo','curry','fried rice','soup','dumplings','stew','pancit','biryani'];

  return (
    <>
      <Navbar username={profile?.username} />
      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }} className="fade-up">
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:'2rem', color:'var(--deep-brown)' }}>
            Search <em style={{ color:'var(--rust)' }}>Memories</em>
          </h1>
          <p style={{ fontFamily:"'Caveat', cursive", fontSize:'1.1rem', color:'var(--warm-gray)', marginTop:'0.3rem' }}>
            Find dishes by name, ingredient, or feeling
          </p>
        </div>

        {/* Search box */}
        <div className="fade-up" style={{
          background:'var(--warm-white)', border:'1.5px solid var(--parchment)',
          borderRadius:'16px', padding:'1.5rem',
          boxShadow:'0 4px 20px var(--shadow)', marginBottom:'2rem',
        }}>
          <div style={{ position:'relative' }}>
            <Search size={18} style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'var(--warm-gray)' }}/>
            <input
              type="text" value={query} onChange={handleInput}
              placeholder="e.g. adobo, sinigang, chicken soup..."
              style={{
                width:'100%', padding:'0.85rem 1rem 0.85rem 2.75rem',
                border:'1.5px solid var(--parchment)', borderRadius:'12px',
                fontFamily:"'Lora', serif", fontSize:'1rem', color:'var(--ink)',
                background:'var(--cream)', outline:'none',
                transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor='var(--soft-brown)'}
              onBlur={e => e.target.style.borderColor='var(--parchment)'}
            />
          </div>

          {/* Suggestions */}
          {!query && (
            <div style={{ marginTop:'1rem' }}>
              <p style={{ fontFamily:"'Caveat', cursive", fontSize:'0.95rem', color:'var(--warm-gray)', marginBottom:'0.5rem' }}>
                Popular searches:
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => { setQuery(s); doSearch(s); }} style={{
                    fontFamily:"'Caveat', cursive", fontSize:'0.95rem',
                    padding:'0.3rem 0.85rem', border:'1.5px solid var(--parchment)',
                    borderRadius:'20px', background:'none', cursor:'pointer',
                    color:'var(--light-ink)', transition:'all 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as any).style.borderColor='var(--rust)'; (e.currentTarget as any).style.color='var(--rust)'; }}
                    onMouseLeave={e => { (e.currentTarget as any).style.borderColor='var(--parchment)'; (e.currentTarget as any).style.color='var(--light-ink)'; }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading && (
          <div style={{ textAlign:'center', padding:'2rem', fontFamily:"'Caveat', cursive", fontSize:'1.2rem', color:'var(--warm-gray)' }}>
            Searching memories… 🔍
          </div>
        )}
        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign:'center', padding:'3rem' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🫙</div>
            <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.4rem', color:'var(--deep-brown)' }}>No results found</h3>
            <p style={{ fontFamily:"'Caveat', cursive", color:'var(--warm-gray)', fontSize:'1.05rem' }}>
              Try a different dish name or ingredient
            </p>
          </div>
        )}
        {!loading && results.length > 0 && (
          <>
            <p style={{ fontFamily:"'Caveat', cursive", fontSize:'1rem', color:'var(--warm-gray)', marginBottom:'1.5rem' }}>
              {results.length} memor{results.length===1?'y':'ies'} found for "{query}"
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>
              {results.map(post => (
                <PostCard key={post.id} post={post} currentUserId={profile?.id} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
