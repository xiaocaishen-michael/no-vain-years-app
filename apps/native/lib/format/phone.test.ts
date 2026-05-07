import { describe, expect, it } from 'vitest';

import { maskPhone } from './phone';

describe('maskPhone (T3 / account-settings-shell FR-010 + CL-002)', () => {
  it.each([
    ['+8613812345678', '+86 138****5678'],
    ['+15551234567', '+1 555****4567'],
    ['+447123456789', '+44 712****6789'],
    [null, '未绑定'],
    ['', '未绑定'],
    ['13812345678', '未绑定'],
    ['+86 138 1234 5678', '未绑定'],
  ] as const)('maskPhone(%j) returns %s', (input, expected) => {
    expect(maskPhone(input)).toBe(expected);
  });
});
