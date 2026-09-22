import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../../utils/api';

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  duration?: string;
  isShort: boolean;
}

interface YouTubeData {
  data: YouTubeVideo[];
  channelTitle: string;
  channelUrl: string;
}

/* ── Fallback Dataset (Amit Astro) ─────────────────────────────────────── */

const FALLBACK_VIDEOS: YouTubeVideo[] = [
  // Landscape (16:9)
  {
    videoId: 'yt-ast-01',
    title: 'Understanding Rahu & Ketu Mahadasha: Karmic Shifts, Challenges & Remedial Measures',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-15T10:00:00Z',
    channelTitle: 'Amit Astro',
    duration: '18:24',
    isShort: false,
  },
  {
    videoId: 'yt-ast-02',
    title: 'Vastu for Wealth & Financial Flow: Directional Corrections Without Demolition',
    thumbnail: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-10T14:30:00Z',
    channelTitle: 'Amit Astro',
    duration: '22:15',
    isShort: false,
  },
  {
    videoId: 'yt-ast-03',
    title: 'Saturn Sade Sati Survival Guide: How to Turn Shani’s 7.5 Years into Greatest Growth',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-01T08:15:00Z',
    channelTitle: 'Amit Astro',
    duration: '25:40',
    isShort: false,
  },
  {
    videoId: 'yt-ast-04',
    title: 'Jupiter Transit & Planetary Combinations: Career Elevation & Timing Auspicious Events',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-07-25T16:00:00Z',
    channelTitle: 'Amit Astro',
    duration: '19:50',
    isShort: false,
  },
  {
    videoId: 'yt-ast-05',
    title: 'Navamsha (D9) Chart Decoded: Unlocking True Soul Purpose, Marriage & Dharma',
    thumbnail: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-07-15T11:20:00Z',
    channelTitle: 'Amit Astro',
    duration: '28:10',
    isShort: false,
  },
  {
    videoId: 'yt-ast-06',
    title: 'How to Identify Weak Planets in Your Kundli & Choose Authentic Vedic Gemstones',
    thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop&q=80',
    publishedAt: '2026-07-02T13:45:00Z',
    channelTitle: 'Amit Astro',
    duration: '16:45',
    isShort: false,
  },

  // Shorts (9:16)
  {
    videoId: 'yt-sht-01',
    title: '☀️ Daily Morning Remedy to Strengthen Surya (Sun) in 60 Seconds',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-20T07:00:00Z',
    channelTitle: 'Amit Astro',
    duration: '0:54',
    isShort: true,
  },
  {
    videoId: 'yt-sht-02',
    title: '🪞 Never Hang a Mirror in This Vastu Direction — Simple Home Energy Fix',
    thumbnail: 'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=600&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-18T15:20:00Z',
    channelTitle: 'Amit Astro',
    duration: '0:48',
    isShort: true,
  },
  {
    videoId: 'yt-sht-03',
    title: '🌙 Calming Overthinking: Powerful Moon (Chandra) Remedy Before Sleep',
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-16T18:45:00Z',
    channelTitle: 'Amit Astro',
    duration: '0:58',
    isShort: true,
  },
  {
    videoId: 'yt-sht-04',
    title: '⏰ Why 7:00 AM to 8:30 AM is Critical in Your Daily Horoscope',
    thumbnail: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=600&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-12T06:30:00Z',
    channelTitle: 'Amit Astro',
    duration: '0:42',
    isShort: true,
  },
  {
    videoId: 'yt-sht-05',
    title: '🎙️ Most Powerful Beej Mantra for Budh (Mercury) & Eloquent Speech',
    thumbnail: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=600&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-08T11:15:00Z',
    channelTitle: 'Amit Astro',
    duration: '0:50',
    isShort: true,
  },
  {
    videoId: 'yt-sht-06',
    title: '💧 North-East (Ishanya) Vastu Secret for Peace & Mental Clarity',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    publishedAt: '2026-08-04T16:00:00Z',
    channelTitle: 'Amit Astro',
    duration: '0:55',
    isShort: true,
  },
];

/* ── Showcase Dot Nav ──────────────────────────────────────────────────── */

interface DotNavProps {
  count: number;
  activeIndex: number;
  progress: number;
  isPlaying: boolean;
  onDotClick: (i: number) => void;
  onTogglePlay: () => void;
}

