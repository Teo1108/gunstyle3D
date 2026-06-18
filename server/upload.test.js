import { describe, it, expect } from 'vitest';
import { generateUniqueFilename } from './upload.js';

describe('generateUniqueFilename', () => {
  it('preserves the file extension', () => {
    const filename = generateUniqueFilename('photo.jpg');
    expect(filename.endsWith('.jpg')).toBe(true);
  });

  it('strips unsafe characters from the base name', () => {
    const filename = generateUniqueFilename('my photo (1)!.png');
    expect(filename).toMatch(/^\d+-myphoto1\.png$/);
  });

  it('prefixes with a numeric timestamp so two calls differ', () => {
    const a = generateUniqueFilename('a.jpg');
    const b = generateUniqueFilename('a.jpg');
    expect(a).toMatch(/^\d+-a\.jpg$/);
    expect(b).toMatch(/^\d+-a\.jpg$/);
  });
});
