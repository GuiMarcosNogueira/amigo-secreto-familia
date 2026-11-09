import { describe, expect, it } from 'vitest';
import { tratar } from '../../servidor/listas.js';
import { armazenamentoEmMemoria } from '../../servidor/memoria.js';
import { bytesAleatorios } from './aleatorio';
import { lerLista, lerMinhaLista, salvarMinhaLista } from './clienteListas';
import { paraBase64Url } from './cripto';
import { acessoDeLeitura, derivarAcesso, type ListaDeDesejos } from './desejos';

/** Um `fetch` falso que fala direto com o tratador da API, e anota o que trafegou. */
function servidorFalso() {
  const arm = armazenamentoEmMemoria();
  const trafego: string[] = [];
  const buscar = (async (url: string, init?: RequestInit) => {
    const cabecalhos = new Headers(init?.headers);
    const corpo = typeof init?.body === 'string' ? init.body : undefined;
    trafego.push([url, cabecalhos.get('Authorization') ?? '', corpo ?? ''].join(' '));
    const r = await tratar(
      {
        metodo: init?.method ?? 'GET',
        id: url.slice('/api/listas/'.length),
        autorizacao: cabecalhos.get('Authorization') ?? undefined,
        corpo,
        ip: '1.1.1.1',
      },
      arm,
    );
    return new Response(r.status === 204 ? null : (r.corpo ?? null), { status: r.status });
  }) as typeof fetch;
  return { arm, buscar, trafego };
}

const semente = () => paraBase64Url(bytesAleatorios(32));
const lista: ListaDeDesejos = {
  itens: ['Livro de receitas', 'Meias quentinhas'],
  obs: 'Calço 38',
  em: '2026-11-09T12:00:00.000Z',
};

describe('cliente das listas', () => {
  it('lista ainda não escrita aparece como vazia', async () => {
    const { buscar } = servidorFalso();
    expect(await lerMinhaLista(semente(), buscar)).toEqual({ tipo: 'vazia' });
  });

  it('Ana salva; ela mesma e quem a sorteou leem; outra pessoa não', async () => {
    const { buscar } = servidorFalso();
    const ana = semente();
    expect(await salvarMinhaLista(ana, lista, buscar)).toBe('ok');
    expect(await lerMinhaLista(ana, buscar)).toEqual({ tipo: 'ok', lista });

    const acessoDoBeto = acessoDeLeitura(await derivarAcesso(ana));
    expect(await lerLista(acessoDoBeto, buscar)).toEqual({ tipo: 'ok', lista });

    // Caio conhece o endereço, mas tem a chave de outra lista.
    const chaveErrada = (await derivarAcesso(semente())).chave;
    expect(await lerLista({ id: acessoDoBeto.id, k: chaveErrada }, buscar)).toEqual({ tipo: 'erro' });
  });

  it('o que trafega e o que fica guardado não tem nada legível', async () => {
    const { buscar, trafego, arm } = servidorFalso();
    const ana = semente();
    await salvarMinhaLista(ana, lista, buscar);
    const dono = await derivarAcesso(ana);
    const tudo = trafego.join('\n') + [...arm.listas.values()].map((r) => r.valor).join('\n');
    for (const segredo of ['Livro', 'Meias', 'Calço', ana, dono.chave]) {
      expect(tudo).not.toContain(segredo);
    }
    expect([...arm.listas.keys()]).toEqual([dono.id]);
  });

  it('salvar uma lista vazia apaga a lista para quem sorteou', async () => {
    const { buscar } = servidorFalso();
    const ana = semente();
    await salvarMinhaLista(ana, lista, buscar);
    await salvarMinhaLista(ana, { itens: [], obs: '', em: lista.em }, buscar);
    expect(await lerMinhaLista(ana, buscar)).toEqual({ tipo: 'vazia' });
  });

  it('sem internet: erro amigável em vez de exceção', async () => {
    const semRede = (async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;
    expect(await lerMinhaLista(semente(), semRede)).toEqual({ tipo: 'erro' });
    expect(await salvarMinhaLista(semente(), lista, semRede)).toBe('erro');
  });

  it('servidor fora do ar ou no limite', async () => {
    const com = (status: number) => (async () => new Response('x', { status })) as typeof fetch;
    expect(await lerMinhaLista(semente(), com(503))).toEqual({ tipo: 'erro' });
    expect(await salvarMinhaLista(semente(), lista, com(503))).toBe('erro');
    expect(await salvarMinhaLista(semente(), lista, com(429))).toBe('limite');
  });
});