function DotNav({
  count,
  activeIndex,
  progress,
  isPlaying,
  onDotClick,
  onTogglePlay,
}: DotNavProps): React.JSX.Element {
  const R = 9;
  const C = 2 * Math.PI * R; // ~56.55

  return (
    <div className="yt-dotnav-container">
      <ul className="yt-dotnav-items" role="tablist">
        {Array.from({ length: count }).map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <li
              key={i}
              role="tab"
              aria-selected={isActive}
              className={`yt-dot${isActive ? ' yt-dot--active' : ''}`}
              onClick={() => onDotClick(i)}
            >
              {isActive && (
                <span
                  className="yt-dot__fill"
                  style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Play/Pause ring button */}
      <button
        className="yt-dotnav-playbtn"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.25"
          />
          {isPlaying && (
            <circle
              cx="12"
              cy="12"
              r={R}
              fill="none"
              stroke="#1D1D1F"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C - progress * C}
              transform="rotate(-90 12 12)"
            />
          )}
          {isPlaying ? (
            <g fill="currentColor">
              <rect x="8" y="7.5" width="2.5" height="9" rx="1" />
              <rect x="13.5" y="7.5" width="2.5" height="9" rx="1" />
            </g>
          ) : (
            <path d="M9.5 7.5v9l7-4.5-7-4.5z" fill="currentColor" />
          )}
        </svg>
      </button>
    </div>
  );
}

/* ── useCarousel hook ───────────────────────────────────────────────────── */

function useCarousel(
  originalCount: number,
  slideDurationMs: number,
  cardSelector = '.yt-snap-card',
  totalSets = 5
) {
  const middleSet = Math.floor(totalSets / 2);
  const [activeIndex, setActiveIndex] = useState(originalCount * middleSet);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const rAFRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(originalCount * middleSet);
  activeIndexRef.current = activeIndex;
  const isProgrammaticScrollRef = useRef(false);

  const cardCentersRef = useRef<number[]>([]);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  const measureCards = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>(cardSelector);
    if (cards.length > 0) {
      cardCentersRef.current = Array.from(cards).map(
        c => c.offsetLeft + c.clientWidth / 2
      );
    }
  }, [cardSelector]);

  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    const el = rowRef.current;
    if (!el) return;

    let pos = 0;
    if (cardCentersRef.current.length > idx && cardCentersRef.current[idx] !== undefined) {
      pos = Math.round(cardCentersRef.current[idx] - el.clientWidth / 2);
    } else {
      const cards = el.querySelectorAll<HTMLElement>(cardSelector);
      const card = cards[idx];
      if (!card) return;
      pos = Math.round(card.offsetLeft - el.clientWidth / 2 + card.clientWidth / 2);
      cardCentersRef.current = Array.from(cards).map(c => c.offsetLeft + c.clientWidth / 2);
    }

    setActiveIndex(idx);

    if (smooth) {
      progressRef.current = 0;
      setProgress(0);
      isProgrammaticScrollRef.current = true;
      el.style.scrollSnapType = 'none';
      el.scrollTo({ left: pos, behavior: 'smooth' });
      setTimeout(() => {
        if (el) el.style.scrollSnapType = 'x mandatory';
        isProgrammaticScrollRef.current = false;
      }, 400);
    } else {
      isProgrammaticScrollRef.current = true;
      el.style.scrollSnapType = 'none';
      el.scrollLeft = pos;
      requestAnimationFrame(() => {
        if (el) el.style.scrollSnapType = 'x mandatory';
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 120);
      });
    }
  }, [cardSelector]);

  const findClosestIndex = useCallback(() => {
    const el = rowRef.current;
    if (!el) return activeIndexRef.current;
    const center = el.scrollLeft + el.clientWidth / 2;
    const centers = cardCentersRef.current;
    if (!centers || centers.length === 0) return activeIndexRef.current;

    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const dist = Math.abs(center - centers[i]);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    return closest;
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const closest = findClosestIndex();

    if (closest !== activeIndexRef.current) {
      setActiveIndex(closest);
    }

    if (!isDraggingRef.current && !isProgrammaticScrollRef.current) {
      const minSafe = originalCount * middleSet;
      const maxSafe = originalCount * (middleSet + 1);
      if (closest < minSafe || closest >= maxSafe) {
        const relativeIndex = ((closest % originalCount) + originalCount) % originalCount;
        const targetMiddleIndex = originalCount * middleSet + relativeIndex;
        if (targetMiddleIndex !== closest) {
          scrollToIndex(targetMiddleIndex, false);
        }
      }
    }
  }, [findClosestIndex, originalCount, middleSet, scrollToIndex]);

  // Handle pointer interactions (drag and click handling)
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = rowRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = el.scrollLeft;
    dragDistanceRef.current = 0;
    el.style.scrollSnapType = 'none';
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = rowRef.current;
    if (!el) return;
    const dx = dragStartXRef.current - e.clientX;
    dragDistanceRef.current = Math.abs(dx);
    el.scrollLeft = dragStartScrollLeftRef.current + dx;
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = rowRef.current;
    if (el) el.style.scrollSnapType = 'x mandatory';
    updateActiveFromScroll();
  }, [updateActiveFromScroll]);

  const onPointerCancel = useCallback(() => {
    isDraggingRef.current = false;
    const el = rowRef.current;
    if (el) el.style.scrollSnapType = 'x mandatory';
  }, []);

  const onCardClick = useCallback((e: React.MouseEvent) => {
    // If the user was dragging/swiping, cancel link navigation
    if (dragDistanceRef.current > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // Measure on mount & resize
  useEffect(() => {
    measureCards();
    window.addEventListener('resize', measureCards);
    return () => window.removeEventListener('resize', measureCards);
  }, [measureCards]);

  // Initial center alignment
  useEffect(() => {
    const timer = setTimeout(() => {
      measureCards();
      scrollToIndex(originalCount * middleSet, false);
    }, 100);
    return () => clearTimeout(timer);
  }, [measureCards, originalCount, middleSet, scrollToIndex]);

  // Auto-play animation tick
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rAFRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (!isDraggingRef.current && !isProgrammaticScrollRef.current) {
        progressRef.current += dt / slideDurationMs;
        if (progressRef.current >= 1) {
          progressRef.current = 0;
          scrollToIndex(activeIndexRef.current + 1, true);
        }
        setProgress(progressRef.current);
      }

      rAFRef.current = requestAnimationFrame(loop);
    };

    rAFRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAFRef.current);
  }, [isPlaying, slideDurationMs, scrollToIndex]);

  return {
    rowRef,
    activeIndex,
    isPlaying,
    setIsPlaying,
    scrollToIndex,
    progress,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onCardClick,
  };
}

