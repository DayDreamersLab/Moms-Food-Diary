'use client';

import { RotateCcw, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function BirthdayLetterPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="birthday-page">
      <section className="birthday-stage" aria-label="Birthday surprise letter prototype">
        <div className="birthday-copy">
          <p className="birthday-kicker">Birthday surprise</p>
          <h1>An openable letter for Mom</h1>
          <p>
            A tiny prototype for the reveal moment: she taps the envelope, the flap opens,
            and the birthday message slides into view like a keepsake.
          </p>
        </div>

        <button
          type="button"
          className={`letter-scene ${isOpen ? 'letter-scene--open' : ''}`}
          onClick={() => setIsOpen(true)}
          aria-label={isOpen ? 'Birthday letter is open' : 'Open the birthday letter'}
          aria-pressed={isOpen}
        >
          <span className="sparkle sparkle-one">✦</span>
          <span className="sparkle sparkle-two">✧</span>
          <span className="sparkle sparkle-three">✦</span>

          <span className="envelope-shadow" />
          <span className="envelope">
            <span className="letter-paper">
              <span className="letter-date">July 4, 2026</span>
              <span className="letter-title">Happy Birthday, Mom</span>
              <span className="letter-body">
                Thank you for every meal, every story, and every quiet way you made home
                feel safe. Today is for celebrating you.
              </span>
              <span className="letter-signature">Love, always</span>
            </span>
            <span className="envelope-back" />
            <span className="envelope-left" />
            <span className="envelope-right" />
            <span className="envelope-bottom" />
            <span className="envelope-flap" />
            <span className="wax-seal">
              <Sparkles size={22} strokeWidth={1.8} />
            </span>
          </span>

          <span className="letter-hint">{isOpen ? 'Letter opened' : 'Tap to open'}</span>
        </button>

        <div className="birthday-actions">
          <button type="button" onClick={() => setIsOpen(false)} disabled={!isOpen}>
            <RotateCcw size={18} aria-hidden="true" />
            Replay
          </button>
        </div>
      </section>
    </main>
  );
}
