import { describe, expect, it } from 'vitest';
import { SorteioImpossivel, sortear, verificarViabilidade } from './sorteio';
import type { Id, Par } from './tipos';
import { ordenarPar } from './validacao';

function pessoas(n: number): Id[] {
  return Array.from({ length: n }, (_, i) => `p${String(i).padStart(2, '0')}`);
}

/** Casais: (p00,p01), (p02,p03), ... */
function casais(ids: Id[], quantos: number): Par[] {
  return Array.from({ length: quantos }, (_, c) => ordenarPar(ids[2 * c]!, ids[2 * c + 1]!));
}

function violacoes(ids: Id[], restricoes: Par[], resultado: Map<Id, Id>): string[] {
  const erros: string[] = [];
  const proibidos = new Set(restricoes.flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]));
  if (resultado.size !== ids.length) erros.push('nem todos tiraram alguém');
  for (const id of ids) {
    const tirou = resultado.get(id);
    if (tirou === undefined) erros.push(`${id} não tirou ninguém`);
    else if (tirou === id) erros.push(`${id} tirou a si mesmo`);
    else if (proibidos.has(`${id}>${tirou}`)) erros.push(`${id} tirou par restrito ${tirou}`);
  }
  const sorteados = [...resultado.values()].sort();
  if (sorteados.join() !== [...ids].sort().join()) erros.push('alguém foi sorteado 0 ou 2 vezes');
  return erros;
}

describe('verificarViabilidade', () => {
  it('aceita 3 pessoas sem restrições', () => {
    expect(verificarViabilidade(pessoas(3), [])).toEqual({ possivel: true });
  });

  it('aceita 4 pessoas com dois casais', () => {
    const ids = pessoas(4);
    expect(verificarViabilidade(ids, casais(ids, 2)).possivel).toBe(true);
  });

  it('aceita 20 pessoas com 10 casais', () => {
    const ids = pessoas(20);
    expect(verificarViabilidade(ids, casais(ids, 10)).possivel).toBe(true);
  });

  it('prova que 3 pessoas com um casal é impossível: 2 pessoas para 1 opção', () => {
    const [ana, beto, caio] = pessoas(3) as [Id, Id, Id];
    const v = verificarViabilidade([ana, beto, caio], [[ana, beto]]);
    expect(v).toEqual({
      possivel: false,
      bloqueados: [ana, beto],
      opcoes: [caio],
      restricoesEnvolvidas: [[ana, beto]],
    });
  });

  it('aponta quem não pode tirar ninguém', () => {
    const ids = pessoas(4);
    const [vo, a, b, c] = ids as [Id, Id, Id, Id];
    const restricoes: Par[] = [
      [vo, a],
      [vo, b],
      [vo, c],
    ];
    const v = verificarViabilidade(ids, restricoes);
    expect(v.possivel).toBe(false);
    if (v.possivel) return;
    expect(v.bloqueados).toEqual([vo]);
    expect(v.opcoes).toEqual([]);
    expect(v.restricoesEnvolvidas).toHaveLength(3);
  });

  it('o grupo apontado sempre tem menos opções que pessoas', () => {
    // 5 pessoas; p00, p01 e p02 só podem tirar p03 e p04.
    const ids = pessoas(5);
    const restricoes: Par[] = [
      ['p00', 'p01'],
      ['p00', 'p02'],
      ['p01', 'p02'],
    ];
    const v = verificarViabilidade(ids, restricoes);
    expect(v.possivel).toBe(false);
    if (v.possivel) return;
    expect(v.bloqueados).toEqual(['p00', 'p01', 'p02']);
    expect(v.opcoes).toEqual(['p03', 'p04']);
    expect(v.opcoes.length).toBeLessThan(v.bloqueados.length);
  });

  it('remover a restrição apontada libera o sorteio', () => {
    const ids = pessoas(4);
    const restricoes: Par[] = [
      ['p00', 'p01'],
      ['p00', 'p02'],
      ['p00', 'p03'],
    ];
    const v = verificarViabilidade(ids, restricoes);
    if (v.possivel) throw new Error('deveria ser impossível');
    const semUma = restricoes.filter((r) => r !== v.restricoesEnvolvidas[0]);
    expect(verificarViabilidade(ids, semUma).possivel).toBe(true);
  });

  it('nunca erra: confere com força bruta todas as configurações de 4 pessoas', () => {
    const ids = pessoas(4);
    const pares: Par[] = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pares.push([ids[i]!, ids[j]!]);

    const permutacoes = (lista: number[]): number[][] =>
      lista.length <= 1
        ? [lista]
        : lista.flatMap((x, i) =>
            permutacoes([...lista.slice(0, i), ...lista.slice(i + 1)]).map((p) => [x, ...p]),
          );
    const todas = permutacoes([0, 1, 2, 3]);

    for (let mascara = 0; mascara < 1 << pares.length; mascara++) {
      const restricoes = pares.filter((_, k) => mascara & (1 << k));
      const proibidos = new Set(restricoes.flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]));
      const existe = todas.some((perm) =>
        perm.every((j, i) => i !== j && !proibidos.has(`${ids[i]}>${ids[j]}`)),
      );
      expect(verificarViabilidade(ids, restricoes).possivel).toBe(existe);
    }
  });
});

