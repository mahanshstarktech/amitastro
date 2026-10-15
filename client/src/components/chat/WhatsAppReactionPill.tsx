import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { WhatsAppEmojiPicker } from './WhatsAppEmojiPicker';

interface WhatsAppReactionPillProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
  align?: 'left' | 'right' | 'center';
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const WhatsAppReactionPill: React.FC<WhatsAppReactionPillProps> = ({
  onSelectEmoji,
  onClose,
  position = 'top',
  align = 'center'
}) => {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  return (
    <div
      ref={pillRef}
      className="whatsapp-reaction-pill-root"
      style={{
        position: 'absolute',
        [position === 'top' ? 'bottom' : 'top']: 'calc(100% + 6px)',
        [align === 'left' ? 'left' : align === 'right' ? 'right' : 'left']:
          align === 'center' ? '50%' : 0,
        transform: align === 'center' ? 'translateX(-50%)' : 'none',
        zIndex: 99990,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Quick 6 Reactions Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '4px 8px',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.16), 0 1px 4px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          animation: 'whatsappPopoverPop 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="whatsapp-reaction-pill-btn"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}

        {/* 2. Plus Button for Full WhatsApp Emoji Panel */}
        <button
          type="button"
          onClick={() => setShowFullPicker(!showFullPicker)}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: '#F0F2F5',
            color: '#54656F',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 2,
            transition: 'background-color 0.15s ease, transform 0.15s ease'
          }}
          title="More reactions"
          aria-label="More reactions"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 3. Advanced Emoji Picker when Plus button is toggled */}
      {showFullPicker && (
        <WhatsAppEmojiPicker
          onSelectEmoji={(emoji) => {
            onSelectEmoji(emoji);
            onClose();
          }}
          onClose={() => setShowFullPicker(false)}
          position={position}
          align={align}
        />
      )}
    </div>
  );
};
