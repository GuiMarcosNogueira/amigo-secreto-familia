import type { Armazenamento } from './listas.js';

/** O pedacinho do cliente Redis que usamos (facilita trocar de banco e testar). */
export interface ClienteRedis {
  get(chave: string): Promise<unknown>;
  set(chave: string, valor: string, opcoes: { ex: number }): Promise<unknown>;
  incr(chave: string): Promise<number>;
  expire(chave: string, segundos: number): Promise<unknown>;
}

const PREFIXO = 'lista:';

export function armazenamentoRedis(redis: ClienteRedis): Armazenamento {
  return {
    async ler(id) {
      const valor = await redis.get(PREFIXO + id);
      return typeof valor === 'string' && valor !== '' ? valor : null;
    },
    async gravar(id, conteudo, validadeEmSegundos) {
      await redis.set(PREFIXO + id, conteudo, { ex: validadeEmSegundos });
    },
    async contar(chave, janelaEmSegundos) {
      const total = await redis.incr(chave);
      if (total === 1) await redis.expire(chave, janelaEmSegundos);
      return total;
    },
  };
}

/**
 * Credenciais do Upstash Redis, lidas só de variáveis de ambiente.
 * A integração da Vercel cria `KV_REST_API_*`; o painel do Upstash usa `UPSTASH_REDIS_REST_*`.
 */
export function credenciaisDoAmbiente(
  env: Record<string, string | undefined>,
): { url: string; token: string } | null {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}