describe('sortear', () => {
  it('3 pessoas: cada uma tira outra e é tirada uma vez', () => {
    const ids = pessoas(3);
    expect(violacoes(ids, [], sortear(ids, []))).toEqual([]);
  });

  it('20 pessoas com casais: ninguém tira a si mesmo nem o par', () => {
    const ids = pessoas(20);
    const restricoes = casais(ids, 10);
    expect(violacoes(ids, restricoes, sortear(ids, restricoes))).toEqual([]);
  });

  it('lança erro quando o sorteio é impossível', () => {
    const ids = pessoas(3);
    expect(() => sortear(ids, [['p00', 'p01']])).toThrow(SorteioImpossivel);
    expect(() => sortear(['sozinho'], [])).toThrow(SorteioImpossivel);
  });

  it('10.000 execuções sem nenhuma violação', () => {
    const ids = pessoas(8);
    const restricoes: Par[] = [...casais(ids, 3), ['p00', 'p07'], ['p02', 'p06']];
    for (let i = 0; i < 10_000; i++) {
      const erros = violacoes(ids, restricoes, sortear(ids, restricoes));
      if (erros.length > 0) throw new Error(`execução ${i}: ${erros.join('; ')}`);
    }
  });

  it('é imparcial: cada opção de cada pessoa sai com frequência parecida', () => {
    // 4 pessoas sem restrições: 9 resultados válidos; cada pessoa tira cada uma
    // das outras 3 em exatamente 1/3 dos casos.
    const ids = pessoas(4);
    const total = 30_000;
    const contagem = new Map<string, number>();
    const resultados = new Set<string>();
    for (let i = 0; i < total; i++) {
      const r = sortear(ids, []);
      resultados.add(ids.map((id) => r.get(id)).join());
      for (const [de, para] of r) {
        contagem.set(`${de}>${para}`, (contagem.get(`${de}>${para}`) ?? 0) + 1);
      }
    }
    expect(resultados.size).toBe(9);
    expect(contagem.size).toBe(12);
    // Esperado 10.000 por par; desvio-padrão ≈ 82. Tolerância de ±6%.
    for (const n of contagem.values()) {
      expect(n).toBeGreaterThan(9_400);
      expect(n).toBeLessThan(10_600);
    }
  });

  it('resolve os casos típicos de família sem precisar do plano B', () => {
    const ids = pessoas(20);
    const restricoes = casais(ids, 10);
    for (let i = 0; i < 200; i++) {
      let embaralhadas = 0;
      const rng = (n: number) => {
        // Cada embaralhada de 20 itens começa pedindo um número em [0, 20).
        if (n === 20) embaralhadas++;
        return Math.floor(Math.random() * n);
      };
      sortear(ids, restricoes, { rng });
      // O plano B só entra depois de 5.000 embaralhadas; aqui fica muito longe disso.
      expect(embaralhadas).toBeLessThan(300);
    }
  });

  it('plano B: com zero tentativas, ainda devolve um resultado válido', () => {
    const ids = pessoas(12);
    const restricoes = casais(ids, 6);
    for (let i = 0; i < 500; i++) {
      const r = sortear(ids, restricoes, { maxTentativas: 0 });
      expect(violacoes(ids, restricoes, r)).toEqual([]);
    }
  });

  it('plano B com gerador determinístico devolve sempre o mesmo resultado válido', () => {
    const ids = pessoas(6);
    const restricoes = casais(ids, 3);
    const a = sortear(ids, restricoes, { maxTentativas: 0, rng: () => 0 });
    const b = sortear(ids, restricoes, { maxTentativas: 0, rng: () => 0 });
    expect(violacoes(ids, restricoes, a)).toEqual([]);
    expect([...a]).toEqual([...b]);
  });
});
