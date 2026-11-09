import { describe, expect, it } from 'vitest';
import { embaralhar, gerarCodigo, rngCripto } from './aleatorio';

describe('rngCripto', () => {
  it('fica sempre dentro da faixa', () => {
    for (const n of [1, 2, 3, 7, 50, 1000]) {
      for (let i = 0; i < 500; i++) {
        const v = rngCripto(n);
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(n);
      }
    }
  });

  it('recusa faixas inválidas', () => {
    expect(() => rngCripto(0)).toThrow();
    expect(() => rngCripto(-1)).toThrow();
    expect(() => rngCripto(1.5)).toThrow();
  });
});

describe('embaralhar', () => {
  it('preserva os elementos e não altera a lista original', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const copia = [...original];
    const resultado = embaralhar(original);
    expect(original).toEqual(copia);
    expect([...resultado].sort((a, b) => a - b)).toEqual(copia);
  });

  it('segue o gerador recebido (Fisher-Yates)', () => {
    // Sempre escolher 0 leva cada elemento do fim para o começo.
    expect(embaralhar(['a', 'b', 'c', 'd'], () => 0)).toEqual(['b', 'c', 'd', 'a']);
    // Sempre escolher o próprio índice não muda nada.
    expect(embaralhar(['a', 'b', 'c', 'd'], (n) => n - 1)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('distribui as 6 permutações de 3 itens de forma uniforme', () => {
    const contagem = new Map<string, number>();
    const total = 60_000;
    for (let i = 0; i < total; i++) {
      const chave = embaralhar(['a', 'b', 'c']).join('');
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
    expect(contagem.size).toBe(6);
    // Esperado 10.000 cada; desvio-padrão ≈ 91. Tolerância de ±6%, mais de 6 desvios.
    for (const n of contagem.values()) {
      expect(n).toBeGreaterThan(9_400);
      expect(n).toBeLessThan(10_600);
    }
  });
});

describe('gerarCodigo', () => {
  it('gera 4 caracteres sem letras e números ambíguos', () => {
    for (let i = 0; i < 200; i++) {
      expect(gerarCodigo()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}$/);
    }
  });
});
