import { describe, expect, it } from 'vitest';
import { bytesAleatorios } from './aleatorio';
import { cifrar, deBase64Url, decifrar, paraBase64Url, textoParaBytes } from './cripto';
import { decifrarLista, derivarAcesso } from './desejos';
import {
  criarPayload,
  gerarLinks,
  lerPayload,
  payloadDaUrl,
  urlDoLink,
  type ConteudoDoLink,
} from './link';
import { sortear } from './sorteio';
import type { Evento, Participante } from './tipos';

const conteudo: ConteudoDoLink = {
  c: 'K7P2',
  de: 'Vó Maria',
  para: 'João 🎁',
  ev: { n: 'Natal 2026', d: '2026-12-24', val: 50, msg: 'Até lá, família! ❤️' },
  s: paraBase64Url(new Uint8Array(32).fill(7)),
  al: { id: 'a'.repeat(43), k: 'b'.repeat(43) },
};

function trocarCaractere(texto: string, posicao: number): string {
  const atual = texto[posicao]!;
  return texto.slice(0, posicao) + (atual === 'A' ? 'B' : 'A') + texto.slice(posicao + 1);
}

describe('base64url', () => {
  it('vai e volta com qualquer tamanho', () => {
    for (let n = 0; n < 40; n++) {
      const bytes = bytesAleatorios(n);
      const texto = paraBase64Url(bytes);
      expect(texto).toMatch(/^[A-Za-z0-9_-]*$/);
      expect([...deBase64Url(texto)]).toEqual([...bytes]);
    }
  });

  it('recusa caracteres de fora do alfabeto', () => {
    expect(() => deBase64Url('ab+/')).toThrow();
    expect(() => deBase64Url('ab=')).toThrow();
    expect(() => deBase64Url('a')).toThrow();
  });
});

describe('AES-GCM', () => {
  it('ida e volta', async () => {
    const chave = bytesAleatorios(32);
    const dados = textoParaBytes('coração, ação e 🎄');
    const pacote = await cifrar(chave, dados);
    expect([...(await decifrar(chave, pacote))]).toEqual([...dados]);
  });

  it('usa IV novo a cada vez', async () => {
    const chave = bytesAleatorios(32);
    const dados = textoParaBytes('igual');
    expect(paraBase64Url(await cifrar(chave, dados))).not.toBe(
      paraBase64Url(await cifrar(chave, dados)),
    );
  });

  it('recusa chave errada e pacote alterado', async () => {
    const chave = bytesAleatorios(32);
    const pacote = await cifrar(chave, textoParaBytes('segredo'));
    await expect(decifrar(bytesAleatorios(32), pacote)).rejects.toThrow();
    const alterado = pacote.slice();
    alterado[alterado.length - 1]! ^= 1;
    await expect(decifrar(chave, alterado)).rejects.toThrow();
  });
});

describe('payload do link', () => {
  it('ida e volta, com acentos e emoji', async () => {
    const payload = await criarPayload(conteudo);
    expect(payload).toMatch(/^v1\.[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]+$/);
    expect(await lerPayload(payload)).toEqual({ ok: true, conteudo });
  });

  it('ida e volta com preenchimento e sem valor nem mensagem', async () => {
    const simples: ConteudoDoLink = { ...conteudo, ev: { n: 'Natal', d: '2026-12-24' } };
    const lido = await lerPayload(await criarPayload(simples, 900));
    expect(lido).toEqual({ ok: true, conteudo: simples });
  });

  it('não deixa nada legível no link', async () => {
    const payload = await criarPayload(conteudo);
    for (const pedaco of ['Maria', 'Jo', 'Natal', 'K7P2']) {
      expect(payload).not.toContain(pedaco);
      expect(payload).not.toContain(paraBase64Url(textoParaBytes(pedaco)).slice(0, 4) + 'XX');
    }
    const [, , dados] = payload.split('.');
    const bruto = new TextDecoder('latin1').decode(deBase64Url(dados!));
    expect(bruto).not.toContain('Maria');
    expect(bruto).not.toContain('Natal');
  });

  it('link adulterado: trocar um caractere em qualquer parte invalida', async () => {
    const payload = await criarPayload(conteudo);
    const [, chave, dados] = payload.split('.') as [string, string, string];
    const inicioDados = payload.length - dados.length;
    const posicoes = [
      3, // chave
      3 + Math.floor(chave.length / 2),
      inicioDados, // IV
      inicioDados + 20, // texto cifrado
      inicioDados + Math.floor(dados.length / 2),
      payload.length - 3, // tag
    ];
    for (const posicao of posicoes) {
      expect(await lerPayload(trocarCaractere(payload, posicao))).toEqual({ ok: false });
    }
  });

  it('link cortado', async () => {
    const payload = await criarPayload(conteudo);
    for (const corte of [0, 2, 10, 60, payload.length - 10, payload.length - 1]) {
      expect(await lerPayload(payload.slice(0, corte))).toEqual({ ok: false });
    }
  });

  it('chave de outro link', async () => {
    const a = (await criarPayload(conteudo)).split('.');
    const b = (await criarPayload(conteudo)).split('.');
    expect(await lerPayload(`v1.${b[1]}.${a[2]}`)).toEqual({ ok: false });
  });

  it('versão desconhecida e lixo', async () => {
    const [, chave, dados] = (await criarPayload(conteudo)).split('.');
    for (const ruim of [
      `v2.${chave}.${dados}`,
      `${chave}.${dados}`,
      'v1..',
      'olá',
      '',
      'v1.a.b.c',
    ]) {
      expect(await lerPayload(ruim)).toEqual({ ok: false });
    }
  });

  it('conteúdo bem cifrado mas com campos faltando é inválido', async () => {
    const chave = bytesAleatorios(32);
    const dados = await cifrar(chave, textoParaBytes(JSON.stringify({ v: 1, de: 'Ana' })));
    const payload = `v1.${paraBase64Url(chave)}.${paraBase64Url(dados)}`;
    expect(await lerPayload(payload)).toEqual({ ok: false });
  });
});

