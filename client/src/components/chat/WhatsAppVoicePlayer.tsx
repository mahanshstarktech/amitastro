import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, CheckCheck, Mic } from 'lucide-react';

interface WhatsAppVoicePlayerProps {
  id: string;
  audioUrl?: string;
  durationSeconds?: number;
  isMe: boolean;
  senderName?: string;
  senderPhoto?: string;
  timestamp: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

// Deterministic natural voice waveform bar heights (32 bars)
const WAVEFORM_BARS = [
  6, 10, 16, 22, 14, 8, 12, 20, 26, 18, 12, 16, 24, 20, 14, 10,
  18, 24, 22, 16, 12, 20, 26, 18, 14, 10, 16, 22, 14, 10, 8, 6
];

export const WhatsAppVoicePlayer: React.FC<WhatsAppVoicePlayerProps> = ({
  id,
  audioUrl,
  durationSeconds = 4,
  isMe,
  senderName,
  senderPhoto,
  timestamp,
  isPlaying,
  onTogglePlay
}) => {
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthAudioCtxRef = useRef<AudioContext | null>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const duration = durationSeconds > 0 ? durationSeconds : 4;

  // Format mm:ss
  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  // Toggle playback rate: 1x -> 1.5x -> 2x
  const handleToggleRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // Real or synthetic audio playback management
  useEffect(() => {
    if (!isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (synthOscRef.current) {
        try {
          synthOscRef.current.stop();
        } catch (_) {}
        synthOscRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    if (audioUrl) {
      // Play real recorded audio blob
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      }
      const audio = audioRef.current;
      audio.playbackRate = playbackRate;
      audio.currentTime = currentTime;

      audio.play().catch(() => {});

      const onTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      const onEnded = () => {
        setCurrentTime(0);
        onTogglePlay();
      };

      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audio.pause();
      };
    } else {
      // Simulated soothing harmonic synthesizer for voice preview
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        synthAudioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        synthOscRef.current = osc;

        startTimeRef.current = performance.now() - (currentTime / playbackRate) * 1000;

        const updateTick = () => {
          const elapsed = ((performance.now() - startTimeRef.current) / 1000) * playbackRate;
          if (elapsed >= duration) {
            setCurrentTime(0);
            try {
              osc.stop();
            } catch (_) {}
            onTogglePlay();
          } else {
            setCurrentTime(elapsed);
            animationFrameRef.current = requestAnimationFrame(updateTick);
          }
        };
        animationFrameRef.current = requestAnimationFrame(updateTick);
      } catch (_) {}

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (synthOscRef.current) {
          try {
            synthOscRef.current.stop();
          } catch (_) {}
          synthOscRef.current = null;
        }
      };
    }
  }, [isPlaying, audioUrl, duration, playbackRate]);

  // Click on waveform to scrub
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    if (!isPlaying) {
      onTogglePlay();
    }
  };

  const progressRatio = Math.max(0, Math.min(1, currentTime / duration));
  const activeBarIndex = Math.floor(progressRatio * WAVEFORM_BARS.length);

  return (
    <div
      className={`hybrid-bubble ${isMe ? 'hybrid-bubble-out' : 'hybrid-bubble-in'}`}
      style={{
        padding: '7px 11px 6px 10px',
        minWidth: 280,
        maxWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        userSelect: 'none'
      }}
    >
      {/* Upper Interactive Row: Avatar/Speed + Play/Pause + Waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Left: Avatar with green mic badge, OR 1x / 1.5x / 2x speed pill when playing */}
        {isPlaying ? (
          <button
            type="button"
            onClick={handleToggleRate}
            title="Adjust playback speed"
            aria-label="Adjust playback speed"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#005C4B',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.1s ease'
            }}
          >
            {playbackRate}x
          </button>
        ) : (
          <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
            {senderPhoto ? (
              <img
                src={senderPhoto}
                alt={senderName || 'Sender'}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: isMe ? '#25D366' : '#C9A24B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14
                }}
              >
                {(senderName || (isMe ? 'U' : 'A')).charAt(0).toUpperCase()}
              </div>
            )}
            {/* Small green mic badge at bottom right */}
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: '#25D366',
                border: '1.5px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <Mic size={8} strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={onTogglePlay}
          style={{
            background: 'none',
            border: 'none',
            color: '#54656F',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          title={isPlaying ? 'Pause' : 'Play voice note'}
          aria-label={isPlaying ? 'Pause' : 'Play voice note'}
        >
          {isPlaying ? (
            <Pause size={24} color="#54656F" fill="#54656F" />
          ) : (
            <Play size={24} color="#54656F" fill="#54656F" style={{ marginLeft: 2 }} />
          )}
        </button>

        {/* Waveform with scrubber knob */}
        <div
          onClick={handleWaveformClick}
          style={{
            flex: 1,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            cursor: 'pointer',
            padding: '0 4px'
          }}
          title="Click to seek"
          aria-label="Seek voice note waveform"
        >
          {/* Waveform Bars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              gap: 2
            }}
          >
            {WAVEFORM_BARS.map((barHeight, idx) => {
              const isPlayed = idx <= activeBarIndex;
              return (
                <div
                  key={idx}
                  style={{
                    width: 2.5,
                    height: barHeight,
                    borderRadius: 2,
                    backgroundColor: isPlayed ? '#00A884' : '#8696A0',
                    transition: 'background-color 0.1s ease',
                    flexShrink: 0
                  }}
                />
              );
            })}
          </div>

          {/* Draggable/Interactive Scrub Knob */}
          <div
            data-testid="scrubber-knob"
            aria-label="Scrub knob"
            style={{
              position: 'absolute',
              left: `calc(${progressRatio * 100}% - 5px)`,
              width: 11,
              height: 11,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '2px solid #00A884',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
              pointerEvents: 'none',
              transition: isPlaying ? 'none' : 'left 0.1s ease'
            }}
          />
        </div>
      </div>

      {/* Sub Row: Duration / Progress on left, Timestamp + Ticks on right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 46,
          fontSize: 11,
          color: '#667781',
          lineHeight: 1
        }}
      >
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          {isPlaying ? formatTime(currentTime) : formatTime(duration)}
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            color: '#667781',
            fontSize: 11
          }}
        >
          <span>{timestamp}</span>
          {isMe && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <CheckCheck size={14} color="#53BDEB" />
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
