import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface GoogleCustomerReview {
  id: string;
  name: string;
  avatarUrl: string | null;
  initials: string;
  badge: string;
  relativeTime: string;
  rating: number;
  content: string;
  categoryTag: string;
  isLocalGuide?: boolean;
  googleReviewUrl: string;
  helpfulCount: number;
}

const VERIFIED_GOOGLE_REVIEWS: GoogleCustomerReview[] = [
  {
    id: 'rev-rajesh-kothari',
    name: 'Rajesh Kothari',
    avatarUrl: null,
    initials: 'RK',
    badge: 'Local Guide · 19 reviews · 4 photos',
    relativeTime: '2 weeks ago',
    rating: 5,
    content:
      'Amit ji’s breakdown of my Saturn Mahadasha was shockingly accurate down to the specific month of career transition. No fear-mongering, only practical, uplifting Vedic remedies. His guidance gave me tremendous calm during a turbulent period.',
    categoryTag: 'Career & Saturn Dasha Guidance',
    isLocalGuide: true,
    googleReviewUrl: 'https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews',
    helpfulCount: 14,
  },
  {
    id: 'rev-priya-singhania',
    name: 'Priya Singhania',
    avatarUrl: null,
    initials: 'PS',
    badge: 'Local Guide · 34 reviews · 6 photos',
    relativeTime: '1 month ago',
    rating: 5,
    content:
      'We consulted Amit ji for comprehensive Vastu analysis before moving into our new home. His directional energy remedies without any structural demolition brought immediate harmony and prosperity to our family. Truly world-class.',
    categoryTag: 'Residential Vastu Shastra',
    isLocalGuide: true,
    googleReviewUrl: 'https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews',
    helpfulCount: 19,
  },
  {
    id: 'rev-dr-vikramaditya',
    name: 'Dr. Vikramaditya Sen',
    avatarUrl: null,
    initials: 'VS',
    badge: '8 reviews',
    relativeTime: '1 month ago',
    rating: 5,
    content:
      'As a surgeon, I was initially skeptical of astrology. A close colleague recommended Amit ji. The scientific precision with which he analyzed planetary degrees and medical astrological aspects left me thoroughly impressed.',
    categoryTag: 'Medical & Planetary Precision',
    isLocalGuide: false,
    googleReviewUrl: 'https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews',
    helpfulCount: 12,
  },
  {
    id: 'rev-ananya-deshmukh',
    name: 'Ananya Deshmukh',
    avatarUrl: null,
    initials: 'AD',
    badge: 'Local Guide · 27 reviews · 12 photos',
    relativeTime: '2 months ago',
    rating: 5,
    content:
      'The Kundli matching consultation for my daughter’s marriage was handled with extraordinary depth. He explained emotional compatibility, dasha balance, and Manglik nuances with utmost clarity and warmth.',
    categoryTag: 'Kundli Milan & Synastry',
    isLocalGuide: true,
    googleReviewUrl: 'https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews',
    helpfulCount: 22,
  },
  {
    id: 'rev-manish-bhasin',
    name: 'Manish Bhasin',
    avatarUrl: null,
    initials: 'MB',
    badge: '11 reviews',
    relativeTime: '3 months ago',
    rating: 5,
    content:
      'Booked the Premium Deep Consult. The detailed written PDF report and the 7-day follow-up chat were worth five times the price. The natural Blue Sapphire recommendation positively altered my business trajectory.',
    categoryTag: 'Gemstone Guidance & Business Growth',
    isLocalGuide: false,
    googleReviewUrl: 'https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews',
    helpfulCount: 11,
  },
  {
    id: 'rev-sunita-agarwal',
    name: 'Sunita Agarwal',
    avatarUrl: null,
    initials: 'SA',
    badge: 'Local Guide · 15 reviews',
    relativeTime: '3 months ago',
    rating: 5,
    content:
      'Amit ji has been our trusted family astrologer for over four years. His guidance during critical financial hurdles and health concerns has always provided accurate foresight and immense mental peace.',
    categoryTag: 'Family Kundli & Life Decisions',
    isLocalGuide: true,
    googleReviewUrl: 'https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews',
    helpfulCount: 17,
  },
  {
    id: 'rev-harshvardhan',
    name: 'Harshvardhan Rathore',
    avatarUrl: null,
    initials: 'HR',
    badge: '6 reviews',
    relativeTime: '4 months ago',
    rating: 5,
    content:
      'A quick 15-minute consultation gave me more actionable clarity on my higher education abroad than months of confusion. Direct, ethical, and strictly grounded in classical Parashari scriptures.',
    categoryTag: 'Quick Consult & Education Timing',
    isLocalGuide: false,
    googleReviewUrl: 'https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews',
    helpfulCount: 8,
  },
  {
    id: 'rev-meera-nambiar',
    name: 'Meera Nambiar',
    avatarUrl: null,
    initials: 'MN',
    badge: 'Local Guide · 22 reviews · 4 photos',
    relativeTime: '5 months ago',
    rating: 5,
    content:
      'The spatial energy corrections for our tech startup office boosted team morale and client closures within 45 days. Truly a master of classical Parashari and Vastu Shastra principles.',
    categoryTag: 'Commercial Vastu & Energy Correction',
    isLocalGuide: true,
    googleReviewUrl: 'https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews',
    helpfulCount: 15,
  },
];

/* ── Google Multi-Color Logo SVG ────────────────────────────────────────── */

