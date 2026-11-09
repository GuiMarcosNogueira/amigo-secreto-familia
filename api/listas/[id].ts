import type { IncomingMessage, ServerResponse } from 'node:http';
import { Redis } from '@upstash/redis';
import { criarTratadorNode } from '../../servidor/node.js';
import { armazenamentoRedis, credenciaisDoAmbiente } from '../../servidor/upstash.js';

// A Vercel não deve interpretar o corpo: ele é lido cru, com limite de tamanho.
export const config = { api: { bodyParser: false } };

const credenciais = credenciaisDoAmbiente(process.env);
const tratador = credenciais
  ? criarTratadorNode(
      armazenamentoRedis(
        // Sem conversão automática: o conteúdo é sempre texto cifrado.
        new Redis({ ...credenciais, automaticDeserialization: false }),
      ),
    )
  : null;

export default async function listas(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!tratador) {
    res.writeHead(503, { 'Cache-Control': 'no-store' }).end('banco não configurado');
    return;
  }
  await tratador(req, res);
}
