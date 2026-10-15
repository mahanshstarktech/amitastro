import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Clock,
  Smile,
  PawPrint,
  Coffee,
  Trophy,
  Car,
  Lightbulb,
  Hash,
  Flag
} from 'lucide-react';

interface WhatsAppEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
  align?: 'left' | 'right' | 'center';
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ size: number; color?: string }>;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'SMILEYS & PEOPLE',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔',
      '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏',
      '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪',
      '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳',
      '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁',
      '☹️', '😮', '😯', '😲', '😳', '🥺', '🥹', '😦',
      '😧', '🤲', '👐', '🙌', '👏', '🤝', '👍', '👎',
      '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🫰', '🤟',
      '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇',
      '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '🫶',
      '✍️', '🙏', '💪', '🧠', '🫀', '🫁', '👀', '👁️'
    ]
  },
  {
    id: 'animals',
    name: 'ANIMALS & NATURE',
    icon: PawPrint,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌',
      '🐞', '🐜', '🪰', '🪲', '🪳', '🪴', '🌲', '🌳',
      '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂',
      '🍃', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛',
      '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '✨'
    ]
  },
  {
    id: 'food',
    name: 'FOOD & DRINK',
    icon: Coffee,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
      '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
      '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽',
      '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞',
      '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇',
      '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕',
      '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🍝',
      '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '☕️'
    ]
  },
  {
    id: 'activities',
    name: 'ACTIVITIES',
    icon: Trophy,
    emojis: [
      '⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿',
      '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌',
      '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '🤺', '🧘',
      '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎟️', '🎪'
    ]
  },
  {
    id: 'travel',
    name: 'TRAVEL & PLACES',
    icon: Car,
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
      '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🚲',
      '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖',
      '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄',
      '✈️', '🛫', '🛬', '🚀', '🛸', '🚁', '⛵️', '🚢',
      '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏛️'
    ]
  },
  {
    id: 'objects',
    name: 'OBJECTS',
    icon: Lightbulb,
    emojis: [
      '⌚️', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
      '📷', '📸', '📹', '🎥', '📞', '☎️', '📺', '📻',
      '🎙️', '🧭', '⏱️', '⏰', '🕰️', '⌛️', '⏳', '💡',
      '🔦', '🕯️', '🪔', '💸', '💵', '💴', '💶', '🪙',
      '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '📦'
    ]
  },
  {
    id: 'symbols',
    name: 'SYMBOLS',
    icon: Hash,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓',
      '💗', '💖', '💘', '💝', '☮️', '✝️', '☪️', '🕉️',
      '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎',
      '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️',
      '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '💯', '✅'
    ]
  },
  {
    id: 'flags',
    name: 'FLAGS',
    icon: Flag,
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
      '🇮🇳', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇯🇵',
      '🇨🇳', '🇧🇷', '🇿🇦', '🇷🇺', '🇪🇸', '🇮🇹', '🇦🇪', '🇸🇬'
    ]
  }
];

const DEFAULT_RECENT = ['❤️', '🫶', '😂', '🔥', '✨', '🙏'];

