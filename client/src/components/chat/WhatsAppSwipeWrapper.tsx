import React, { useState, useRef, useEffect } from 'react';
import { Reply } from 'lucide-react';

interface WhatsAppSwipeWrapperProps {
  children: React.ReactNode;
  onReply: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

export const WhatsAppSwipeWrapper: React.FC<WhatsAppSwipeWrapperProps> = ({
  children,
  onReply,
  onLongPress,
  disabled = false
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const hasTriggeredLongPressRef = useRef(false);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearLongPressTimer();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
    hasTriggeredLongPressRef.current = false;
    setIsSwiping(false);

    // Start long-press timer (450ms)
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      hasTriggeredLongPressRef.current = true;
      if (navigator.vibrate) {
        try { navigator.vibrate(30); } catch (_) {}
      }
      onLongPress?.();
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || hasTriggeredLongPressRef.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = currentY - startYRef.current;

    // Determine direction on first substantial movement
    if (isHorizontalRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        clearLongPressTimer();
        if (Math.abs(diffX) > Math.abs(diffY) && diffX > 0) {
          isHorizontalRef.current = true;
          setIsSwiping(true);
        } else {
          isHorizontalRef.current = false;
        }
      }
    }

    if (isHorizontalRef.current && diffX > 0) {
      // Damped horizontal swipe right (WhatsApp physics)
      const damped = Math.min(65, Math.pow(diffX, 0.85) * 1.5);
      setOffsetX(damped);
    }
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();
    if (hasTriggeredLongPressRef.current) {
      setOffsetX(0);
      setIsSwiping(false);
      return;
    }

    if (offsetX >= 36) {
      // Haptic feedback & trigger reply
      if (navigator.vibrate) {
        try { navigator.vibrate(20); } catch (_) {}
      }
      onReply();
    }

    // Spring snap back
    setOffsetX(0);
    setIsSwiping(false);
  };

  const thresholdRatio = Math.min(1, offsetX / 36);
  const isTriggered = offsetX >= 36;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        touchAction: isSwiping ? 'none' : 'pan-y'
      }}
    >
      {/* Emerging Circular Reply Icon on the left */}
      {offsetX > 4 && (
        <div
          style={{
            position: 'absolute',
            left: Math.max(4, offsetX - 32),
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: isTriggered ? '#00A884' : 'rgba(0, 0, 0, 0.08)',
            color: isTriggered ? '#FFFFFF' : '#54656F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${thresholdRatio}) rotate(${thresholdRatio * 45 - 45}deg)`,
            transition: isSwiping ? 'background-color 0.15s ease, color 0.15s ease' : 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          <Reply size={15} />
        </div>
      )}

      {/* Message Bubble Child with Smooth Translate & Spring Return */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {children}
      </div>
    </div>
  );
};
