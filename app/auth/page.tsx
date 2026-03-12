'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login'|'signup'>('login');
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass]   = useState('');

  // Signup fields
  const [name, setName]       = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [momName, setMomName] = useState('');

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    if (error) { toast.error(error.message); setLoading(false); return; }
    router.replace('/feed');
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !username || !email || !pass) { toast.error('Please fill in all fields.'); return; }
    if (pass.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);

    // Check username uniqueness
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).single();
    if (existing) { toast.error('That username is taken.'); setLoading(false); return; }

    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error || !data.user) { toast.error(error?.message || 'Signup failed'); setLoading(false); return; }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: username.toLowerCase().trim(),
      display_name: name,
      mom_name: momName || 'Mom',
    });
    if (profileError) { toast.error(profileError.message); setLoading(false); return; }

    toast.success('Welcome to Mom\'s Food Diary! 🍲');
    router.replace('/feed');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative',
    }}>
      {/* Back to landing */}
    <div style={{ position: 'absolute', top: '1.5rem', left: '2rem' }}>
      <Link href="/" style={{
        fontFamily: "'Lora', serif", fontSize: '0.9rem',
        color: 'var(--light-ink)', textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        transition: 'color 0.2s',
      }}
        onMouseEnter={e => { (e.currentTarget as any).style.color = 'var(--rust)'; }}
        onMouseLeave={e => { (e.currentTarget as any).style.color = 'var(--light-ink)'; }}
      >
        ← Back to Home
      </Link>
    </div>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="sway" style={{ fontSize: '3.5rem', display: 'block', marginBottom: '0.5rem' }}>🍲</span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', color: 'var(--deep-brown)', lineHeight: 1.1 }}>
          Mom's <em style={{ color: 'var(--rust)' }}>Food Diary</em>
        </h1>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem', color: 'var(--warm-gray)', marginTop: '0.4rem' }}>
          A diary for the meals that made you who you are
        </p>
      </div>

      {/* Card */}
      <div className="fade-up" style={{
        background: 'var(--warm-white)', border: '1.5px solid var(--parchment)',
        borderRadius: '18px', padding: '2.5rem', width: '100%', maxWidth: '420px',
        boxShadow: '0 8px 40px var(--shadow)', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '30px', right: '30px', height: '3px',
          background: 'linear-gradient(90deg, var(--soft-brown), var(--gold), var(--rust))',
          borderRadius: '0 0 4px 4px',
        }} />

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'2px solid var(--parchment)', marginBottom:'2rem' }}>
          {(['login','signup'] as const).map((t, i) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, background:'none', border:'none',
              fontFamily:"'Playfair Display', serif", fontSize:'1rem',
              color: tab===t ? 'var(--rust)' : 'var(--warm-gray)',
              padding:'0.6rem', cursor:'pointer', position:'relative',
              borderBottom: tab===t ? '2px solid var(--rust)' : '2px solid transparent',
              marginBottom: '-2px',
            }}>
              {i===0 ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <Field label="Email" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="your@email.com" />
            <Field label="Password" type="password" value={loginPass} onChange={setLoginPass} placeholder="••••••••" />
            <SubmitBtn loading={loading}>Open My Diary →</SubmitBtn>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <Field label="Your name" value={name} onChange={setName} placeholder="How you'd like to be known" />
            <Field label="Username" value={username} onChange={setUsername} placeholder="e.g. maria_kitchen" />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
            <Field label="Password" type="password" value={pass} onChange={setPass} placeholder="At least 6 characters" />
            <Field label="What do you call your mom? 🥰" value={momName} onChange={setMomName} placeholder="Mama, Nanay, Ummi, 妈妈..." />
            <SubmitBtn loading={loading}>Start My Diary →</SubmitBtn>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text', placeholder }: any) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={{ display:'block', fontFamily:"'Caveat', cursive", fontSize:'1rem', color:'var(--light-ink)', marginBottom:'0.35rem' }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:'100%', padding:'0.75rem 1rem',
          border:'1.5px solid var(--parchment)', borderRadius:'10px',
          fontFamily:"'Lora', serif", fontSize:'0.92rem', color:'var(--ink)',
          background:'var(--cream)', outline:'none',
        }}
        onFocus={e => { e.target.style.borderColor='var(--soft-brown)'; }}
        onBlur={e => { e.target.style.borderColor='var(--parchment)'; }}
      />
    </div>
  );
}

function SubmitBtn({ loading, children }: any) {
  return (
    <button type="submit" disabled={loading} style={{
      width:'100%', padding:'0.85rem',
      background:'linear-gradient(135deg, var(--rust), var(--deep-brown))',
      color:'white', border:'none', borderRadius:'12px',
      fontFamily:"'Playfair Display', serif", fontSize:'1.05rem',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      boxShadow:'0 4px 16px rgba(122,79,46,0.25)',
      transition:'transform 0.15s, box-shadow 0.15s',
    }}>
      {loading ? '...' : children}
    </button>
  );
}
