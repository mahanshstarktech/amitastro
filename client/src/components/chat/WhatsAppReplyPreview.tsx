import React from 'react';
import { X, CornerUpLeft } from 'lucide-react';

interface WhatsAppReplyPreviewBarProps {
  senderName: string;
  content: string;
  onCancel: () => void;
  accentColor?: string;
}

export const WhatsAppReplyPreviewBar: React.FC<WhatsAppReplyPreviewBarProps> = ({
  senderName,
  content,
  onCancel,
  accentColor = '#00A884'
}) => {
  return (
    <div
      className="whatsapp-reply-preview-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px 6px 14px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E5EA',
        borderBottom: '1px solid #F0F2F5',
        position: 'relative',
        animation: 'whatsappSlideDown 0.18s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        {/* Left Accent Stripe */}
        <div
          style={{
            width: 4,
            height: 36,
            borderRadius: 4,
            backgroundColor: accentColor,
            flexShrink: 0
          }}
        />

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <CornerUpLeft size={12} />
            <span>Replying to {senderName}</span>
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: '#54656F',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 1
            }}
          >
            {content || 'Attachment'}
          </div>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 6,
          borderRadius: '50%',
          color: '#8696A0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s ease'
        }}
        title="Cancel reply"
        aria-label="Cancel reply"
      >
        <X size={18} />
      </button>
    </div>
  );
};

interface WhatsAppQuotedBubbleProps {
  senderName: string;
  content: string;
  accentColor?: string;
  onClick?: () => void;
}

export const WhatsAppQuotedBubble: React.FC<WhatsAppQuotedBubbleProps> = ({
  senderName,
  content,
  accentColor = '#00A884',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="whatsapp-quoted-bubble-inset"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        borderRadius: 8,
        overflow: 'hidden',
        margin: '2px 0 6px 0',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Left accent bar */}
      <div style={{ width: 4, backgroundColor: accentColor, flexShrink: 0, borderRadius: '4px 0 0 4px' }} />
      <div style={{ padding: '5px 8px', minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 1 }}>
          {senderName}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: '#3B4A54',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3
          }}
        >
          {content || 'Attachment'}
        </div>
      </div>
    </div>
  );
};
