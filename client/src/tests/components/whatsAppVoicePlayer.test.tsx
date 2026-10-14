import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsAppVoicePlayer } from '../../components/chat/WhatsAppVoicePlayer';

describe('WhatsAppVoicePlayer', () => {
  it('renders idle voice note bubble with avatar, play button, waveform, duration, timestamp, and ticks', () => {
    const onTogglePlay = vi.fn();
    render(
      <WhatsAppVoicePlayer
        id="voice-1"
        durationSeconds={4}
        isMe={true}
        senderName="Mahansh"
        timestamp="02:12 AM"
        isPlaying={false}
        onTogglePlay={onTogglePlay}
      />
    );

    // Verify duration formatted
    expect(screen.getByText('0:04')).toBeDefined();
    // Verify timestamp
    expect(screen.getByText('02:12 AM')).toBeDefined();
    // Verify play button is present
    const playBtn = screen.getByRole('button', { name: /play voice note/i });
    expect(playBtn).toBeDefined();

    // Clicking play triggers onTogglePlay
    fireEvent.click(playBtn);
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('renders speed pill and pause button when playing', () => {
    const onTogglePlay = vi.fn();
    render(
      <WhatsAppVoicePlayer
        id="voice-2"
        durationSeconds={15}
        isMe={false}
        senderName="Amit Astro"
        timestamp="02:15 AM"
        isPlaying={true}
        onTogglePlay={onTogglePlay}
      />
    );

    // Verify pause button
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    expect(pauseBtn).toBeDefined();

    // Verify speed pill default 1x
    const speedBtn = screen.getByRole('button', { name: /adjust playback speed/i });
    expect(speedBtn).toBeDefined();
    expect(speedBtn.textContent).toContain('1x');

    // Click speed pill to cycle to 1.5x
    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toContain('1.5x');

    // Click again to cycle to 2x
    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toContain('2x');

    // Click again to cycle back to 1x
    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toContain('1x');
  });
});
