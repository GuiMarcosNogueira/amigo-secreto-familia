/**
 * API das listas de desejos. O servidor só enxerga um endereço aleatório e um
 * conteúdo cifrado: nunca nomes, nunca o evento, nunca as chaves.
 *
 *   GET /api/listas/<id>  -> conteúdo cifrado, ou 404 se ainda não foi escrita
 *   PUT /api/listas/<id>  -> grava; exige o token cujo SHA-256 é o próprio <id>
 */

export interface Armazenamento {
  ler(id: string): Promise<string | null>;
  gravar(id: string, conteudo: string, validadeEmSegundos: number): Promise<void>;
  /** Soma 1 ao contador e devolve o total; o contador some depois da janela. */
  contar(chave: string, janelaEmSegundos: number): Promise<number>;
}

export interface Pedido {
  metodo: string;
  id: string;
  /** Valor do cabeçalho Authorization, se houver. */
  autorizacao?: string | undefined;
  corpo?: string | undefined;
  ip: string;
}

export interface Resposta {
  status: number;
  corpo?: string;
  cabecalhos: Record<string, string>;
}

export const LIMITES_DA_API = {
  /** Tamanho máximo do conteúdo cifrado (em caracteres base64url). */
  tamanhoMaximo: 8192,
  gravacoesPorHora: 30,
  validadeEmSegundos: 400 * 24 * 60 * 60,
} as const;

const FORMATO_ID = /^[A-Za-z0-9_-]{43}$/;
const FORMATO_CONTEUDO = /^[A-Za-z0-9_-]+$/;

function responder(status: number, corpo?: string): Resposta {
  return {
    status,
    ...(corpo !== undefined && { corpo }),
    cabecalhos: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  };
}

function paraBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashDoToken(token: string): Promise<string> {
  const resumo = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return paraBase64Url(new Uint8Array(resumo));
}

export async function tratar(
  pedido: Pedido,
  armazenamento: Armazenamento,
  agora: () => number = Date.now,
): Promise<Resposta> {
  if (!FORMATO_ID.test(pedido.id)) return responder(400, 'endereço inválido');

  if (pedido.metodo === 'GET') {
    const conteudo = await armazenamento.ler(pedido.id);
    return conteudo === null ? responder(404, 'lista não encontrada') : responder(200, conteudo);
  }

  if (pedido.metodo === 'PUT') {
    const token = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(pedido.autorizacao ?? '')?.[1];
    if (!token || (await hashDoToken(token)) !== pedido.id) return responder(403, 'sem permissão');

    const corpo = pedido.corpo ?? '';
    if (corpo.length > LIMITES_DA_API.tamanhoMaximo)
      return responder(413, 'conteúdo grande demais');
    if (!FORMATO_CONTEUDO.test(corpo)) return responder(400, 'conteúdo inválido');

    const hora = Math.floor(agora() / 3_600_000);
    const total = await armazenamento.contar(`limite:${pedido.ip}:${hora}`, 3600);
    if (total > LIMITES_DA_API.gravacoesPorHora) return responder(429, 'muitas gravações');

    await armazenamento.gravar(pedido.id, corpo, LIMITES_DA_API.validadeEmSegundos);
    return responder(204);
  }

  const recusa = responder(405, 'método não permitido');
  return { ...recusa, cabecalhos: { ...recusa.cabecalhos, Allow: 'GET, PUT' } };
}
