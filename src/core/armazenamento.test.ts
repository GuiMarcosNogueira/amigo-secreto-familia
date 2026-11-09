import { describe, expect, it } from 'vitest';
import {
  apagarTudo,
  armazenamentoDisponivel,
  CHAVES,
  gravarLinks,
  gravarRascunho,
  gravarTema,
  lerLinks,
  lerRascunho,
  lerTema,
  type Cofre,
} from './armazenamento';
import { rascunhoVazio, type LinksSalvos, type Rascunho } from './tipos';

function cofreEmMemoria(): Cofre & { dados: Map<string, string> } {
  const dados = new Map<string, string>();
  return {
    dados,
    getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => void dados.set(k, v),
    removeItem: (k) => void dados.delete(k),
  };
}

const cofreQuebrado: Cofre = {
  getItem: () => {
    throw new Error('bloqueado');
  },
  setItem: () => {
    throw new Error('bloqueado');
  },
  removeItem: () => {
    throw new Error('bloqueado');
  },
};

const rascunho: Rascunho = {
  evento: { nome: 'Natal 2026', data: '2026-12-24', valor: '50,00', mensagem: 'Oi!' },
  participantes: [
    { id: 'a', nome: 'Ana' },
    { id: 'b', nome: 'Beto' },
    { id: 'c', nome: 'Caio' },
  ],
  restricoes: [['a', 'b']],
};

const links: LinksSalvos = {
  codigo: 'K7P2',
  criadoEm: '2026-11-09T12:00:00.000Z',
  links: [
    { participante: 'Ana', url: 'https://x.app/#/ver/v1.a.b', enviado: true },
    { participante: 'Beto', url: 'https://x.app/#/ver/v1.c.d', enviado: false },
  ],
};

describe('rascunho', () => {
  it('ida e volta', () => {
    const cofre = cofreEmMemoria();
    expect(gravarRascunho(rascunho, cofre)).toBe(true);
    expect(lerRascunho(cofre)).toEqual(rascunho);
  });

  it('sem nada guardado, começa em branco', () => {
    expect(lerRascunho(cofreEmMemoria())).toEqual(rascunhoVazio());
  });

  it('dado corrompido vira rascunho em branco, sem erro', () => {
    const ruins = [
      '{não é json',
      '"texto"',
      '[]',
      '{"evento":null}',
      '{"evento":{},"participantes":"x","restricoes":[]}',
      '{"evento":{},"participantes":[{"id":1,"nome":"A"}],"restricoes":[]}',
      '{"evento":{},"participantes":[{"id":"a","nome":"A"},{"id":"a","nome":"B"}],"restricoes":[]}',
    ];
    for (const ruim of ruins) {
      const cofre = cofreEmMemoria();
      cofre.setItem(CHAVES.rascunho, ruim);
      expect(lerRascunho(cofre)).toEqual(rascunhoVazio());
    }
  });

  it('descarta restrições órfãs, repetidas ou malformadas e conserta a ordem', () => {
    const cofre = cofreEmMemoria();
    cofre.setItem(
      CHAVES.rascunho,
      JSON.stringify({
        ...rascunho,
        restricoes: [['b', 'a'], ['a', 'b'], ['a', 'zz'], ['a', 'a'], 'x', ['c']],
      }),
    );
    expect(lerRascunho(cofre).restricoes).toEqual([['a', 'b']]);
  });

  it('armazenamento indisponível: não lança erro e avisa que não gravou', () => {
    expect(armazenamentoDisponivel(cofreQuebrado)).toBe(false);
    expect(armazenamentoDisponivel(null)).toBe(false);
    expect(armazenamentoDisponivel(cofreEmMemoria())).toBe(true);
    expect(gravarRascunho(rascunho, cofreQuebrado)).toBe(false);
    expect(gravarRascunho(rascunho, null)).toBe(false);
    expect(lerRascunho(cofreQuebrado)).toEqual(rascunhoVazio());
    expect(() => apagarTudo(cofreQuebrado)).not.toThrow();
  });
});

describe('links', () => {
  it('ida e volta', () => {
    const cofre = cofreEmMemoria();
    gravarLinks(links, cofre);
    expect(lerLinks(cofre)).toEqual(links);
  });

  it('dado estranho vira null', () => {
    const cofre = cofreEmMemoria();
    expect(lerLinks(cofre)).toBeNull();
    for (const ruim of [
      'x',
      '{}',
      '{"codigo":"A","criadoEm":"x","links":[{"participante":"A"}]}',
    ]) {
      cofre.setItem(CHAVES.links, ruim);
      expect(lerLinks(cofre)).toBeNull();
    }
  });
});

describe('recomeçar e tema', () => {
  it('apaga rascunho e links, mas mantém o tema', () => {
    const cofre = cofreEmMemoria();
    gravarRascunho(rascunho, cofre);
    gravarLinks(links, cofre);
    gravarTema('escuro', cofre);
    apagarTudo(cofre);
    expect(lerRascunho(cofre)).toEqual(rascunhoVazio());
    expect(lerLinks(cofre)).toBeNull();
    expect(lerTema(cofre)).toBe('escuro');
  });

  it('tema desconhecido é ignorado', () => {
    const cofre = cofreEmMemoria();
    expect(lerTema(cofre)).toBeNull();
    cofre.setItem(CHAVES.tema, 'roxo');
    expect(lerTema(cofre)).toBeNull();
  });
});
