import type { IncomingMessage, ServerResponse } from 'node:http';
import { LIMITES_DA_API, tratar, type Armazenamento } from './listas.js';

export const ROTA_DAS_LISTAS = '/api/listas/';

async function lerCorpo(req: IncomingMessage, limite: number): Promise<string | null> {
  const pedacos: Buffer[] = [];
  let tamanho = 0;
  for await (const pedaco of req) {
    const buffer = typeof pedaco === 'string' ? Buffer.from(pedaco) : (pedaco as Buffer);
    tamanho += buffer.length;
    if (tamanho > limite) return null;
    pedacos.push(buffer);
  }
  return Buffer.concat(pedacos).toString('utf8');
}

function ipDoPedido(req: IncomingMessage): string {
  const encaminhado = req.headers['x-forwarded-for'];
  const primeiro = (Array.isArray(encaminhado) ? encaminhado[0] : encaminhado)?.split(',')[0];
  return primeiro?.trim() || req.socket.remoteAddress || 'desconhecido';
}

/** Liga o tratador puro a um servidor HTTP do Node (função da Vercel ou Vite local). */
export function criarTratadorNode(armazenamento: Armazenamento) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const caminho = new URL(req.url ?? '/', 'http://local').pathname;
      const id = caminho.startsWith(ROTA_DAS_LISTAS) ? caminho.slice(ROTA_DAS_LISTAS.length) : '';
      const metodo = req.method ?? 'GET';

      let corpo: string | undefined;
      if (metodo === 'PUT') {
        const lido = await lerCorpo(req, LIMITES_DA_API.tamanhoMaximo);
        if (lido === null) {
          res.writeHead(413, { 'Cache-Control': 'no-store' }).end('conteúdo grande demais');
          return;
        }
        corpo = lido;
      }

      const resposta = await tratar(
        { metodo, id, autorizacao: req.headers.authorization, corpo, ip: ipDoPedido(req) },
        armazenamento,
      );
      res.writeHead(resposta.status, resposta.cabecalhos).end(resposta.corpo);
    } catch {
      // Nada de detalhes do erro na resposta nem em log.
      if (!res.headersSent) res.writeHead(500, { 'Cache-Control': 'no-store' });
      res.end('erro');
    }
  };
}
