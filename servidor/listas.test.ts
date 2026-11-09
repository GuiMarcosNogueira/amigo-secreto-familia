import { describe, expect, it } from 'vitest';
import { LIMITES_DA_API, tratar, type Pedido } from './listas.js';
import { armazenamentoEmMemoria } from './memoria.js';
import { armazenamentoRedis, credenciaisDoAmbiente, type ClienteRedis } from './upstash.js';

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

async function novoAcesso() {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const resumo = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return { token, id: b64url(new Uint8Array(resumo)) };
}

function put(id: string, token: string, corpo: string, ip = '1.1.1.1'): Pedido {
  return { metodo: 'PUT', id, autorizacao: `Bearer ${token}`, corpo, ip };
}

function get(id: string): Pedido {
  return { metodo: 'GET', id, ip: '2.2.2.2' };
}

describe('API de listas', () => {
  it('404 para lista que ainda não foi escrita', async () => {
    const { id } = await novoAcesso();
    const r = await tratar(get(id), armazenamentoEmMemoria());
    expect(r.status).toBe(404);
    expect(r.cabecalhos['Cache-Control']).toBe('no-store');
  });

  it('grava com o token certo e devolve o mesmo conteúdo na leitura', async () => {
    const arm = armazenamentoEmMemoria();
    const { id, token } = await novoAcesso();
    expect((await tratar(put(id, token, 'Q29udGV1ZG8tY2lmcmFkbw'), arm)).status).toBe(204);
    const r = await tratar(get(id), arm);
    expect(r).toMatchObject({ status: 200, corpo: 'Q29udGV1ZG8tY2lmcmFkbw' });
    expect(r.cabecalhos['Cache-Control']).toBe('no-store');
  });

  it('a última gravação vence', async () => {
    const arm = armazenamentoEmMemoria();
    const { id, token } = await novoAcesso();
    await tratar(put(id, token, 'primeira'), arm);
    await tratar(put(id, token, 'segunda'), arm);
    expect((await tratar(get(id), arm)).corpo).toBe('segunda');
  });

  it('recusa gravação de quem só conhece o endereço', async () => {
    const arm = armazenamentoEmMemoria();
    const dono = await novoAcesso();
    const intruso = await novoAcesso();
    await tratar(put(dono.id, dono.token, 'original'), arm);

    const tentativas: Pedido[] = [
      put(dono.id, intruso.token, 'trocado'),
      put(dono.id, dono.id, 'trocado'), // usar o próprio endereço como token
      { metodo: 'PUT', id: dono.id, corpo: 'trocado', ip: '9.9.9.9' }, // sem token
      { metodo: 'PUT', id: dono.id, autorizacao: dono.token, corpo: 'trocado', ip: '9.9.9.9' },
      { metodo: 'PUT', id: dono.id, autorizacao: 'Bearer curto', corpo: 'trocado', ip: '9.9.9.9' },
    ];
    for (const pedido of tentativas) {
      expect((await tratar(pedido, arm)).status).toBe(403);
    }
    expect((await tratar(get(dono.id), arm)).corpo).toBe('original');
  });

  it('endereço malformado → 400, sem tocar no armazenamento', async () => {
    const arm = armazenamentoEmMemoria();
    for (const id of ['', 'curto', 'a'.repeat(44), `${'a'.repeat(42)}!`, '../../etc/passwd']) {
      expect((await tratar(get(id), arm)).status).toBe(400);
      expect((await tratar(put(id, 'x'.repeat(43), 'abc'), arm)).status).toBe(400);
    }
    expect(arm.listas.size).toBe(0);
  });

  it('recusa conteúdo acima do limite, vazio ou que não é base64url', async () => {
    const arm = armazenamentoEmMemoria();
    const { id, token } = await novoAcesso();
    const noLimite = 'a'.repeat(LIMITES_DA_API.tamanhoMaximo);
    expect((await tratar(put(id, token, noLimite + 'a'), arm)).status).toBe(413);
    expect((await tratar(put(id, token, ''), arm)).status).toBe(400);
    expect((await tratar(put(id, token, '{"itens":["texto legível"]}'), arm)).status).toBe(400);
    expect(arm.listas.size).toBe(0);
    expect((await tratar(put(id, token, noLimite), arm)).status).toBe(204);
  });

  it('429 depois de 30 gravações na mesma hora pelo mesmo IP; outro IP e a hora seguinte passam', async () => {
    let agora = Date.UTC(2026, 10, 9, 12, 0, 0);
    const relogio = () => agora;
    const arm = armazenamentoEmMemoria(relogio);
    const { id, token } = await novoAcesso();

    for (let i = 0; i < LIMITES_DA_API.gravacoesPorHora; i++) {
      expect((await tratar(put(id, token, `v${i}`), arm, relogio)).status).toBe(204);
    }
    expect((await tratar(put(id, token, 'excesso'), arm, relogio)).status).toBe(429);
    expect((await tratar(get(id), arm, relogio)).corpo).toBe('v29');
    // Leitura nunca é limitada.
    expect((await tratar(get(id), arm, relogio)).status).toBe(200);
    expect((await tratar(put(id, token, 'outro-ip', '5.5.5.5'), arm, relogio)).status).toBe(204);

    agora += 3_600_000;
    expect((await tratar(put(id, token, 'hora-seguinte'), arm, relogio)).status).toBe(204);
  });

  it('a lista vale 400 dias a partir da última gravação', async () => {
    let agora = Date.UTC(2026, 10, 9);
    const relogio = () => agora;
    const arm = armazenamentoEmMemoria(relogio);
    const { id, token } = await novoAcesso();
    await tratar(put(id, token, 'lista'), arm, relogio);

    const dia = 24 * 3_600_000;
    agora += 399 * dia;
    expect((await tratar(get(id), arm, relogio)).status).toBe(200);
    agora += 2 * dia;
    expect((await tratar(get(id), arm, relogio)).status).toBe(404);
  });

  it('outros métodos → 405', async () => {
    const { id } = await novoAcesso();
    const r = await tratar({ metodo: 'DELETE', id, ip: 'x' }, armazenamentoEmMemoria());
    expect(r.status).toBe(405);
    expect(r.cabecalhos.Allow).toBe('GET, PUT');
  });
});