export const WhatsAppEmojiPicker: React.FC<WhatsAppEmojiPickerProps> = ({
  onSelectEmoji,
  onClose,
  position = 'top',
  align = 'center'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('recent');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('amit_recent_emojis');
      return saved ? JSON.parse(saved) : DEFAULT_RECENT;
    } catch (_) {
      return DEFAULT_RECENT;
    }
  });

  const pickerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    // Save to recents
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 16);
    setRecentEmojis(updated);
    try {
      localStorage.setItem('amit_recent_emojis', JSON.stringify(updated));
    } catch (_) {}

    onSelectEmoji(emoji);
    onClose();
  };

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'recent') {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const section = sectionRefs.current[catId];
    if (section && scrollContainerRef.current) {
      const topPos = section.offsetTop - scrollContainerRef.current.offsetTop;
      scrollContainerRef.current.scrollTo({ top: topPos, behavior: 'smooth' });
    }
  };

  // Filter emojis when search query is present
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return Array.from(new Set(all));
  }, [searchQuery]);

  return (
    <div
      ref={pickerRef}
      className="whatsapp-emoji-picker-container"
      style={{
        position: 'absolute',
        [position === 'top' ? 'bottom' : 'top']: 'calc(100% + 10px)',
        [align === 'left' ? 'left' : align === 'right' ? 'right' : 'left']:
          align === 'center' ? '50%' : 0,
        transform: align === 'center' ? 'translateX(-50%)' : 'none',
        width: 330,
        height: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99999,
        overflow: 'hidden',
        userSelect: 'none',
        animation: 'whatsappPopoverPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Notch arrow pointing to anchor trigger */}
      <div
        style={{
          position: 'absolute',
          [position === 'top' ? 'bottom' : 'top']: -6,
          left: align === 'center' ? '50%' : align === 'left' ? 24 : 'calc(100% - 24px)',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 12,
          height: 12,
          backgroundColor: '#FFFFFF',
          borderRight: position === 'top' ? '1px solid rgba(0,0,0,0.08)' : 'none',
          borderBottom: position === 'top' ? '1px solid rgba(0,0,0,0.08)' : 'none',
          borderLeft: position === 'bottom' ? '1px solid rgba(0,0,0,0.08)' : 'none',
          borderTop: position === 'bottom' ? '1px solid rgba(0,0,0,0.08)' : 'none',
          zIndex: 1
        }}
      />

      {/* Top Search Bar (WhatsApp style with green border focus) */}
      <div
        style={{
          padding: '10px 12px 6px 12px',
          borderBottom: '1px solid #F0F2F5',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F0F2F5',
            borderRadius: 18,
            padding: '5px 10px',
            gap: 8
          }}
        >
          <Search size={15} color="#8696A0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              color: '#111B21',
              outline: 'none',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: '#8696A0',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Emojis Grid (8 columns per row, matching WhatsApp) */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
          minHeight: 0
        }}
      >
        {searchResults ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8696A0', padding: '4px 6px 6px' }}>
              SEARCH RESULTS
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 4
              }}
            >
              {searchResults.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="whatsapp-emoji-item"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 22,
                    cursor: 'pointer',
                    padding: '4px 0',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s ease, background-color 0.1s ease'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 1. RECENT REACTIONS (WhatsApp Default Header) */}
            {recentEmojis.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8696A0', padding: '2px 6px 6px' }}>
                  RECENT REACTIONS
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: 4
                  }}
                >
                  {recentEmojis.slice(0, 8).map((emoji, idx) => (
                    <button
                      key={`recent-${idx}`}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="whatsapp-emoji-item"
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 22,
                        cursor: 'pointer',
                        padding: '4px 0',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s ease, background-color 0.1s ease'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CATEGORIZED EMOJI SECTIONS */}
            {EMOJI_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                ref={(el) => {
                  sectionRefs.current[cat.id] = el;
                }}
                style={{ marginBottom: 14 }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8696A0', padding: '4px 6px 6px' }}>
                  {cat.name}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: 4
                  }}
                >
                  {cat.emojis.map((emoji, idx) => (
                    <button
                      key={`${cat.id}-${idx}`}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="whatsapp-emoji-item"
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 22,
                        cursor: 'pointer',
                        padding: '4px 0',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s ease, background-color 0.1s ease'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom Category Tabs Navigation Bar (Authentic WhatsApp 9 icons) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 42,
          borderTop: '1px solid #F0F2F5',
          backgroundColor: '#FFFFFF',
          padding: '0 4px',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={() => scrollToCategory('recent')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
            color: activeCategory === 'recent' ? '#00A884' : '#8696A0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
          title="Recent"
        >
          <Clock size={18} />
        </button>

        {EMOJI_CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => scrollToCategory(cat.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                color: isActive ? '#00A884' : '#8696A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              title={cat.name}
            >
              <IconComponent size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
