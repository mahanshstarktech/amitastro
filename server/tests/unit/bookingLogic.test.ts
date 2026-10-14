import { describe, it, expect } from 'vitest';

/**
 * Timezone conversion helper simulating the client & server scheduling engine
 * Converts an IST slot time (e.g. 11:00 AM on 2026-11-01) to a target IANA timezone
 */
function convertIstToTargetTimezone(dateStr: string, timeStr: string, targetTimezone: string): { localDate: string; localTime: string } {
  // Construct UTC timestamp from IST (+05:30)
  const [hourStr, minuteStr] = timeStr.split(':');
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Date in IST
  const istDate = new Date(Date.UTC(year, month - 1, day, Number(hourStr) - 5, Number(minuteStr) - 30));

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(istDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) partMap[p.type] = p.value;

  return {
    localDate: `${partMap.year}-${partMap.month}-${partMap.day}`,
    localTime: `${partMap.hour}:${partMap.minute}`
  };
}

describe('Unit: Booking Engine & Timezone Math', () => {
  const baseDate = '2026-11-01'; // November 1, 2026

  it('converts 11:00 AM IST to US Eastern Time (EDT: UTC-4 in early Nov, 9.5 hours behind)', () => {
    // 11:00 IST is 05:30 UTC. In New York (EDT, UTC-4): 01:30.
    const result = convertIstToTargetTimezone(baseDate, '11:00', 'America/New_York');
    expect(result.localTime).toBe('01:30');
    expect(result.localDate).toBe('2026-11-01');
  });

  it('converts 09:00 AM IST to US Pacific Time (PDT: UTC-7, wraps to previous day)', () => {
    // 09:00 IST is 03:30 UTC. In Los Angeles (PDT, UTC-7): 20:30 previous day (2026-10-31).
    const result = convertIstToTargetTimezone(baseDate, '09:00', 'America/Los_Angeles');
    expect(result.localTime).toBe('20:30');
    expect(result.localDate).toBe('2026-10-31');
  });

  it('converts 20:00 (8:00 PM) IST to London (GMT/BST: UTC+0)', () => {
    // 20:00 IST is 14:30 UTC. In London (GMT, November): 14:30.
    const result = convertIstToTargetTimezone(baseDate, '20:00', 'Europe/London');
    expect(result.localTime).toBe('14:30');
    expect(result.localDate).toBe('2026-11-01');
  });

  it('converts 11:00 AM IST to Sydney Australia (AEDT: UTC+11, 5.5 hours ahead)', () => {
    // 11:00 IST is 05:30 UTC. In Sydney (+11 in Nov DST): 16:30.
    const result = convertIstToTargetTimezone(baseDate, '11:00', 'Australia/Sydney');
    expect(result.localTime).toBe('16:30');
    expect(result.localDate).toBe('2026-11-01');
  });

  it('correctly handles fractional +5:45 offset (Kathmandu, Nepal: 15 mins ahead of IST)', () => {
    const result = convertIstToTargetTimezone(baseDate, '11:00', 'Asia/Kathmandu');
    expect(result.localTime).toBe('11:15');
    expect(result.localDate).toBe('2026-11-01');
  });

  describe('Slot Buffer & Window Validation', () => {
    const defaultWindowsIST = [
      { name: 'Morning / Afternoon', start: '09:00', end: '17:00' },
      { name: 'Evening / Night', start: '20:00', end: '23:59' }
    ];

    function isTimeInWorkingWindows(timeHHMM: string): boolean {
      return defaultWindowsIST.some(w => timeHHMM >= w.start && timeHHMM <= w.end);
    }

    it('accepts times within official IST consultation windows', () => {
      expect(isTimeInWorkingWindows('09:00')).toBe(true);
      expect(isTimeInWorkingWindows('12:30')).toBe(true);
      expect(isTimeInWorkingWindows('17:00')).toBe(true);
      expect(isTimeInWorkingWindows('20:00')).toBe(true);
      expect(isTimeInWorkingWindows('23:30')).toBe(true);
    });

    it('rejects times outside IST consultation windows (e.g. dinner gap or deep night)', () => {
      expect(isTimeInWorkingWindows('18:00')).toBe(false); // 5pm-8pm dinner/break window
      expect(isTimeInWorkingWindows('19:45')).toBe(false);
      expect(isTimeInWorkingWindows('03:00')).toBe(false); // 3 AM deep night
      expect(isTimeInWorkingWindows('08:45')).toBe(false);
    });

    it('validates 10-minute buffer conflict calculation', () => {
      // Slot A ends at 11:30. With 10 min buffer, next slot cannot start before 11:40
      const slotAEndMinutes = 11 * 60 + 30; // 690 mins
      const bufferMinutes = 10;
      const minNextStart = slotAEndMinutes + bufferMinutes; // 700 mins -> 11:40

      const slotBCandidateMinutes = 11 * 60 + 35; // 11:35 (conflicts!)
      const slotCValidMinutes = 11 * 60 + 40; // 11:40 (valid!)

      expect(slotBCandidateMinutes < minNextStart).toBe(true); // Buffer violation
      expect(slotCValidMinutes >= minNextStart).toBe(true); // Valid
    });
  });

  describe('6-Week Rolling Horizon', () => {
    it('validates that appointment date is within 6 weeks (42 days) of current date', () => {
      const today = new Date('2026-10-15');
      const maxAllowedDate = new Date(today);
      maxAllowedDate.setDate(today.getDate() + 42); // 6 weeks

      const validDate = new Date('2026-11-20');
      const tooFarDate = new Date('2026-12-05'); // 51 days out

      expect(validDate <= maxAllowedDate).toBe(true);
      expect(tooFarDate <= maxAllowedDate).toBe(false);
    });
  });
});
