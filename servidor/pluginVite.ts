import type { Connect, Plugin } from 'vite';
import { armazenamentoEmMemoria } from './memoria.js';
import { criarTratadorNode, ROTA_DAS_LISTAS } from './node.js';

/**
 * Em `npm run dev` e `npm run preview`, serve a API das listas de desejos com
 * armazenamento em memória. Assim dá para testar tudo sem conta em lugar nenhum
 * (as listas somem quando o servidor local é encerrado).
 */
export function apiLocalDeListas(): Plugin {
  const tratador = criarTratadorNode(armazenamentoEmMemoria());
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url?.startsWith(ROTA_DAS_LISTAS)) void tratador(req, res);
    else next();
  };
  return {
    name: 'amigo-secreto:api-local-de-listas',
    configureServer(servidor) {
      servidor.middlewares.use(middleware);
    },
    configurePreviewServer(servidor) {
      servidor.middlewares.use(middleware);
    },
  };
}