describe('gerarLinks', () => {
  const evento: Evento = { nome: 'Natal 2026', data: '2026-12-24', valor: '50', mensagem: '' };
  const participantes: Participante[] = [
    { id: 'a', nome: 'Ana' },
    { id: 'b', nome: 'Bartolomeu Henrique de Albuquerque' },
    { id: 'c', nome: 'Caio' },
    { id: 'd', nome: 'Vó Maria' },
  ];
  const ids = participantes.map((p) => p.id);

  it('gera um link diferente por pessoa, todos com o mesmo comprimento', async () => {
    const salvos = await gerarLinks(evento, participantes, sortear(ids, []), 'https://x.app/');
    expect(salvos.links.map((l) => l.participante)).toEqual(participantes.map((p) => p.nome));
    expect(new Set(salvos.links.map((l) => l.url)).size).toBe(4);
    expect(new Set(salvos.links.map((l) => l.url.length)).size).toBe(1);
    for (const link of salvos.links) {
      expect(link.url.startsWith('https://x.app/#/ver/v1.')).toBe(true);
      expect(link.enviado).toBe(false);
    }
    expect(salvos.codigo).toMatch(/^[A-Z2-9]{4}$/);
  });

  it('cada link abre o resultado certo, com o código do sorteio e os dados do evento', async () => {
    const sorteio = sortear(ids, [['a', 'b']]);
    const salvos = await gerarLinks(evento, participantes, sorteio, 'https://x.app');
    const nomes = new Map(participantes.map((p) => [p.id, p.nome]));
    for (const [i, link] of salvos.links.entries()) {
      const lido = await lerPayload(payloadDaUrl(link.url)!);
      if (!lido.ok) throw new Error('link inválido');
      expect(lido.conteudo.de).toBe(participantes[i]!.nome);
      expect(lido.conteudo.para).toBe(nomes.get(sorteio.get(participantes[i]!.id)!));
      expect(lido.conteudo.c).toBe(salvos.codigo);
      expect(lido.conteudo.ev).toEqual({ n: 'Natal 2026', d: '2026-12-24', val: 50 });
    }
  });

  it('o que fica salvo não mostra nenhum par em texto legível', async () => {
    const salvos = await gerarLinks(evento, participantes, sortear(ids, []), 'https://x.app');
    const guardado = JSON.stringify(salvos);
    // Os nomes aparecem uma única vez cada: como dono do link, nunca como sorteado.
    for (const p of participantes) {
      expect(guardado.split(JSON.stringify(p.nome)).length - 1).toBe(1);
    }
    expect(Object.keys(salvos.links[0]!).sort()).toEqual(['enviado', 'participante', 'url']);
  });

  it('quem sorteou recebe o acesso de leitura da lista do sorteado, e só dele', async () => {
    const sorteio = sortear(ids, []);
    const salvos = await gerarLinks(evento, participantes, sorteio, 'https://x.app');
    const conteudos = new Map<string, ConteudoDoLink>();
    for (const link of salvos.links) {
      const lido = await lerPayload(payloadDaUrl(link.url)!);
      if (!lido.ok) throw new Error('link inválido');
      conteudos.set(lido.conteudo.de, lido.conteudo);
    }
    for (const meu of conteudos.values()) {
      const dele = conteudos.get(meu.para)!;
      const acessoDele = await derivarAcesso(dele.s);
      expect(meu.al).toEqual({ id: acessoDele.id, k: acessoDele.chave });
      // O link de quem sorteou não carrega a semente nem o token do sorteado.
      const texto = JSON.stringify(meu);
      expect(texto).not.toContain(dele.s);
      expect(texto).not.toContain(acessoDele.token);
    }
    // Sementes todas diferentes.
    expect(new Set([...conteudos.values()].map((c) => c.s)).size).toBe(4);
    expect(await decifrarLista('x', 'y')).toBeNull();
  });

  it('monta a URL sem barras nem fragmentos sobrando', () => {
    expect(urlDoLink('https://x.app/', 'P')).toBe('https://x.app/#/ver/P');
    expect(urlDoLink('https://x.app/#/links', 'P')).toBe('https://x.app/#/ver/P');
    expect(payloadDaUrl('https://x.app/#/ver/v1.a.b')).toBe('v1.a.b');
    expect(payloadDaUrl('https://x.app/')).toBeNull();
  });
});
