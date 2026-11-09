import { embaralhar, rngCripto, type Rng } from './aleatorio';
import type { Id, Par } from './tipos';

export type Viabilidade =
  | { possivel: true }
  | {
      possivel: false;
      /** Pessoas que, juntas, não têm opções suficientes. */
      bloqueados: Id[];
      /** Todas as pessoas que os bloqueados podem tirar (sempre menos que os bloqueados). */
      opcoes: Id[];
      /** Restrições que envolvem algum dos bloqueados: remover uma delas pode resolver. */
      restricoesEnvolvidas: Par[];
    };

/** permitido[i][j] = a pessoa i pode tirar a pessoa j. */
function montarPermitidos(ids: readonly Id[], restricoes: readonly Par[]): boolean[][] {
  const indice = new Map(ids.map((id, i) => [id, i]));
  const permitido = ids.map((_, i) => ids.map((_, j) => i !== j));
  for (const [a, b] of restricoes) {
    const i = indice.get(a);
    const j = indice.get(b);
    if (i === undefined || j === undefined) continue;
    permitido[i]![j] = false;
    permitido[j]![i] = false;
  }
  return permitido;
}

/**
 * Emparelhamento máximo em grafo bipartido (algoritmo de Kuhn).
 * Devolve `recebeDe[j] = i` (quem tira j) ou -1.
 */
function emparelhar(vizinhos: number[][], ordem: number[]): number[] {
  const n = vizinhos.length;
  const recebeDe = new Array<number>(n).fill(-1);

  const tentar = (i: number, visitado: boolean[]): boolean => {
    for (const j of vizinhos[i]!) {
      if (visitado[j]) continue;
      visitado[j] = true;
      const atual = recebeDe[j]!;
      if (atual === -1 || tentar(atual, visitado)) {
        recebeDe[j] = i;
        return true;
      }
    }
    return false;
  };

  for (const i of ordem) tentar(i, new Array<boolean>(n).fill(false));
  return recebeDe;
}

function listarVizinhos(permitido: boolean[][]): number[][] {
  return permitido.map((linha) => linha.flatMap((pode, j) => (pode ? [j] : [])));
}

/**
 * Diz se existe ao menos um sorteio válido. Quando não existe, aponta um grupo
 * de pessoas que disputa menos opções do que o tamanho do grupo (teorema de Hall),
 * que é a prova de que o sorteio é impossível.
 */
export function verificarViabilidade(ids: readonly Id[], restricoes: readonly Par[]): Viabilidade {
  const n = ids.length;
  const vizinhos = listarVizinhos(montarPermitidos(ids, restricoes));
  const recebeDe = emparelhar(
    vizinhos,
    ids.map((_, i) => i),
  );

  const tira = new Array<number>(n).fill(-1);
  recebeDe.forEach((i, j) => {
    if (i !== -1) tira[i] = j;
  });
  const semPar = tira.findIndex((j) => j === -1);
  if (semPar === -1) return { possivel: true };

  // A partir de alguém que ficou sem par, segue os caminhos alternantes:
  // todos os alcançados disputam exatamente as mesmas opções.
  const bloqueados = new Set<number>([semPar]);
  const opcoes = new Set<number>();
  const fila = [semPar];
  while (fila.length > 0) {
    const i = fila.pop()!;
    for (const j of vizinhos[i]!) {
      if (opcoes.has(j)) continue;
      opcoes.add(j);
      const dono = recebeDe[j]!;
      if (dono !== -1 && !bloqueados.has(dono)) {
        bloqueados.add(dono);
        fila.push(dono);
      }
    }
  }

  const idsBloqueados = [...bloqueados].sort((a, b) => a - b).map((i) => ids[i]!);
  const conjunto = new Set(idsBloqueados);
  return {
    possivel: false,
    bloqueados: idsBloqueados,
    opcoes: [...opcoes].sort((a, b) => a - b).map((j) => ids[j]!),
    restricoesEnvolvidas: restricoes.filter(([a, b]) => conjunto.has(a) || conjunto.has(b)),
  };
}

export class SorteioImpossivel extends Error {
  constructor() {
    super('Sorteio impossível com as restrições atuais');
    this.name = 'SorteioImpossivel';
  }
}

export interface OpcoesSorteio {
  rng?: Rng;
  /** Tentativas de embaralhar antes de recorrer ao plano B. */
  maxTentativas?: number;
}

/**
 * Sorteia quem tira quem. Devolve um mapa `quem dá -> quem recebe`.
 *
 * Caminho principal: embaralha (Fisher-Yates) e só aceita a permutação inteira
 * se ela respeitar todas as regras. Isso dá chance igual a todo resultado válido.
 * Plano B (regras muito apertadas): emparelhamento com ordem embaralhada,
 * sempre válido, embora não perfeitamente uniforme.
 */
export function sortear(
  ids: readonly Id[],
  restricoes: readonly Par[],
  { rng = rngCripto, maxTentativas = 5000 }: OpcoesSorteio = {},
): Map<Id, Id> {
  const n = ids.length;
  if (n < 2 || !verificarViabilidade(ids, restricoes).possivel) throw new SorteioImpossivel();

  const permitido = montarPermitidos(ids, restricoes);
  const indices = ids.map((_, i) => i);
  let escolhido: number[] | null = null;

  for (let t = 0; t < maxTentativas && !escolhido; t++) {
    const candidato = embaralhar(indices, rng);
    if (candidato.every((j, i) => permitido[i]![j])) escolhido = candidato;
  }

  if (!escolhido) {
    const vizinhos = listarVizinhos(permitido).map((v) => embaralhar(v, rng));
    const recebeDe = emparelhar(vizinhos, embaralhar(indices, rng));
    escolhido = new Array<number>(n).fill(-1);
    recebeDe.forEach((i, j) => {
      escolhido![i] = j;
    });
  }

  return new Map(escolhido.map((j, i) => [ids[i]!, ids[j]!]));
}
