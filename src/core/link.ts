import { bytesAleatorios, gerarCodigo } from './aleatorio';
import {
  bytesParaTexto,
  cifrar,
  deBase64Url,
  decifrar,
  paraBase64Url,
  TAMANHO_CHAVE,
  textoParaBytes,
} from './cripto';
import { acessoDeLeitura, derivarAcesso, type AcessoDeLeitura } from './desejos';
import type { Evento, Id, LinkGerado, LinksSalvos, Participante } from './tipos';
import { interpretarValor } from './validacao';

const VERSAO = 'v1';

/** O que viaja, cifrado, dentro de cada link. */
export interface ConteudoDoLink {
  /** Código do sorteio. */
  c: string;
  /** Quem tirou (o dono do link). */
  de: string;
  /** Quem foi sorteado. */
  para: string;
  ev: { n: string; d: string; val?: number; msg?: string };
  /** Semente da lista de desejos do dono do link. */
  s: string;
  /** Acesso de leitura à lista de desejos do sorteado. */
  al: AcessoDeLeitura;
}

export type LeituraDoLink = { ok: true; conteudo: ConteudoDoLink } | { ok: false };

function texto(valor: unknown, max: number): valor is string {
  return typeof valor === 'string' && valor.length > 0 && valor.length <= max;
}

function validarConteudo(dado: unknown): ConteudoDoLink | null {
  if (typeof dado !== 'object' || dado === null) return null;
  const { v, c, de, para, ev, s, al } = dado as Record<string, unknown>;
  if (v !== 1 || !texto(c, 8) || !texto(de, 60) || !texto(para, 60) || !texto(s, 64)) return null;
  if (typeof ev !== 'object' || ev === null || typeof al !== 'object' || al === null) return null;
  const { n, d, val, msg } = ev as Record<string, unknown>;
  if (!texto(n, 80) || typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  if (val !== undefined && (typeof val !== 'number' || !Number.isFinite(val) || val <= 0)) {
    return null;
  }
  if (msg !== undefined && !texto(msg, 400)) return null;
  const { id, k } = al as Record<string, unknown>;
  if (!texto(id, 64) || !texto(k, 64)) return null;
  return {
    c,
    de,
    para,
    ev: { n, d, ...(val !== undefined && { val }), ...(msg !== undefined && { msg }) },
    s,
    al: { id, k },
  };
}

function serializar(conteudo: ConteudoDoLink): Uint8Array<ArrayBuffer> {
  return textoParaBytes(JSON.stringify({ v: 1, ...conteudo }));
}

/**
 * Cifra o conteúdo com uma chave nova e devolve `v1.<chave>.<dados>`.
 * `tamanho` completa o texto com espaços até aquele número de bytes, para que
 * todos os links de um sorteio tenham o mesmo comprimento.
 */
export async function criarPayload(conteudo: ConteudoDoLink, tamanho = 0): Promise<string> {
  const bruto = serializar(conteudo);
  const claro = new Uint8Array(Math.max(bruto.length, tamanho)).fill(0x20);
  claro.set(bruto, 0);
  const chave = bytesAleatorios(TAMANHO_CHAVE);
  const dados = await cifrar(chave, claro);
  return `${VERSAO}.${paraBase64Url(chave)}.${paraBase64Url(dados)}`;
}

/** Qualquer problema (formato, chave errada, link alterado ou cortado) vira `{ ok: false }`. */
export async function lerPayload(payload: string): Promise<LeituraDoLink> {
  try {
    const partes = payload.split('.');
    if (partes.length !== 3 || partes[0] !== VERSAO) return { ok: false };
    const chave = deBase64Url(partes[1]!);
    const claro = await decifrar(chave, deBase64Url(partes[2]!));
    const conteudo = validarConteudo(JSON.parse(bytesParaTexto(claro)));
    return conteudo ? { ok: true, conteudo } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export function urlDoLink(base: string, payload: string): string {
  return `${base.replace(/[#?].*$/, '').replace(/\/+$/, '')}/#/ver/${payload}`;
}

/**
 * Transforma o resultado do sorteio em um link cifrado por participante.
 * O mapa do sorteio só é lido aqui dentro: nada do que esta função devolve
 * mostra quem tirou quem em texto legível.
 */
export async function gerarLinks(
  evento: Evento,
  participantes: readonly Participante[],
  sorteio: ReadonlyMap<Id, Id>,
  base: string,
  agora: Date = new Date(),
): Promise<LinksSalvos> {
  const codigo = gerarCodigo();
  const nomes = new Map(participantes.map((p) => [p.id, p.nome]));
  const valor = interpretarValor(evento.valor);
  const mensagem = evento.mensagem.trim();
  const ev: ConteudoDoLink['ev'] = {
    n: evento.nome.trim(),
    d: evento.data,
    ...(typeof valor === 'number' && { val: valor }),
    ...(mensagem !== '' && { msg: mensagem }),
  };

  // Uma semente de lista de desejos por pessoa, nova a cada sorteio.
  const sementes = new Map<Id, string>();
  const leituras = new Map<Id, AcessoDeLeitura>();
  for (const p of participantes) {
    const semente = paraBase64Url(bytesAleatorios(32));
    sementes.set(p.id, semente);
    leituras.set(p.id, acessoDeLeitura(await derivarAcesso(semente)));
  }

  const conteudos = participantes.map((p): ConteudoDoLink => {
    const sorteado = sorteio.get(p.id);
    if (sorteado === undefined) throw new Error('sorteio incompleto');
    return {
      c: codigo,
      de: p.nome,
      para: nomes.get(sorteado)!,
      ev,
      s: sementes.get(p.id)!,
      al: leituras.get(sorteado)!,
    };
  });

  const tamanho = Math.max(...conteudos.map((c) => serializar(c).length));
  const links: LinkGerado[] = [];
  for (const [i, conteudo] of conteudos.entries()) {
    links.push({
      participante: participantes[i]!.nome,
      url: urlDoLink(base, await criarPayload(conteudo, tamanho)),
      enviado: false,
    });
  }
  return { codigo, criadoEm: agora.toISOString(), links };
}

export function payloadDaUrl(url: string): string | null {
  const marca = '#/ver/';
  const i = url.indexOf(marca);
  return i === -1 ? null : url.slice(i + marca.length);
}
