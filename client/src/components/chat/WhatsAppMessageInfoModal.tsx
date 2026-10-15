import React from 'react';
import { X, CheckCheck, Check } from 'lucide-react';

interface WhatsAppMessageInfoModalProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    is_read: number;
    sender_type: string;
    attachment_url?: string;
    message_type?: string;
  };
  onClose: () => void;
}

export const WhatsAppMessageInfoModal: React.FC<WhatsAppMessageInfoModalProps> = ({
  message,
  onClose
}) => {
  const sentDate = new Date(message.created_at);
  const timeStr = sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = sentDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'whatsappPopoverPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            height: 52,
            padding: '0 18px',
            borderBottom: '1px solid #E5E5EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F0F2F5'
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 16, color: '#111B21' }}>Message info</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#54656F',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Bubble Preview */}
        <div style={{ padding: '20px 20px 14px', backgroundColor: '#F2F2F7' }}>
          <div
            style={{
              backgroundColor: message.sender_type === 'customer' ? '#E7FFDB' : '#FFFFFF',
              borderRadius: 12,
              padding: '8px 12px',
              maxWidth: '85%',
              marginLeft: message.sender_type === 'customer' ? 'auto' : 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              fontSize: 14,
              color: '#111B21',
              wordBreak: 'break-word'
            }}
          >
            {message.attachment_url && message.message_type !== 'voice' && (
              <img
                src={message.attachment_url}
                alt="Attachment"
                style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
              />
            )}
            <div>{message.content}</div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#667781', marginTop: 4 }}>
              {timeStr}
            </div>
          </div>
        </div>

        {/* Status Rows */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Read Status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ marginTop: 2 }}>
              <CheckCheck size={18} color={message.is_read ? '#53BDEB' : '#8696A0'} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111B21' }}>
                {message.is_read ? 'Read' : 'Delivered (Unread)'}
              </div>
              <div style={{ fontSize: 12, color: '#667781', marginTop: 2 }}>
                {message.is_read ? `${dateStr} at ${timeStr}` : 'Waiting for recipient'}
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: '#E5E5EA' }} />

          {/* Delivered Status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ marginTop: 2 }}>
              <CheckCheck size={18} color="#8696A0" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111B21' }}>Delivered</div>
              <div style={{ fontSize: 12, color: '#667781', marginTop: 2 }}>
                {dateStr} at {timeStr}
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: '#E5E5EA' }} />

          {/* Sent Status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ marginTop: 2 }}>
              <Check size={18} color="#8696A0" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111B21' }}>Sent</div>
              <div style={{ fontSize: 12, color: '#667781', marginTop: 2 }}>
                {dateStr} at {timeStr}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
