import { LIMITES, rascunhoVazio, type LinksSalvos, type Par, type Rascunho } from './tipos';

export const CHAVES = {
  rascunho: 'amigo-secreto:rascunho:v1',
  links: 'amigo-secreto:links:v1',
  tema: 'amigo-secreto:tema',
} as const;

/** O pedaço de `localStorage` que usamos (facilita os testes). */
export type Cofre = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type Tema = 'claro' | 'escuro';

function cofrePadrao(): Cofre | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** `true` se dá para guardar dados neste navegador (falso em alguns modos privados). */
export function armazenamentoDisponivel(cofre: Cofre | null = cofrePadrao()): boolean {
  if (!cofre) return false;
  try {
    const teste = 'amigo-secreto:teste';
    cofre.setItem(teste, '1');
    cofre.removeItem(teste);
    return true;
  } catch {
    return false;
  }
}

function ler(chave: string, cofre: Cofre | null): unknown {
  try {
    const bruto = cofre?.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown, cofre: Cofre | null): boolean {
  try {
    if (!cofre) return false;
    cofre.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

function texto(valor: unknown, max: number): string {
  return typeof valor === 'string' ? valor.slice(0, max) : '';
}

/** Lê o rascunho com desconfiança: qualquer coisa estranha vira rascunho em branco. */
export function lerRascunho(cofre: Cofre | null = cofrePadrao()): Rascunho {
  const dado = ler(CHAVES.rascunho, cofre);
  if (typeof dado !== 'object' || dado === null) return rascunhoVazio();
  const { evento, participantes, restricoes } = dado as Record<string, unknown>;
  if (typeof evento !== 'object' || evento === null) return rascunhoVazio();
  if (!Array.isArray(participantes) || !Array.isArray(restricoes)) return rascunhoVazio();

  const ev = evento as Record<string, unknown>;
  const pessoas = [];
  const ids = new Set<string>();
  for (const p of participantes.slice(0, LIMITES.participantes)) {
    if (typeof p !== 'object' || p === null) return rascunhoVazio();
    const { id, nome } = p as Record<string, unknown>;
    if (typeof id !== 'string' || typeof nome !== 'string' || id === '' || nome.trim() === '') {
      return rascunhoVazio();
    }
    if (ids.has(id)) return rascunhoVazio();
    ids.add(id);
    pessoas.push({ id, nome: nome.slice(0, LIMITES.nomeParticipante) });
  }

  const pares: Par[] = [];
  for (const r of restricoes) {
    if (!Array.isArray(r) || r.length !== 2) continue;
    const [a, b] = r as unknown[];
    if (typeof a !== 'string' || typeof b !== 'string' || a === b) continue;
    if (!ids.has(a) || !ids.has(b)) continue;
    const par: Par = a < b ? [a, b] : [b, a];
    if (!pares.some(([x, y]) => x === par[0] && y === par[1])) pares.push(par);
  }

  return {
    evento: {
      nome: texto(ev.nome, LIMITES.nomeEvento),
      data: /^\d{4}-\d{2}-\d{2}$/.test(texto(ev.data, 10)) ? texto(ev.data, 10) : '',
      valor: texto(ev.valor, 20),
      mensagem: texto(ev.mensagem, LIMITES.mensagem),
    },
    participantes: pessoas,
    restricoes: pares,
  };
}

export function gravarRascunho(rascunho: Rascunho, cofre: Cofre | null = cofrePadrao()): boolean {
  return gravar(CHAVES.rascunho, rascunho, cofre);
}

export function lerLinks(cofre: Cofre | null = cofrePadrao()): LinksSalvos | null {
  const dado = ler(CHAVES.links, cofre);
  if (typeof dado !== 'object' || dado === null) return null;
  const { codigo, criadoEm, links } = dado as Record<string, unknown>;
  if (typeof codigo !== 'string' || typeof criadoEm !== 'string' || !Array.isArray(links)) {
    return null;
  }
  const lista = [];
  for (const l of links) {
    if (typeof l !== 'object' || l === null) return null;
    const { participante, url, enviado } = l as Record<string, unknown>;
    if (typeof participante !== 'string' || typeof url !== 'string') return null;
    if (!url.includes('#/ver/')) return null;
    lista.push({ participante, url, enviado: enviado === true });
  }
  return lista.length > 0 ? { codigo, criadoEm, links: lista } : null;
}

export function gravarLinks(links: LinksSalvos, cofre: Cofre | null = cofrePadrao()): boolean {
  return gravar(CHAVES.links, links, cofre);
}

/** "Recomeçar": apaga o rascunho e os links. A escolha de tema fica. */
export function apagarTudo(cofre: Cofre | null = cofrePadrao()): void {
  try {
    cofre?.removeItem(CHAVES.rascunho);
    cofre?.removeItem(CHAVES.links);
  } catch {
    // Sem armazenamento não há o que apagar.
  }
}

export function lerTema(cofre: Cofre | null = cofrePadrao()): Tema | null {
  try {
    const tema = cofre?.getItem(CHAVES.tema);
    return tema === 'claro' || tema === 'escuro' ? tema : null;
  } catch {
    return null;
  }
}

export function gravarTema(tema: Tema, cofre: Cofre | null = cofrePadrao()): void {
  try {
    cofre?.setItem(CHAVES.tema, tema);
  } catch {
    // O tema vale só até fechar o app.
  }
}
