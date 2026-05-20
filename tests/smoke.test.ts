import { describe, it, expect } from 'vitest';

describe('vitest baseline', () => {
  it('arithmetic still works', () => {
    expect(2 + 2).toBe(4);
  });

  it('jsdom DOM globals are available', () => {
    const div = document.createElement('div');
    div.textContent = 'hello';
    expect(div.textContent).toBe('hello');
  });
});
