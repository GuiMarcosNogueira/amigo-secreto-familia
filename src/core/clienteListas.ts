import {
  cifrarLista,
  decifrarLista,
  derivarAcesso,
  type AcessoDeLeitura,
  type ListaDeDesejos,
} from './desejos';

export type LeituraDaLista =
  | { tipo: 'ok'; lista: ListaDeDesejos }
  /** Ainda não foi escrita (ou foi apagada). */
  | { tipo: 'vazia' }
  /** Sem internet, servidor fora do ar ou conteúdo ilegível. */
  | { tipo: 'erro' };

export type GravacaoDaLista = 'ok' | 'limite' | 'erro';

type Buscar = typeof fetch;

function endereco(id: string): string {
  return `/api/listas/${id}`;
}

export async function lerLista(
  acesso: AcessoDeLeitura,
  buscar: Buscar = fetch,
): Promise<LeituraDaLista> {
  try {
    const resposta = await buscar(endereco(acesso.id), { cache: 'no-store' });
    if (resposta.status === 404) return { tipo: 'vazia' };
    if (!resposta.ok) return { tipo: 'erro' };
    const lista = await decifrarLista(acesso.k, (await resposta.text()).trim());
    if (!lista) return { tipo: 'erro' };
    return lista.itens.length === 0 && lista.obs === '' ? { tipo: 'vazia' } : { tipo: 'ok', lista };
  } catch {
    return { tipo: 'erro' };
  }
}

/** Lê a própria lista a partir da semente do dono. */
export async function lerMinhaLista(semente: string, buscar: Buscar = fetch) {
  try {
    const dono = await derivarAcesso(semente);
    return await lerLista({ id: dono.id, k: dono.chave }, buscar);
  } catch {
    return { tipo: 'erro' } as const;
  }
}

/** Cifra no aparelho e envia só o conteúdo cifrado. */
export async function salvarMinhaLista(
  semente: string,
  lista: ListaDeDesejos,
  buscar: Buscar = fetch,
): Promise<GravacaoDaLista> {
  try {
    const dono = await derivarAcesso(semente);
    const resposta = await buscar(endereco(dono.id), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${dono.token}`, 'Content-Type': 'text/plain' },
      body: await cifrarLista(dono.chave, lista),
      cache: 'no-store',
    });
    if (resposta.status === 429) return 'limite';
    return resposta.ok ? 'ok' : 'erro';
  } catch {
    return 'erro';
  }
}
