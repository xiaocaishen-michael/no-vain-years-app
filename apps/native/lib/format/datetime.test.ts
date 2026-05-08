import { describe, expect, it } from 'vitest';

import { formatLastActive } from './datetime';

describe('formatLastActive', () => {
  it('should_format_minute_granularity_for_list', () => {
    expect(formatLastActive('2026-05-07T17:23:48Z', 'minute')).toBe('2026.05.07 17:23');
  });

  it('should_format_second_granularity_for_detail', () => {
    expect(formatLastActive('2026-05-07T17:23:48Z', 'second')).toBe('2026.05.07 17:23:48');
  });

  it('should_pad_zero_for_single_digit_month_day_hour_minute_second', () => {
    expect(formatLastActive('2026-01-02T03:04:05Z', 'second')).toBe('2026.01.02 03:04:05');
  });

  it('should_handle_iso_with_timezone_offset', () => {
    // +08:00 offset — the output reflects local interpretation of the Date object
    const iso = '2026-05-07T17:23:48+08:00';
    const result = formatLastActive(iso, 'second');
    // Must produce a valid datetime string matching pattern YYYY.MM.DD HH:MM:SS
    expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
