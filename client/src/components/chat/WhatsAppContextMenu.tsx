import React, { useEffect, useRef } from 'react';
import {
  Reply,
  Smile,
  Star,
  Pin,
  Forward,
  Copy,
  Info,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export interface WhatsAppContextMenuProps {
  onReply: () => void;
  onReact: () => void;
  onStar: () => void;
  onPin: () => void;
  onForward: () => void;
  onCopy: () => void;
  onInfo: () => void;
  onDelete: () => void;
  onSelectMessages: () => void;
  onClose: () => void;
  isStarred?: boolean;
  isPinned?: boolean;
  position?: 'top' | 'bottom';
  align?: 'left' | 'right';
}

export const WhatsAppContextMenu: React.FC<WhatsAppContextMenuProps> = ({
  onReply,
  onReact,
  onStar,
  onPin,
  onForward,
  onCopy,
  onInfo,
  onDelete,
  onSelectMessages,
  onClose,
  isStarred = false,
  isPinned = false,
  position = 'bottom',
  align = 'right'
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const menuItems = [
    { id: 'reply', label: 'Reply', icon: Reply, action: onReply },
    { id: 'react', label: 'React', icon: Smile, action: onReact },
    { id: 'star', label: isStarred ? 'Unstar' : 'Star', icon: Star, action: onStar },
    { id: 'pin', label: isPinned ? 'Unpin' : 'Pin', icon: Pin, action: onPin },
    { id: 'forward', label: 'Forward', icon: Forward, action: onForward },
    { id: 'copy', label: 'Copy', icon: Copy, action: onCopy },
    { id: 'info', label: 'Info', icon: Info, action: onInfo },
    { id: 'divider-1', isDivider: true },
    { id: 'delete', label: 'Delete', icon: Trash2, action: onDelete },
    { id: 'divider-2', isDivider: true },
    { id: 'select', label: 'Select messages', icon: CheckCircle2, action: onSelectMessages }
  ];

  return (
    <div
      ref={menuRef}
      className="whatsapp-context-menu-root"
      style={{
        position: 'absolute',
        [position === 'top' ? 'bottom' : 'top']: 'calc(100% + 4px)',
        [align === 'left' ? 'left' : 'right']: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '6px 0',
        minWidth: 190,
        zIndex: 99995,
        userSelect: 'none',
        animation: 'whatsappPopoverPop 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item) => {
        if (item.isDivider) {
          return (
            <div
              key={item.id}
              style={{
                height: 1,
                backgroundColor: '#E5E5EA',
                margin: '5px 0'
              }}
            />
          );
        }

        const IconComponent = item.icon!;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              item.action?.();
              onClose();
            }}
            className="whatsapp-menu-item"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: '#111B21',
              textAlign: 'left',
              transition: 'background-color 0.12s ease, color 0.12s ease'
            }}
          >
            <IconComponent size={16} className="whatsapp-menu-item-icon" />
            <span style={{ flex: 1 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
