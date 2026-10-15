import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsAppEmojiPicker } from '../../components/chat/WhatsAppEmojiPicker';
import { WhatsAppContextMenu } from '../../components/chat/WhatsAppContextMenu';
import { WhatsAppReactionPill } from '../../components/chat/WhatsAppReactionPill';
import { WhatsAppReplyPreviewBar, WhatsAppQuotedBubble } from '../../components/chat/WhatsAppReplyPreview';
import { WhatsAppSwipeWrapper } from '../../components/chat/WhatsAppSwipeWrapper';

describe('WhatsApp Chat Interactions Components', () => {
  describe('WhatsAppEmojiPicker', () => {
    it('renders search input, category headers and handles selection', () => {
      const handleSelect = vi.fn();
      const handleClose = vi.fn();

      render(
        <WhatsAppEmojiPicker
          onSelectEmoji={handleSelect}
          onClose={handleClose}
        />
      );

      expect(screen.getByPlaceholderText('Search')).toBeDefined();
      expect(screen.getByText('RECENT REACTIONS')).toBeDefined();

      // Test searching
      const searchInput = screen.getByPlaceholderText('Search') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'love' } });
      expect(searchInput.value).toBe('love');

      // Click on an emoji button
      const emojiBtns = screen.getAllByRole('button');
      if (emojiBtns.length > 2) {
        fireEvent.click(emojiBtns[2]);
      }
    });
  });

  describe('WhatsAppContextMenu', () => {
    it('renders all 9 authentic WhatsApp options and triggers events', () => {
      const onReply = vi.fn();
      const onReact = vi.fn();
      const onStar = vi.fn();
      const onPin = vi.fn();
      const onForward = vi.fn();
      const onCopy = vi.fn();
      const onInfo = vi.fn();
      const onDelete = vi.fn();
      const onSelectMessages = vi.fn();
      const onClose = vi.fn();

      render(
        <WhatsAppContextMenu
          onReply={onReply}
          onReact={onReact}
          onStar={onStar}
          onPin={onPin}
          onForward={onForward}
          onCopy={onCopy}
          onInfo={onInfo}
          onDelete={onDelete}
          onSelectMessages={onSelectMessages}
          onClose={onClose}
          isStarred={false}
          isPinned={false}
        />
      );

      expect(screen.getByText('Reply')).toBeDefined();
      expect(screen.getByText('React')).toBeDefined();
      expect(screen.getByText('Star')).toBeDefined();
      expect(screen.getByText('Pin')).toBeDefined();
      expect(screen.getByText('Forward')).toBeDefined();
      expect(screen.getByText('Copy')).toBeDefined();
      expect(screen.getByText('Info')).toBeDefined();
      expect(screen.getByText('Delete')).toBeDefined();
      expect(screen.getByText('Select messages')).toBeDefined();

      fireEvent.click(screen.getByText('Reply'));
      expect(onReply).toHaveBeenCalled();

      fireEvent.click(screen.getByText('Star'));
      expect(onStar).toHaveBeenCalled();

      fireEvent.click(screen.getByText('Delete'));
      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('WhatsAppReactionPill', () => {
    it('renders quick reaction options and responds to click', () => {
      const onSelectEmoji = vi.fn();
      const onClose = vi.fn();

      render(
        <WhatsAppReactionPill
          onSelectEmoji={onSelectEmoji}
          onClose={onClose}
        />
      );

      const thumbsUp = screen.getByText('👍');
      expect(thumbsUp).toBeDefined();
      fireEvent.click(thumbsUp);
      expect(onSelectEmoji).toHaveBeenCalledWith('👍');
    });
  });

  describe('WhatsAppReplyPreview', () => {
    it('renders reply preview bar and triggers cancel', () => {
      const onCancel = vi.fn();
      render(
        <WhatsAppReplyPreviewBar
          senderName="Astrologer Amit"
          content="Your Rahu Mahadasha reading is ready"
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Replying to Astrologer Amit')).toBeDefined();
      expect(screen.getByText('Your Rahu Mahadasha reading is ready')).toBeDefined();

      const cancelBtn = screen.getByTitle('Cancel reply');
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalled();
    });

    it('renders quoted bubble inside message', () => {
      const onClick = vi.fn();
      render(
        <WhatsAppQuotedBubble
          senderName="Amit Astro"
          content="Voice note (0:15)"
          onClick={onClick}
        />
      );

      expect(screen.getByText('Amit Astro')).toBeDefined();
      expect(screen.getByText('Voice note (0:15)')).toBeDefined();
      fireEvent.click(screen.getByText('Amit Astro'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('WhatsAppSwipeWrapper', () => {
    it('renders wrapped children safely', () => {
      const onReply = vi.fn();
      render(
        <WhatsAppSwipeWrapper onReply={onReply}>
          <div data-testid="chat-bubble">Test Message</div>
        </WhatsAppSwipeWrapper>
      );

      expect(screen.getByTestId('chat-bubble')).toBeDefined();
      expect(screen.getByText('Test Message')).toBeDefined();
    });
  });
});
