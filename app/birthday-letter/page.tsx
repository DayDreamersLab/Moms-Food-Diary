'use client';

import { RotateCcw, Sparkles, X } from 'lucide-react';
import { type MouseEvent, useEffect, useState } from 'react';

export default function BirthdayLetterPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsZoomed(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleSceneClick(event: MouseEvent<HTMLButtonElement>) {
    const clickedPaper = (event.target as HTMLElement).closest('.letter-paper');

    if (isOpen && clickedPaper) {
      setIsZoomed(true);
      return;
    }

    setIsOpen(true);
  }

  function replayLetter() {
    setIsZoomed(false);
    setIsOpen(false);
  }

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
          onClick={handleSceneClick}
          aria-label={isOpen ? 'Zoom the birthday letter' : 'Open the birthday letter'}
          aria-pressed={isOpen}
        >
          <span className="sparkle sparkle-one">✦</span>
          <span className="sparkle sparkle-two">✧</span>
          <span className="sparkle sparkle-three">✦</span>

          <span className="envelope-shadow" />
          <span className="envelope">
            <span className="letter-paper" title={isOpen ? 'Click to zoom' : undefined}>
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
          <button type="button" onClick={replayLetter} disabled={!isOpen}>
            <RotateCcw size={18} aria-hidden="true" />
            Replay
          </button>
        </div>
      </section>

      {isZoomed && (
        <div
          className="letter-zoom-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Birthday letter fullscreen view"
          onClick={() => setIsZoomed(false)}
        >
          <div className="letter-zoom-paper" onClick={event => event.stopPropagation()}>
            <button
              type="button"
              className="letter-zoom-close"
              onClick={() => setIsZoomed(false)}
              aria-label="Close fullscreen letter"
            >
              <X size={22} aria-hidden="true" />
            </button>
            <span className="letter-date">July 4, 2026</span>
            <span className="letter-title">Happy Birthday, Mom</span>
            <span className="letter-body">
              Thank you for every meal, every story, and every quiet way you made home
              feel safe. Today is for celebrating you.
            </span>
            <span className="letter-signature">Love, always</span>
          </div>
        </div>
      )}
    </main>
  );
}