/* ── Video Card Component ───────────────────────────────────────────────── */

interface VideoCardProps {
  video: YouTubeVideo;
  index: number;
  variant: 'landscape' | 'portrait';
  isActive: boolean;
  onCardClick: (e: React.MouseEvent) => void;
}

const VideoCard = React.memo(function VideoCard({
  video,
  variant,
  isActive,
  onCardClick,
}: VideoCardProps): React.JSX.Element {
  const isLandscape = variant === 'landscape';
  const url = `https://www.youtube.com/watch?v=${video.videoId}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`yt-snap-card ${isLandscape ? 'yt-card--landscape' : 'yt-card--portrait'}${
        isActive ? ' yt-card--active' : ''
      }`}
      onClick={onCardClick}
      title={video.title}
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        loading="lazy"
        className="yt-card__img"
      />

      {/* Play button */}
      <div className="yt-card__play">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      {/* Duration badge */}
      {video.duration && (
        <span className="yt-duration-pill">{video.duration}</span>
      )}

      {/* Title overlay */}
      <div className="yt-card__overlay">
        <h3 className="yt-card__title">{video.title}</h3>
        <p className="yt-card__channel">{video.channelTitle}</p>
      </div>
    </a>
  );
});

/* ── Landscape Carousel Section ─────────────────────────────────────────── */

function LandscapeCarousel({
  videos,
  channelTitle,
  channelUrl,
}: {
  videos: YouTubeVideo[];
  channelTitle: string;
  channelUrl: string;
}): React.JSX.Element {
  const originalCount = videos.length;
  const loopVideos = useMemo(() => [...videos, ...videos, ...videos], [videos]);

  const {
    rowRef,
    activeIndex,
    isPlaying,
    setIsPlaying,
    scrollToIndex,
    progress,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onCardClick,
  } = useCarousel(originalCount, 6000, '.yt-card--landscape', 3);

  const cardsElements = useMemo(() => (
    loopVideos.map((v, i) => (
      <VideoCard
        key={`l-${v.videoId}-${i}`}
        video={v}
        index={i}
        variant="landscape"
        isActive={i === activeIndex}
        onCardClick={onCardClick}
      />
    ))
  ), [loopVideos, activeIndex, onCardClick]);

  return (
    <section className="yt-section yt-section--landscape" id="youtube-showcase">
      {/* Header */}
      <div className="yt-section-header">
        <div>
          <div className="yt-heading-row">
            <svg viewBox="0 0 28 20" width="34" height="24" fill="none">
              <rect width="28" height="20" rx="6" fill="#FF0000" />
              <path d="M11.5 14.5V6l7 4.25-7 4.25z" fill="#fff" />
            </svg>
            <h2 className="yt-heading">Watch on YouTube</h2>
          </div>
          <p className="yt-subheading">
            Vedic discourses, planetary transits &amp; Kundli wisdom from{' '}
            <span className="yt-channel-name">{channelTitle}</span>
          </p>
        </div>
        <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="yt-subscribe-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
          Subscribe
        </a>
      </div>

      {/* Scrollable track */}
      <div
        ref={rowRef}
        className="yt-row"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        <div className="yt-track">
          {cardsElements}
        </div>
      </div>

      {/* Dot nav */}
      <DotNav
        count={originalCount}
        activeIndex={activeIndex % originalCount}
        progress={progress}
        isPlaying={isPlaying}
        onDotClick={(i) => scrollToIndex(originalCount + i)}
        onTogglePlay={() => setIsPlaying(p => !p)}
      />
    </section>
  );
}

/* ── Shorts Carousel Section ────────────────────────────────────────────── */

function ShortsCarousel({
  videos,
  channelTitle,
  channelUrl,
}: {
  videos: YouTubeVideo[];
  channelTitle: string;
  channelUrl: string;
}): React.JSX.Element {
  const originalCount = videos.length;
  const loopVideos = useMemo(() => [...videos, ...videos, ...videos, ...videos, ...videos], [videos]);

  const {
    rowRef,
    activeIndex,
    isPlaying,
    setIsPlaying,
    scrollToIndex,
    progress,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onCardClick,
  } = useCarousel(originalCount, 4000, '.yt-card--portrait', 5);

  const cardsElements = useMemo(() => (
    loopVideos.map((v, i) => (
      <VideoCard
        key={`s-${v.videoId}-${i}`}
        video={v}
        index={i}
        variant="portrait"
        isActive={i === activeIndex}
        onCardClick={onCardClick}
      />
    ))
  ), [loopVideos, activeIndex, onCardClick]);

  return (
    <section className="yt-section yt-section--shorts" id="shorts-showcase">
      {/* Header */}
      <div className="yt-section-header">
        <div>
          <div className="yt-heading-row">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <rect width="24" height="24" rx="6" fill="#FF0000" />
              <path d="M13.5 4L7 13h5.5L10 20l9.5-10H14L16.5 4z" fill="#fff" />
            </svg>
            <h2 className="yt-heading">Glimpses &amp; Shorts</h2>
          </div>
          <p className="yt-subheading">
            Quick planetary remedies &amp; cosmic tips from{' '}
            <span className="yt-channel-name">{channelTitle}</span>
          </p>
        </div>
        <a
          href={`${channelUrl}/shorts`}
          target="_blank"
          rel="noopener noreferrer"
          className="yt-subscribe-btn yt-subscribe-btn--shorts"
        >
          View All Shorts
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
          </svg>
        </a>
      </div>

      {/* Scrollable track */}
      <div
        ref={rowRef}
        className="yt-row yt-row--shorts"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        <div className="yt-track yt-track--shorts">
          {cardsElements}
        </div>
      </div>

      {/* Dot nav */}
      <DotNav
        count={originalCount}
        activeIndex={activeIndex % originalCount}
        progress={progress}
        isPlaying={isPlaying}
        onDotClick={(i) => scrollToIndex(originalCount * 2 + i)}
        onTogglePlay={() => setIsPlaying(p => !p)}
      />
    </section>
  );
}

/* ── Main YouTubeShowcase Component ─────────────────────────────────────── */

export function YouTubeShowcase(): React.JSX.Element {
  const [ytData, setYtData] = useState<YouTubeData>({
    data: FALLBACK_VIDEOS,
    channelTitle: 'Amit Astro',
    channelUrl: 'https://www.youtube.com/@amitastro',
  });

  useEffect(() => {
    async function fetchVids(): Promise<void> {
      try {
        const res = await apiRequest<YouTubeData>('/youtube');
        if (res && res.data && res.data.length > 0) {
          setYtData(res);
        }
      } catch {
        // Fallback already preloaded
      }
    }
    void fetchVids();
  }, []);

  const videos = ytData.data;
  const landscapeVids = videos.filter(v => !v.isShort);
  const shortsVids = videos.filter(v => v.isShort);

  return (
    <>
      <LandscapeCarousel
        videos={landscapeVids.length > 0 ? landscapeVids : FALLBACK_VIDEOS.filter(v => !v.isShort)}
        channelTitle={ytData.channelTitle}
        channelUrl={ytData.channelUrl}
      />
      <ShortsCarousel
        videos={shortsVids.length > 0 ? shortsVids : FALLBACK_VIDEOS.filter(v => v.isShort)}
        channelTitle={ytData.channelTitle}
        channelUrl={ytData.channelUrl}
      />
    </>
  );
}
