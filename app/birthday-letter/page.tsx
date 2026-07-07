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
    const paper = event.currentTarget.querySelector('.letter-paper');
    const paperRect = paper?.getBoundingClientRect();
    const clickedPaper = paperRect
      ? event.clientX >= paperRect.left &&
        event.clientX <= paperRect.right &&
        event.clientY >= paperRect.top &&
        event.clientY <= paperRect.bottom
      : false;

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
          <h1>엄마를 위한 자그마한 생일선물</h1>
          <p>
            편지를 열어보세요!
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
              <span className="letter-date">2026년 7월 6일</span>
              <span className="letter-title">생일 축하해요 엄마!</span>
              <span className="letter-body">
                  저번 생일도 그렇고 완성하는게 조금씩 늦어서 생일때 드리고 싶었는데 타이밍을 놓쳤어요. 미안해요. 
                  벌써 홍콩에 온지 거의 10년, 엄마랑 함께한지는 20년이 됬어요. 
                  엄마에겐 여기에서의 10년이 어떤 의미였을지 모르지만, 
                  제가보낸 여기서의 10년은 엄마와 함께지 않았더라면 버티기 힘든 10년이 되지 않았을까 생각해요. 
                  잠시나마 였지만 엄마가 한국으로 가고 저랑 아빠만 둘이서 있을때 집밥의 힘, 그리고 엄마라는 존재 자체가 주는 힘을 뼈저리게 느꼈고,
                  엄마가 얼마나 홍콩에서의 삶을 편안하게 해줬고 얼마나 버팀목이 되었는지를 새삼 되돌아 보게 되었어요. 
                  지금까지 그리고 계속 저를 지탱해 주는 가장 큰 힘이 되줘서 너무 고맙고, 늦었지만 그만큼 생일 축하해요!
              </span>
              <span className="letter-signature">엄마의 힘이 되고 싶은 대희가</span>
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

          {!isOpen && <span className="letter-hint">탭하여 열기</span>}
        </button>

        <div className="birthday-actions">
          <button type="button" onClick={replayLetter} disabled={!isOpen}>
            <RotateCcw size={18} aria-hidden="true" />
            재생
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
            <span className="letter-date">2026년 7월 6일</span>
            <span className="letter-title">생일 축하해요 엄마!</span>
            <span className="letter-body">
                  저번 생일도 그렇고 완성하는게 조금씩 늦어서 생일때 드리고 싶었는데 타이밍을 놓쳤어요. 미안해요. 
                  벌써 홍콩에 온지 거의 10년, 엄마랑 함께한지는 20년이 됬어요. 
                  엄마에겐 여기에서의 10년이 어떤 의미였을지 모르지만, 
                  제가보낸 여기서의 10년은 엄마와 함께지 않았더라면 버티기 힘든 10년이 되지 않았을까 생각해요. 
                  잠시나마 였지만 엄마가 한국으로 가고 저랑 아빠만 둘이서 있을때 집밥의 힘, 그리고 엄마라는 존재 자체가 주는 힘을 뼈저리게 느꼈고,
                  엄마가 얼마나 홍콩에서의 삶을 편안하게 해줬고 얼마나 버팀목이 되었는지를 새삼 되돌아 보게 되었어요. 
                  지금까지 그리고 계속 저를 지탱해 주는 가장 큰 힘이 되줘서 너무 고맙고, 늦었지만 그만큼 생일 축하해요!
            </span>
            <span className="letter-signature">엄마의 힘이 되고 싶은 대희가</span>
          </div>
        </div>
      )}
    </main>
  );
}
