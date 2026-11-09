import { describe, expect, it } from 'vitest';
import { detectarPlataforma } from './aparelho';

describe('detectarPlataforma', () => {
  it('reconhece Android, iPhone e computador pelo navegador', () => {
    expect(
      detectarPlataforma(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
      ),
    ).toBe('android');
    expect(
      detectarPlataforma(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('iphone');
    expect(
      detectarPlataforma(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
      ),
    ).toBe('computador');
    expect(
      detectarPlataforma(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
      ),
    ).toBe('computador');
  });
});
