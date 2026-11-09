import { describe, expect, it } from 'vitest';
import { bytesAleatorios } from './aleatorio';
import { paraBase64Url, sha256, textoParaBytes } from './cripto';
import {
  acessoDeLeitura,
  cifrarLista,
  decifrarLista,
  derivarAcesso,
  validarItem,
  validarLista,
  type ListaDeDesejos,
} from './desejos';

const semente = () => paraBase64Url(bytesAleatorios(32));
const lista: ListaDeDesejos = {
  itens: ['Livro de receitas', 'Meias quentinhas 🧦', 'Caneca de café'],
  obs: 'Calço 38. Não gosto de amarelo.',
  em: '2026-11-09T12:00:00.000Z',
};

describe('derivarAcesso', () => {
  it('é determinística e diferente para cada semente', async () => {
    const s = semente();
    expect(await derivarAcesso(s)).toEqual(await derivarAcesso(s));
    expect((await derivarAcesso(s)).id).not.toBe((await derivarAcesso(semente())).id);
  });

  it('gera token, chave e endereço distintos, com 43 caracteres', async () => {
    const acesso = await derivarAcesso(semente());
    for (const valor of [acesso.id, acesso.chave, acesso.token]) {
      expect(valor).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
    expect(new Set([acesso.id, acesso.chave, acesso.token]).size).toBe(3);
  });

  it('o endereço é o SHA-256 do token (é assim que o servidor confere a gravação)', async () => {
    const acesso = await derivarAcesso(semente());
    expect(paraBase64Url(await sha256(textoParaBytes(acesso.token)))).toBe(acesso.id);
  });

  it('quem sorteou recebe endereço e chave, mas não o token nem a semente', async () => {
    const s = semente();
    const dono = await derivarAcesso(s);
    const leitura = acessoDeLeitura(dono);
    expect(leitura).toEqual({ id: dono.id, k: dono.chave });
    expect(JSON.stringify(leitura)).not.toContain(dono.token);
    expect(JSON.stringify(leitura)).not.toContain(s);
  });

  it('recusa semente inválida', async () => {
    await expect(derivarAcesso('curta')).rejects.toThrow();
    await expect(derivarAcesso('não é base64!')).rejects.toThrow();
  });
});

describe('cifra da lista', () => {
  it('ida e volta com acentos e emoji: quem tem a chave de leitura decifra', async () => {
    const dono = await derivarAcesso(semente());
    const conteudo = await cifrarLista(dono.chave, lista);
    expect(conteudo).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(conteudo).not.toContain('Livro');
    expect(await decifrarLista(acessoDeLeitura(dono).k, conteudo)).toEqual(lista);
  });

  it('cabe com folga no limite do servidor mesmo no pior caso', async () => {
    const dono = await derivarAcesso(semente());
    const enorme: ListaDeDesejos = {
      itens: Array.from({ length: 10 }, () => '🎁'.repeat(50)),
      obs: '🎄'.repeat(100),
      em: lista.em,
    };
    expect(validarLista(enorme.itens, enorme.obs)).toBeNull();
    expect((await cifrarLista(dono.chave, enorme)).length).toBeLessThan(8192);
  });

  it('conteúdo adulterado, chave de outra pessoa ou lixo devolvem null', async () => {
    const dono = await derivarAcesso(semente());
    const outro = await derivarAcesso(semente());
    const conteudo = await cifrarLista(dono.chave, lista);
    const adulterado =
      conteudo.slice(0, 30) + (conteudo[30] === 'A' ? 'B' : 'A') + conteudo.slice(31);
    expect(await decifrarLista(dono.chave, adulterado)).toBeNull();
    expect(await decifrarLista(outro.chave, conteudo)).toBeNull();
    expect(await decifrarLista(dono.chave, 'lixo')).toBeNull();
    expect(await decifrarLista(dono.chave, '')).toBeNull();
  });
});

describe('limites da lista', () => {
  it('recusa item vazio, item longo e o 11º item', () => {
    expect(validarItem([], '   ')).toBe('itemVazio');
    expect(validarItem([], 'x'.repeat(101))).toBe('itemLongo');
    expect(validarItem([], 'x'.repeat(100))).toBeNull();
    const dez = Array.from({ length: 10 }, (_, i) => `item ${i}`);
    expect(validarItem(dez, 'mais um')).toBe('muitosItens');
    expect(validarItem(dez.slice(1), 'mais um')).toBeNull();
  });

  it('valida a lista inteira', () => {
    expect(validarLista([], '')).toBeNull();
    expect(validarLista(['a'], 'x'.repeat(200))).toBeNull();
    expect(validarLista(['a'], 'x'.repeat(201))).toBe('obsLonga');
    expect(
      validarLista(
        Array.from({ length: 11 }, () => 'a'),
        '',
      ),
    ).toBe('muitosItens');
  });
});
