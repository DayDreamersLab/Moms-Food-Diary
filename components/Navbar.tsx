'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Home, BookOpen, Search, LogOut } from 'lucide-react';

export default function Navbar({ username }: { username?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  const navLinks = [
    { href: '/feed',   label: 'Feed',   icon: Home },
    { href: '/diary',  label: 'My Diary', icon: BookOpen },
    { href: '/search', label: 'Search', icon: Search },
  ];

  return (
    <nav style={{
      background: 'var(--warm-white)', borderBottom: '1.5px solid var(--parchment)',
      padding: '0 2rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '64px',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 12px var(--shadow)',
    }}>
      <Link href="/feed" style={{
        fontFamily: "'Playfair Display', serif", fontSize: '1.45rem',
        color: 'var(--deep-brown)', textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}>
        <span style={{ fontSize: '1.6rem' }}>🍲</span> Mom's Food Diary
      </Link>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.45rem 1rem', borderRadius: '20px', textDecoration: 'none',
            fontFamily: "'Lora', serif", fontSize: '0.9rem',
            background: pathname === href ? 'var(--parchment)' : 'transparent',
            color: pathname === href ? 'var(--rust)' : 'var(--warm-gray)',
            transition: 'all 0.2s',
          }}>
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {username && (
          <Link href={`/profile/${username}`} style={{
            fontFamily: "'Caveat', cursive", fontSize: '1.1rem',
            color: 'var(--light-ink)', textDecoration: 'none',
          }}>
            @{username}
          </Link>
        )}
        <button onClick={logout} style={{
          background: 'none', border: '1.5px solid var(--parchment)',
          color: 'var(--warm-gray)', fontFamily: "'Lora', serif",
          fontSize: '0.82rem', padding: '0.35rem 0.85rem',
          borderRadius: '20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.3rem',
        }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </nav>
  );
}
