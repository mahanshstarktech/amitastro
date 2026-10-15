import React, { useState } from 'react';
import { X, Forward, Check, Copy } from 'lucide-react';

interface WhatsAppForwardModalProps {
  content: string;
  onForward: (target: string) => void;
  onClose: () => void;
}

export const WhatsAppForwardModal: React.FC<WhatsAppForwardModalProps> = ({
  content,
  onForward,
  onClose
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'amit' | 'family' | 'clipboard'>('amit');
  const [copied, setCopied] = useState(false);

  const handleExecute = () => {
    if (selectedTarget === 'clipboard') {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => {
        onClose();
      }, 800);
      return;
    }
    onForward(selectedTarget === 'amit' ? 'Amit Astro' : 'Family Member');
    onClose();
  };

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
          maxWidth: 400,
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
          <span style={{ fontWeight: 600, fontSize: 16, color: '#111B21' }}>Forward message</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#54656F'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              backgroundColor: '#F2F2F7',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#54656F',
              fontStyle: 'italic',
              maxHeight: 80,
              overflowY: 'auto'
            }}
          >
            "{content}"
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: '#111B21', marginTop: 4 }}>
            Choose Destination
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid',
                borderColor: selectedTarget === 'amit' ? '#00A884' : '#E5E5EA',
                backgroundColor: selectedTarget === 'amit' ? '#F0FAF6' : '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="fwd"
                checked={selectedTarget === 'amit'}
                onChange={() => setSelectedTarget('amit')}
                style={{ accentColor: '#00A884' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111B21' }}>Amit Astro (Vedic Line)</div>
                <div style={{ fontSize: 11.5, color: '#667781' }}>Quote in ongoing astrologer consultation</div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid',
                borderColor: selectedTarget === 'clipboard' ? '#00A884' : '#E5E5EA',
                backgroundColor: selectedTarget === 'clipboard' ? '#F0FAF6' : '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="fwd"
                checked={selectedTarget === 'clipboard'}
                onChange={() => setSelectedTarget('clipboard')}
                style={{ accentColor: '#00A884' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111B21' }}>Copy to Clipboard</div>
                <div style={{ fontSize: 11.5, color: '#667781' }}>Paste anywhere or share externally</div>
              </div>
            </label>
          </div>
        </div>

        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid #E5E5EA',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            backgroundColor: '#F8F9FA'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="apple-btn-secondary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="apple-btn-primary"
            style={{
              padding: '8px 18px',
              fontSize: 13,
              backgroundColor: '#00A884',
              borderColor: '#00A884',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {copied ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : selectedTarget === 'clipboard' ? (
              <>
                <Copy size={14} /> Copy
              </>
            ) : (
              <>
                <Forward size={14} /> Forward
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
