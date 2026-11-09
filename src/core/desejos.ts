import {
  bytesParaTexto,
  cifrar,
  deBase64Url,
  decifrar,
  derivar,
  paraBase64Url,
  sha256,
  textoParaBytes,
} from './cripto';
import { LIMITES } from './tipos';

export interface ListaDeDesejos {
  itens: string[];
  obs: string;
  /** Data e hora da última alteração (ISO-8601). */
  em: string;
}

/** O que o dono da lista tem: pode ler e gravar. */
export interface AcessoDeDono {
  id: string;
  chave: string;
  token: string;
}

/** O que quem sorteou recebe: pode só ler. */
export interface AcessoDeLeitura {
  id: string;
  k: string;
}

/**
 * Da semente (que só o dono tem) saem o token de gravação, a chave de leitura
 * e o endereço da lista. O endereço é um hash do token: quem conhece só o
 * endereço e a chave consegue ler, mas não consegue gravar.
 */
export async function derivarAcesso(sementeB64: string): Promise<AcessoDeDono> {
  const semente = deBase64Url(sementeB64);
  if (semente.length !== 32) throw new Error('semente inválida');
  const token = paraBase64Url(await derivar(semente, 'amigo-secreto/lista/escrita'));
  const chave = paraBase64Url(await derivar(semente, 'amigo-secreto/lista/cifra'));
  const id = paraBase64Url(await sha256(textoParaBytes(token)));
  return { id, chave, token };
}

export function acessoDeLeitura(dono: AcessoDeDono): AcessoDeLeitura {
  return { id: dono.id, k: dono.chave };
}

export type ErroLista = 'itemVazio' | 'itemLongo' | 'muitosItens' | 'obsLonga';

export function validarItem(itens: readonly string[], novo: string): ErroLista | null {
  const texto = novo.trim();
  if (texto === '') return 'itemVazio';
  if (texto.length > LIMITES.itemLista) return 'itemLongo';
  if (itens.length >= LIMITES.itensLista) return 'muitosItens';
  return null;
}

export function validarLista(itens: readonly string[], obs: string): ErroLista | null {
  if (itens.length > LIMITES.itensLista) return 'muitosItens';
  if (itens.some((i) => i.trim() === '')) return 'itemVazio';
  if (itens.some((i) => i.trim().length > LIMITES.itemLista)) return 'itemLongo';
  if (obs.trim().length > LIMITES.observacaoLista) return 'obsLonga';
  return null;
}

export function listaVazia(lista: ListaDeDesejos): boolean {
  return lista.itens.length === 0 && lista.obs === '';
}

export async function cifrarLista(chaveB64: string, lista: ListaDeDesejos): Promise<string> {
  const claro = JSON.stringify({ v: 1, itens: lista.itens, obs: lista.obs, em: lista.em });
  return paraBase64Url(await cifrar(deBase64Url(chaveB64), textoParaBytes(claro)));
}

/** Devolve `null` se o conteúdo estiver adulterado, com outra chave ou em formato estranho. */
export async function decifrarLista(
  chaveB64: string,
  conteudo: string,
): Promise<ListaDeDesejos | null> {
  try {
    const claro = bytesParaTexto(await decifrar(deBase64Url(chaveB64), deBase64Url(conteudo)));
    const dado: unknown = JSON.parse(claro);
    if (typeof dado !== 'object' || dado === null) return null;
    const { v, itens, obs, em } = dado as Record<string, unknown>;
    if (v !== 1 || !Array.isArray(itens) || !itens.every((i) => typeof i === 'string')) return null;
    if (typeof obs !== 'string' || typeof em !== 'string') return null;
    if (validarLista(itens, obs) !== null) return null;
    return { itens, obs, em };
  } catch {
    return null;
  }
}
