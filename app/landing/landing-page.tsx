'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Lora', Georgia, serif", color: 'var(--ink)', overflowX: 'hidden' }}>

      {/* ── STICKY NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 2.5rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(253,246,236,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--parchment)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: 'var(--deep-brown)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>🍲</span> Mom's Food Diary
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/auth" style={{
            fontFamily: "'Lora', serif", fontSize: '0.9rem',
            color: 'var(--light-ink)', textDecoration: 'none',
            padding: '0.4rem 1rem', borderRadius: '20px',
            transition: 'color 0.2s',
          }}>Sign in</Link>
          <Link href="/auth" style={{
            fontFamily: "'Playfair Display', serif", fontSize: '0.9rem',
            color: 'white', textDecoration: 'none',
            padding: '0.5rem 1.25rem', borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--rust), var(--deep-brown))',
            boxShadow: '0 4px 12px rgba(122,79,46,0.25)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '8rem 2rem 5rem',
        position: 'relative',
        background: 'linear-gradient(170deg, var(--cream) 0%, #f5e9d3 50%, var(--cream) 100%)',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '10%', left: '-5%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', bottom: '5%', right: '-5%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,92,42,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <div className="fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="sway" style={{ fontSize: '5rem', display: 'block', marginBottom: '1.5rem' }}>🍲</span>
        </div>

        <div className="fade-up" style={{ animationDelay: '0.2s' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            color: 'var(--deep-brown)', lineHeight: 1.1,
            marginBottom: '1.5rem', maxWidth: '800px',
          }}>
            The meals you'll never<br/>
            <em style={{ color: 'var(--rust)' }}>forget to remember</em>
          </h1>
        </div>

        <div className="fade-up" style={{ animationDelay: '0.35s' }}>
          <p style={{
            fontFamily: "'Lora', serif", fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--light-ink)', lineHeight: 1.8,
            maxWidth: '560px', marginBottom: '2.5rem',
          }}>
            A diary for the dishes your mom made that shaped who you are —
            their recipes, their flavours, their love. Written down before it's forgotten.
          </p>
        </div>

        <div className="fade-up" style={{ animationDelay: '0.5s', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/auth" style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.1rem',
            color: 'white', textDecoration: 'none',
            padding: '1rem 2.5rem', borderRadius: '50px',
            background: 'linear-gradient(135deg, var(--soft-brown), var(--rust))',
            boxShadow: '0 6px 24px rgba(184,92,42,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'inline-block',
          }}
            onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-2px)'; (e.currentTarget as any).style.boxShadow = '0 10px 30px rgba(184,92,42,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as any).style.transform = 'translateY(0)'; (e.currentTarget as any).style.boxShadow = '0 6px 24px rgba(184,92,42,0.35)'; }}
          >
            Start Your Diary — It's Free
          </Link>
          <a href="#features" style={{
            fontFamily: "'Lora', serif", fontSize: '1rem',
            color: 'var(--light-ink)', textDecoration: 'none',
            padding: '1rem 2rem', borderRadius: '50px',
            border: '1.5px solid var(--parchment)',
            background: 'var(--warm-white)',
            transition: 'border-color 0.2s',
            display: 'inline-block',
          }}
            onMouseEnter={e => { (e.currentTarget as any).style.borderColor = 'var(--soft-brown)'; }}
            onMouseLeave={e => { (e.currentTarget as any).style.borderColor = 'var(--parchment)'; }}
          >
            See how it works ↓
          </a>
        </div>

        {/* Hero image mosaic */}
        <div className="fade-up" style={{
          animationDelay: '0.6s',
          marginTop: '4rem', display: 'grid',
          gridTemplateColumns: '1fr 1.4fr 1fr',
          gap: '1rem', maxWidth: '860px', width: '100%',
          alignItems: 'center',
        }}>
          {[
            { emoji: '🍜', label: "Nanay's Sinigang", height: '180px', delay: '0.65s' },
            { emoji: '🥘', label: "Mama's Adobo", height: '240px', delay: '0.7s' },
            { emoji: '🍛', label: "Ummi's Curry", height: '180px', delay: '0.75s' },
          ].map(({ emoji, label, height, delay }) => (
            <div key={label} className="fade-up" style={{
              animationDelay: delay,
              background: 'linear-gradient(145deg, var(--parchment), #ede0c8)',
              borderRadius: '18px', height,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid rgba(200,149,108,0.3)',
              boxShadow: '0 8px 32px var(--shadow)',
              gap: '0.5rem',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Placeholder pattern */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(200,149,108,0.04) 10px, rgba(200,149,108,0.04) 20px)`,
              }}/>
              <span style={{ fontSize: '3rem', position: 'relative', zIndex: 1 }}>{emoji}</span>
              <span style={{
                fontFamily: "'Caveat', cursive", fontSize: '0.95rem',
                color: 'var(--rust)', position: 'relative', zIndex: 1,
              }}>{label}</span>
              <span style={{
                fontFamily: "'Caveat', cursive", fontSize: '0.8rem',
                color: 'var(--warm-gray)', position: 'relative', zIndex: 1,
              }}>Your photo here</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{
        padding: '6rem 2rem',
        background: 'var(--warm-white)',
        borderTop: '1.5px solid var(--parchment)',
        borderBottom: '1.5px solid var(--parchment)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--deep-brown)' }}>
              Everything your memories <em style={{ color: 'var(--rust)' }}>deserve</em>
            </h2>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.15rem', color: 'var(--warm-gray)', marginTop: '0.5rem' }}>
              Four pages, one purpose — preserving the food that raised you
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              {
                icon: '📖',
                title: 'Your Personal Diary',
                desc: 'A private, beautiful diary of every dish your mom ever made for you. Write reviews, save recipes, attach photos, and rate each memory out of five stars.',
                color: '#f5e9d3',
                accent: 'var(--rust)',
                imgEmoji: '🍽️',
              },
              {
                icon: '🌍',
                title: 'Community Feed',
                desc: 'Discover what moms around the world are cooking. Browse a warm, flowing feed of memories shared by people just like you.',
                color: '#eef2e8',
                accent: 'var(--sage)',
                imgEmoji: '👨‍👩‍👧',
              },
              {
                icon: '🔍',
                title: 'Search Dishes',
                desc: 'Search by dish name or ingredient across everyone\'s posts. Find adobo, sinigang, biryani, curry — and the stories behind them.',
                color: '#f0e8f5',
                accent: '#9b7db5',
                imgEmoji: '🥘',
              },
              {
                icon: '👤',
                title: 'User Profiles',
                desc: 'Every member has their own public diary. Visit anyone\'s profile to read all their mom\'s recipes and leave reactions on the dishes that move you.',
                color: '#fdf0e8',
                accent: 'var(--soft-brown)',
                imgEmoji: '🤝',
              },
            ].map(({ icon, title, desc, color, accent, imgEmoji }) => (
              <div key={title} style={{
                background: 'var(--cream)', borderRadius: '20px',
                border: '1.5px solid var(--parchment)',
                overflow: 'hidden',
                boxShadow: '0 4px 20px var(--shadow)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-4px)'; (e.currentTarget as any).style.boxShadow = '0 12px 40px rgba(122,79,46,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as any).style.transform = 'translateY(0)'; (e.currentTarget as any).style.boxShadow = '0 4px 20px var(--shadow)'; }}
              >
                {/* Image placeholder */}
                <div style={{
                  height: '160px', background: color,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  position: 'relative', overflow: 'hidden',
                  borderBottom: '1px solid rgba(200,149,108,0.2)',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 15px, rgba(255,255,255,0.3) 15px, rgba(255,255,255,0.3) 30px)`,
                  }}/>
                  <span style={{ fontSize: '3.5rem', position: 'relative', zIndex: 1 }}>{imgEmoji}</span>
                  <span style={{
                    fontFamily: "'Caveat', cursive", fontSize: '0.9rem',
                    color: accent, position: 'relative', zIndex: 1, opacity: 0.8,
                  }}>Screenshot goes here</span>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: 'var(--deep-brown)', marginBottom: '0.6rem' }}>
                    {title}
                  </h3>
                  <p style={{ fontFamily: "'Lora', serif", fontSize: '0.9rem', color: 'var(--light-ink)', lineHeight: 1.75 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '6rem 2rem', background: 'var(--cream)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--deep-brown)', marginBottom: '1rem' }}>
            As simple as <em style={{ color: 'var(--rust)' }}>writing in a diary</em>
          </h2>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', color: 'var(--warm-gray)', marginBottom: '4rem' }}>
            Three steps to start preserving your mom's legacy
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            {[
              { step: '01', icon: '✍️', title: 'Create your account', desc: 'Sign up in seconds. Tell us your name and what you call your mom.' },
              { step: '02', icon: '🍲', title: 'Write your first memory', desc: 'Add a dish, your review, the recipe, a photo, and how it made you feel.' },
              { step: '03', icon: '🌿', title: 'Share & discover', desc: 'Browse the community feed, search dishes, and react to other people\'s memories.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ position: 'relative' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--parchment), #e8d5b5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  border: '2px solid rgba(200,149,108,0.3)',
                  fontSize: '1.8rem',
                  boxShadow: '0 4px 16px var(--shadow)',
                }}>
                  {icon}
                </div>
                <div style={{
                  position: 'absolute', top: '-8px', right: 'calc(50% - 48px)',
                  fontFamily: "'Caveat', cursive", fontSize: '0.85rem',
                  color: 'var(--rust)', fontWeight: 600,
                }}>{step}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'var(--deep-brown)', marginBottom: '0.5rem' }}>
                  {title}
                </h3>
                <p style={{ fontFamily: "'Lora', serif", fontSize: '0.88rem', color: 'var(--light-ink)', lineHeight: 1.75 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE STRIP ── */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, var(--deep-brown), #5a3520)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1.5rem', opacity: 0.6 }}>❝</span>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.2rem, 3vw, 1.75rem)',
            color: '#fdf6ec', lineHeight: 1.7, fontStyle: 'italic',
            marginBottom: '1.5rem',
          }}>
            The smell of her cooking could fill the whole house.<br/>
            I never thought to write it down. Until now.
          </p>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: '1rem', color: 'rgba(253,246,236,0.6)' }}>
            — What every member says on their first post
          </span>
        </div>
      </section>

      {/* ── ENTRIES PREVIEW ── */}
      <section style={{ padding: '6rem 2rem', background: 'var(--warm-white)', borderTop: '1.5px solid var(--parchment)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--deep-brown)' }}>
              Memories look like <em style={{ color: 'var(--rust)' }}>this</em>
            </h2>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', color: 'var(--warm-gray)', marginTop: '0.4rem' }}>
              Each entry is a little love letter to your mom's kitchen
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              {
                dish: "Nanay's Chicken Adobo",
                occasion: "Every Friday after school",
                review: "The vinegar smell alone could transport me back to our little kitchen in Manila. She'd let it simmer for hours until the sauce turned dark and glossy.",
                rating: 5, mood: '🏠 Homesick', emoji: '🍗',
              },
              {
                dish: "Mama's Lentil Soup",
                occasion: "Cold winter evenings",
                review: "Thick, golden, with a squeeze of lemon on top. She always said it was just leftovers thrown together. I've never been able to recreate it.",
                rating: 5, mood: '🥰 Loved', emoji: '🍲',
              },
            ].map(({ dish, occasion, review, rating, mood, emoji }) => (
              <div key={dish} style={{
                background: 'var(--cream)', borderRadius: '18px',
                border: '1.5px solid var(--parchment)',
                overflow: 'hidden',
                boxShadow: '0 4px 20px var(--shadow)',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--parchment), #ede0c8)',
                  padding: '1.2rem 1.5rem',
                  borderBottom: '1px solid rgba(200,149,108,0.2)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: 'var(--deep-brown)' }}>{dish}</h3>
                    <div style={{ fontFamily: "'Caveat', cursive", fontSize: '0.9rem', color: 'var(--rust)', marginTop: '0.15rem' }}>✦ {occasion}</div>
                  </div>
                  <span style={{ fontSize: '2rem' }}>{emoji}</span>
                </div>
                {/* Photo placeholder */}
                <div style={{
                  height: '140px', background: 'linear-gradient(145deg, #f0e2c8, #e8d5b5)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  borderBottom: '1px solid rgba(200,149,108,0.15)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(200,149,108,0.05) 10px, rgba(200,149,108,0.05) 20px)`,
                  }}/>
                  <span style={{ fontSize: '2.5rem', position: 'relative', zIndex: 1 }}>📷</span>
                  <span style={{ fontFamily: "'Caveat', cursive", fontSize: '0.85rem', color: 'var(--warm-gray)', position: 'relative', zIndex: 1 }}>
                    Add your photo here
                  </span>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{'⭐'.repeat(rating)}</div>
                  <p style={{
                    fontFamily: "'Lora', serif", fontSize: '0.9rem',
                    color: 'var(--light-ink)', lineHeight: 1.75, fontStyle: 'italic',
                    borderLeft: '3px solid var(--parchment)', paddingLeft: '0.9rem',
                    marginBottom: '1rem',
                  }}>"{review}"</p>
                  <span style={{ fontFamily: "'Caveat', cursive", fontSize: '0.95rem', color: 'var(--sage)' }}>{mood}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '7rem 2rem', textAlign: 'center',
        background: 'linear-gradient(170deg, var(--cream), var(--parchment))',
        borderTop: '1.5px solid rgba(200,149,108,0.25)',
      }}>
        <span className="sway" style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>🍲</span>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          color: 'var(--deep-brown)', lineHeight: 1.2, marginBottom: '1.25rem',
        }}>
          Your mom's recipes<br/>
          <em style={{ color: 'var(--rust)' }}>deserve to be remembered.</em>
        </h2>
        <p style={{
          fontFamily: "'Lora', serif", fontSize: '1.1rem',
          color: 'var(--light-ink)', maxWidth: '480px',
          margin: '0 auto 2.5rem', lineHeight: 1.8,
        }}>
          Start your diary today. Free, forever. One dish at a time.
        </p>
        <Link href="/auth" style={{
          fontFamily: "'Playfair Display', serif", fontSize: '1.15rem',
          color: 'white', textDecoration: 'none',
          padding: '1.1rem 3rem', borderRadius: '50px',
          background: 'linear-gradient(135deg, var(--soft-brown), var(--rust))',
          boxShadow: '0 8px 28px rgba(184,92,42,0.35)',
          display: 'inline-block',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { (e.currentTarget as any).style.transform = 'translateY(0)'; }}
        >
          Write Your First Memory →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '2rem', textAlign: 'center',
        borderTop: '1.5px solid var(--parchment)',
        background: 'var(--warm-white)',
      }}>
        <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1rem', color: 'var(--warm-gray)' }}>
          🍲 Mom's Food Diary — Made with love, for every mom's kitchen
        </p>
      </footer>

    </div>
  );
}
