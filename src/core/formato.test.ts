import { describe, expect, it } from 'vitest';
import {
  formatarData,
  formatarDataHora,
  formatarValor,
  hojeISO,
  listarNomes,
  mensagemDoLink,
  urlDoWhatsApp,
} from './formato';

describe('formato', () => {
  it('data por extenso em português, sem escorregar de dia por fuso', () => {
    expect(formatarData('2026-12-24')).toBe('quinta-feira, 24 de dezembro de 2026');
    expect(formatarData('2026-01-01')).toBe('quinta-feira, 1 de janeiro de 2026');
    expect(formatarData('bobagem')).toBe('bobagem');
  });

  it('valor em reais', () => {
    expect(formatarValor(50)).toBe('R$ 50,00');
    expect(formatarValor(1250.9)).toBe('R$ 1.250,90');
  });

  it('data e hora da última alteração', () => {
    expect(formatarDataHora('2026-11-09T17:30:00.000Z', 'America/Sao_Paulo')).toBe(
      '9 de novembro às 14:30',
    );
    expect(formatarDataHora('x')).toBe('');
  });

  it('hoje no formato do campo de data', () => {
    expect(hojeISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('lista de nomes', () => {
    expect(listarNomes(['Ana'])).toBe('Ana');
    expect(listarNomes(['Ana', 'Beto'])).toBe('Ana e Beto');
    expect(listarNomes(['Ana', 'Beto', 'Caio'])).toBe('Ana, Beto e Caio');
  });

  it('mensagem do WhatsApp cita a pessoa, o evento e o link, codificada na URL', () => {
    const url = 'https://x.app/#/ver/v1.a-b.c_d';
    const mensagem = mensagemDoLink('Vó Maria', 'Natal 2026', url);
    expect(mensagem).toContain('Vó Maria');
    expect(mensagem).toContain('Natal 2026');
    expect(mensagem.endsWith(url)).toBe(true);
    const wa = urlDoWhatsApp(mensagem);
    expect(wa.startsWith('https://wa.me/?text=')).toBe(true);
    expect(wa).not.toContain('#');
    expect(wa).not.toContain(' ');
    expect(decodeURIComponent(wa.slice('https://wa.me/?text='.length))).toBe(mensagem);
  });
});
