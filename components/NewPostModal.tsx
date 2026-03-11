'use client';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import type { Post } from '@/lib/types';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const MOODS = ['🏠 Homesick','🥰 Loved','😌 Comforted','🌧️ Nostalgic','😄 Joyful','🙏 Grateful'];

export default function NewPostModal({ userId, momName, onCreated, onClose }: {
  userId: string;
  momName: string;
  onCreated: (post: Post) => void;
  onClose: () => void;
}) {
  const [dish, setDish]       = useState('');
  const [occasion, setOccasion] = useState('');
  const [review, setReview]   = useState('');
  const [recipe, setRecipe]   = useState('');
  const [rating, setRating]   = useState(0);
  const [mood, setMood]       = useState('');
  const [photoFile, setPhotoFile] = useState<File|null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dish.trim()) { toast.error('Please enter the dish name'); return; }
    if (!review.trim()) { toast.error('Please write a review'); return; }
    setLoading(true);

    let photo_url: string|undefined;
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('post-photos').upload(path, photoFile);
      if (uploadErr) { toast.error('Photo upload failed'); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from('post-photos').getPublicUrl(path);
      photo_url = urlData.publicUrl;
    }

    const { data, error } = await supabase.from('posts').insert({
      user_id: userId, dish_name: dish.trim(),
      occasion: occasion.trim() || null,
      review: review.trim(), recipe: recipe.trim() || null,
      rating: rating || null, photo_url: photo_url || null,
      mood: mood || null,
    }).select('*, profiles(*)').single();

    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success('Memory saved! 🍲');
    onCreated(data as Post);
    onClose();
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:'fixed', inset:0, background:'rgba(61,43,31,0.45)',
        backdropFilter:'blur(4px)', zIndex:200,
        display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem',
      }}
    >
      <div style={{
        background:'var(--warm-white)', borderRadius:'20px', padding:'2rem',
        width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 20px 60px rgba(61,43,31,0.3)', position:'relative',
        animation:'fadeUp 0.3s ease both',
      }}>
        <div style={{
          position:'absolute', top:0, left:'30px', right:'30px', height:'4px',
          background:'linear-gradient(90deg, var(--soft-brown), var(--gold), var(--rust))',
          borderRadius:'0 0 4px 4px',
        }} />
        <button onClick={onClose} style={{
          position:'absolute', top:'1.2rem', right:'1.2rem', background:'none',
          border:'none', cursor:'pointer', color:'var(--warm-gray)',
        }}><X size={20}/></button>

        <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.6rem', color:'var(--deep-brown)', textAlign:'center', marginBottom:'1.5rem' }}>
          A new <em style={{ color:'var(--rust)' }}>memory</em> 🥄
        </h2>

        <form onSubmit={submit}>
          <MField label="Dish name" value={dish} onChange={setDish} placeholder={`e.g. ${momName}'s Adobo, Fried Rice...`} />
          <MField label="Occasion / Memory" value={occasion} onChange={setOccasion} placeholder="e.g. Every Sunday, my birthday..." />
          <MField label="Your review — what made it special?" value={review} onChange={setReview} placeholder="The smell alone could bring me home..." textarea />

          {/* Star rating */}
          <div style={{ marginBottom:'1.2rem' }}>
            <label style={{ display:'block', fontFamily:"'Caveat', cursive", fontSize:'1rem', color:'var(--light-ink)', marginBottom:'0.4rem' }}>Rating</label>
            <div style={{ display:'flex', gap:'0.4rem' }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} onClick={() => setRating(n)} style={{
                  fontSize:'1.6rem', cursor:'pointer',
                  opacity: n <= rating ? 1 : 0.3,
                  transform: n <= rating ? 'scale(1.1)' : 'scale(1)',
                  transition:'all 0.15s',
                }}>⭐</span>
              ))}
            </div>
          </div>

          <MField label={`${momName}'s Recipe (as best you know it)`} value={recipe} onChange={setRecipe} placeholder="Ingredients & steps, even if rough…" textarea />

          {/* Photo */}
          <div style={{ marginBottom:'1.2rem' }}>
            <label style={{ display:'block', fontFamily:"'Caveat', cursive", fontSize:'1rem', color:'var(--light-ink)', marginBottom:'0.4rem' }}>Add a photo</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ fontFamily:"'Lora', serif", fontSize:'0.88rem', color:'var(--warm-gray)' }} />
            {photoPreview && <img src={photoPreview} alt="preview" style={{ width:'100%', maxHeight:'200px', objectFit:'cover', borderRadius:'10px', marginTop:'0.5rem' }} />}
          </div>

          {/* Mood */}
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ display:'block', fontFamily:"'Caveat', cursive", fontSize:'1rem', color:'var(--light-ink)', marginBottom:'0.4rem' }}>How did it make you feel?</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {MOODS.map(m => (
                <span key={m} onClick={() => setMood(m===mood ? '' : m)} style={{
                  fontFamily:"'Caveat', cursive", fontSize:'0.95rem',
                  padding:'0.3rem 0.8rem',
                  border:'1.5px solid ' + (m===mood ? 'var(--rust)' : 'var(--parchment)'),
                  borderRadius:'20px', cursor:'pointer',
                  color: m===mood ? 'var(--rust)' : 'var(--warm-gray)',
                  background: m===mood ? 'rgba(184,92,42,0.07)' : 'transparent',
                  transition:'all 0.15s',
                }}>{m}</span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'0.85rem',
            background:'linear-gradient(135deg, var(--rust), var(--deep-brown))',
            color:'white', border:'none', borderRadius:'12px',
            fontFamily:"'Playfair Display', serif", fontSize:'1.05rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow:'0 4px 16px rgba(122,79,46,0.25)',
          }}>
            {loading ? 'Saving...' : 'Save This Memory 🍲'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MField({ label, value, onChange, placeholder, textarea }: any) {
  const style = {
    width:'100%', padding:'0.75rem 1rem',
    border:'1.5px solid var(--parchment)', borderRadius:'10px',
    fontFamily:"'Lora', serif", fontSize:'0.92rem', color:'var(--ink)',
    background:'var(--cream)', outline:'none',
    resize: textarea ? 'vertical' as const : undefined,
    minHeight: textarea ? '90px' : undefined,
  };
  return (
    <div style={{ marginBottom:'1.2rem' }}>
      <label style={{ display:'block', fontFamily:"'Caveat', cursive", fontSize:'1rem', color:'var(--light-ink)', marginBottom:'0.35rem' }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={style} />
        : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </div>
  );
}