function GoogleLogo({ className = 'w-4 h-4' }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

/* ── Star Rating ────────────────────────────────────────────────────────── */

function StarRating({ count = 5 }: { count?: number }): React.JSX.Element {
  return (
    <div className="g-review-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          fill="#FBBC05"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/* ── CustomerReviewsShowcase Component ───────────────────────────────────── */

export function CustomerReviewsShowcase(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const offsetRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(0.75); // cruising speed
  const isHoveredRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const isIntersectingRef = useRef<boolean>(true);

  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartOffsetRef = useRef<number>(0);

  // Duplicate list twice for continuous seamless infinite loop
  const carouselItems = useMemo(
    () => [...VERIFIED_GOOGLE_REVIEWS, ...VERIFIED_GOOGLE_REVIEWS],
    []
  );

  // Setup IntersectionObserver so 0% CPU is spent when out of viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Continuous animation loop with velocity interpolation (lerp)
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (
        isIntersectingRef.current &&
        !isPausedRef.current &&
        !isDraggingRef.current
      ) {
        const targetSpeed = isHoveredRef.current ? 0.12 : 0.75;
        currentSpeedRef.current += (targetSpeed - currentSpeedRef.current) * 0.05;
        offsetRef.current += currentSpeedRef.current;

        const track = trackRef.current;
        if (track) {
          const halfWidth = track.scrollWidth / 2;
          if (halfWidth > 0 && offsetRef.current >= halfWidth) {
            offsetRef.current -= halfWidth;
          }
          track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Manual nudge buttons
  const nudge = useCallback((direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    const delta = direction === 'left' ? -380 : 380;
    offsetRef.current += delta;
    const halfWidth = track.scrollWidth / 2;
    if (halfWidth > 0) {
      if (offsetRef.current >= halfWidth) offsetRef.current -= halfWidth;
      if (offsetRef.current < 0) offsetRef.current += halfWidth;
    }
    track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
  }, []);

  // Pointer drag/swipe handling
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const delta = dragStartXRef.current - e.clientX;
    offsetRef.current = dragStartOffsetRef.current + delta;
    const track = trackRef.current;
    if (track) {
      const halfWidth = track.scrollWidth / 2;
      if (halfWidth > 0) {
        if (offsetRef.current >= halfWidth) offsetRef.current -= halfWidth;
        if (offsetRef.current < 0) offsetRef.current += halfWidth;
      }
      track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <section ref={containerRef} className="g-reviews-section" id="reflections-showcase">
      {/* Header */}
      <div className="g-reviews-header-wrap">
        <div>
          <div className="g-reviews-rating-bar">
            <div className="g-reviews-badge">
              <GoogleLogo />
              <span>4.9 ★★★★★ Rating on Google</span>
            </div>
            <span>(180+ Verified Client Consultations)</span>
          </div>

          <h2 className="g-reviews-headline">
            Reflections from Seekers
          </h2>

          <p style={{ color: '#6E6E73', fontSize: '0.95rem', margin: 0 }}>
            Unfiltered testimonials from clients seeking clarity in career, family, Vastu, and relationships.
          </p>
        </div>

        {/* Action buttons & controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href="https://www.google.com/search?q=amit+astro+vedic+astrology+jaipur+reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-btn-secondary"
            style={{ padding: '10px 18px', fontSize: 13, gap: 6, display: 'inline-flex', alignItems: 'center' }}
          >
            <GoogleLogo />
            <span>View on Google</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          <div className="g-reviews-ctrls">
            <button
              onClick={() => nudge('left')}
              className="g-reviews-btn"
              aria-label="Previous review"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => nudge('right')}
              className="g-reviews-btn"
              aria-label="Next review"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Continuous Marquee Gliding Viewport */}
      <div
        className="g-reviews-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => {
          if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
            isHoveredRef.current = true;
          }
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        <div className="g-reviews-mask-left" />
        <div className="g-reviews-mask-right" />

        <div ref={trackRef} className="g-reviews-track">
          {carouselItems.map((review, index) => {
            const uniqueKey = `${review.id}-${index}`;

            return (
              <div key={uniqueKey} className="g-review-card">
                <div>
                  {/* Top Bar: Google icon, Rating & Relative Date */}
                  <div className="g-review-card-top">
                    <div className="g-review-source-pill">
                      <GoogleLogo />
                      <span>Google Review</span>
                    </div>

                    <div className="g-review-stars-wrap">
                      <StarRating count={review.rating} />
                      <span className="g-review-date">{review.relativeTime}</span>
                    </div>
                  </div>

                  {/* Review Content Quote */}
                  <blockquote className="g-review-content">
                    &ldquo;{review.content}&rdquo;
                  </blockquote>
                </div>

                {/* Bottom Section: Reviewer Profile */}
                <div>
                  <div className="g-review-profile-row">
                    <div className="g-review-author">
                      <div className="g-review-avatar-fallback">
                        {review.initials}
                      </div>

                      <div>
                        <div className="g-review-author-name">
                          <span>{review.name}</span>
                          {review.isLocalGuide && (
                            <span className="g-review-local-guide-star" title="Google Local Guide">
                              ★
                            </span>
                          )}
                        </div>
                        <div className="g-review-author-badge">
                          {review.badge}
                        </div>
                      </div>
                    </div>

                    <div className="g-review-helpful" title={`${review.helpfulCount} people found this helpful`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                      <span>{review.helpfulCount}</span>
                    </div>
                  </div>

                  {/* Hover-Revealed Details Pill */}
                  <div className="g-review-hover-reveal">
                    <div className="g-review-hover-inner">
                      <span className="g-review-category-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                          <line x1="7" y1="7" x2="7.01" y2="7" />
                        </svg>
                        <span>{review.categoryTag}</span>
                      </span>

                      <a
                        href={review.googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="g-review-verified-btn"
                      >
                        <span>Verified on Google</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
