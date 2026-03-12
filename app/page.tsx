'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import LandingPage from './landing/landing-page';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/feed');
      } else {
        setIsLoggedIn(false);
      }
    });
  }, [router]);

  // Still checking auth
  if (isLoggedIn === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '3rem' }} className="sway">🍲</span>
      </div>
    );
  }

  return <LandingPage />;
}