describe('adaptador Redis', () => {
  function redisFalso() {
    const chamadas: unknown[][] = [];
    const dados = new Map<string, unknown>();
    const redis: ClienteRedis = {
      async get(chave) {
        chamadas.push(['get', chave]);
        return dados.get(chave) ?? null;
      },
      async set(chave, valor, opcoes) {
        chamadas.push(['set', chave, valor, opcoes]);
        dados.set(chave, valor);
        return 'OK';
      },
      async incr(chave) {
        chamadas.push(['incr', chave]);
        const total = ((dados.get(chave) as number | undefined) ?? 0) + 1;
        dados.set(chave, total);
        return total;
      },
      async expire(chave, segundos) {
        chamadas.push(['expire', chave, segundos]);
        return 1;
      },
    };
    return { redis, chamadas, dados };
  }

  it('grava com prefixo e validade, e lê de volta', async () => {
    const { redis, chamadas } = redisFalso();
    const arm = armazenamentoRedis(redis);
    await arm.gravar('abc', 'conteudo', 123);
    expect(chamadas).toContainEqual(['set', 'lista:abc', 'conteudo', { ex: 123 }]);
    expect(await arm.ler('abc')).toBe('conteudo');
    expect(await arm.ler('nao-existe')).toBeNull();
  });

  it('só define a validade do contador na primeira contagem', async () => {
    const { redis, chamadas } = redisFalso();
    const arm = armazenamentoRedis(redis);
    expect(await arm.contar('limite:x', 3600)).toBe(1);
    expect(await arm.contar('limite:x', 3600)).toBe(2);
    expect(chamadas.filter((c) => c[0] === 'expire')).toEqual([['expire', 'limite:x', 3600]]);
  });

  it('funciona de ponta a ponta com o tratador', async () => {
    const { redis, dados } = redisFalso();
    const arm = armazenamentoRedis(redis);
    const { id, token } = await novoAcesso();
    expect((await tratar(put(id, token, 'cifrado'), arm)).status).toBe(204);
    expect((await tratar(get(id), arm)).corpo).toBe('cifrado');
    expect(dados.get(`lista:${id}`)).toBe('cifrado');
  });

  it('lê as credenciais só do ambiente, nos dois formatos de nome', () => {
    expect(credenciaisDoAmbiente({})).toBeNull();
    expect(credenciaisDoAmbiente({ KV_REST_API_URL: 'u' })).toBeNull();
    expect(credenciaisDoAmbiente({ KV_REST_API_URL: 'u', KV_REST_API_TOKEN: 't' })).toEqual({
      url: 'u',
      token: 't',
    });
    expect(
      credenciaisDoAmbiente({ UPSTASH_REDIS_REST_URL: 'u2', UPSTASH_REDIS_REST_TOKEN: 't2' }),
    ).toEqual({ url: 'u2', token: 't2' });
  });
});
