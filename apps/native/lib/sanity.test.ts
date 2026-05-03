import { describe, expect, it } from 'vitest';

// Vitest infra smoke. Removed once first real test (login schema) lands.
describe('vitest infra', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
