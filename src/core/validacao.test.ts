import { describe, expect, it } from 'vitest';
import { rascunhoVazio, type Rascunho } from './tipos';
import {
  adicionarParticipante,
  adicionarRestricao,
  chaveDoNome,
  editarParticipante,
  faltamParaSortear,
  interpretarValor,
  removerParticipante,
  removerRestricao,
  validarEvento,
} from './validacao';

const HOJE = '2026-11-09';
const eventoOk = { nome: 'Natal 2026', data: '2026-12-24', valor: '50,00', mensagem: 'Até lá!' };

function comPessoas(...nomes: string[]): Rascunho {
  let r = rascunhoVazio();
  let n = 0;
  for (const nome of nomes) {
    const res = adicionarParticipante(r, nome, () => `p${++n}`);
    if (!res.ok) throw new Error(res.erro);
    r = res.rascunho;
  }
  return r;
}

describe('evento', () => {
  it('aceita o evento completo', () => {
    expect(validarEvento(eventoOk, HOJE)).toEqual({});
  });

  it('aceita só nome e data', () => {
    expect(validarEvento({ ...eventoOk, valor: '', mensagem: '' }, HOJE)).toEqual({});
  });

  it('recusa nome em branco ou longo demais', () => {
    expect(validarEvento({ ...eventoOk, nome: '   ' }, HOJE).nome).toBe('nomeVazio');
    expect(validarEvento({ ...eventoOk, nome: 'x'.repeat(61) }, HOJE).nome).toBe('nomeLongo');
  });

  it('recusa data ausente, inválida ou no passado, e aceita hoje', () => {
    expect(validarEvento({ ...eventoOk, data: '' }, HOJE).data).toBe('dataVazia');
    expect(validarEvento({ ...eventoOk, data: '2026-02-30' }, HOJE).data).toBe('dataVazia');
    expect(validarEvento({ ...eventoOk, data: '2026-11-08' }, HOJE).data).toBe('dataPassada');
    expect(validarEvento({ ...eventoOk, data: HOJE }, HOJE).data).toBeUndefined();
  });

  it('recusa valor negativo, zero ou que não é número', () => {
    for (const valor of ['-5', '0', 'abc', '10,999', '1,2,3']) {
      expect(validarEvento({ ...eventoOk, valor }, HOJE).valor).toBe('valorInvalido');
    }
  });

  it('recusa mensagem acima de 280 caracteres', () => {
    expect(validarEvento({ ...eventoOk, mensagem: 'x'.repeat(281) }, HOJE).mensagem).toBe(
      'mensagemLonga',
    );
    expect(validarEvento({ ...eventoOk, mensagem: 'x'.repeat(280) }, HOJE).mensagem).toBeUndefined();
  });

  it('interpreta valores no jeito brasileiro', () => {
    expect(interpretarValor('')).toBeNull();
    expect(interpretarValor('50')).toBe(50);
    expect(interpretarValor('50,5')).toBe(50.5);
    expect(interpretarValor('R$ 1.250,90')).toBe(1250.9);
    expect(interpretarValor('1.000')).toBe(1000);
    expect(interpretarValor('49.90')).toBe(49.9);
  });
});

describe('participantes', () => {
  it('adiciona arrumando espaços', () => {
    const r = comPessoas('  Vó   Maria ');
    expect(r.participantes).toEqual([{ id: 'p1', nome: 'Vó Maria' }]);
  });

  it('recusa nome vazio, longo e repetido', () => {
    const r = comPessoas('José');
    expect(adicionarParticipante(r, '   ', () => 'x')).toEqual({ ok: false, erro: 'vazio' });
    expect(adicionarParticipante(r, 'x'.repeat(41), () => 'x')).toEqual({ ok: false, erro: 'longo' });
    expect(adicionarParticipante(r, ' jose ', () => 'x')).toEqual({ ok: false, erro: 'duplicado' });
    expect(adicionarParticipante(r, 'JOSÉ', () => 'x')).toEqual({ ok: false, erro: 'duplicado' });
  });

  it('compara nomes sem acento, maiúscula nem espaço', () => {
    expect(chaveDoNome('  JOÃO  da   Silva ')).toBe('joao da silva');
  });

  it('respeita o limite de 50 pessoas', () => {
    const r = comPessoas(...Array.from({ length: 50 }, (_, i) => `Pessoa ${i}`));
    expect(adicionarParticipante(r, 'Mais um', () => 'x')).toEqual({ ok: false, erro: 'limite' });
  });

  it('edita mantendo o id e recusa edição que cria duplicata', () => {
    const r = comPessoas('Ana Paula', 'Ana');
    const editado = editarParticipante(r, 'p1', 'Ana P.');
    expect(editado.ok && editado.rascunho.participantes[0]).toEqual({ id: 'p1', nome: 'Ana P.' });
    expect(editarParticipante(r, 'p1', 'ana')).toEqual({ ok: false, erro: 'duplicado' });
    // Editar para o próprio nome (mudando só maiúsculas) é permitido.
    expect(editarParticipante(r, 'p2', 'ANA').ok).toBe(true);
  });

  it('informa quantos faltam para sortear', () => {
    expect(faltamParaSortear(comPessoas())).toBe(3);
    expect(faltamParaSortear(comPessoas('A', 'B'))).toBe(1);
    expect(faltamParaSortear(comPessoas('A', 'B', 'C', 'D'))).toBe(0);
  });
});

describe('restrições', () => {
  it('vale nos dois sentidos e não duplica', () => {
    const r = comPessoas('Ana', 'Beto', 'Caio');
    const um = adicionarRestricao(r, 'p2', 'p1');
    if (!um.ok) throw new Error();
    expect(um.rascunho.restricoes).toEqual([['p1', 'p2']]);
    expect(adicionarRestricao(um.rascunho, 'p1', 'p2')).toEqual({ ok: false, erro: 'repetida' });
    expect(adicionarRestricao(um.rascunho, 'p2', 'p1')).toEqual({ ok: false, erro: 'repetida' });
  });

  it('recusa a mesma pessoa e pessoas que não existem', () => {
    const r = comPessoas('Ana', 'Beto');
    expect(adicionarRestricao(r, 'p1', 'p1')).toEqual({ ok: false, erro: 'mesmaPessoa' });
    expect(adicionarRestricao(r, 'p1', 'p9')).toEqual({ ok: false, erro: 'desconhecido' });
  });

  it('remove a restrição em qualquer ordem', () => {
    const r = comPessoas('Ana', 'Beto');
    const um = adicionarRestricao(r, 'p1', 'p2');
    if (!um.ok) throw new Error();
    expect(removerRestricao(um.rascunho, 'p2', 'p1').restricoes).toEqual([]);
  });

  it('some junto com o participante removido e sobrevive à edição do nome', () => {
    let r = comPessoas('Ana', 'Beto', 'Caio');
    for (const [a, b] of [
      ['p1', 'p2'],
      ['p2', 'p3'],
    ] as const) {
      const res = adicionarRestricao(r, a, b);
      if (!res.ok) throw new Error();
      r = res.rascunho;
    }
    const editado = editarParticipante(r, 'p1', 'Aninha');
    if (!editado.ok) throw new Error();
    expect(editado.rascunho.restricoes).toHaveLength(2);
    const semAna = removerParticipante(editado.rascunho, 'p1');
    expect(semAna.participantes.map((p) => p.nome)).toEqual(['Beto', 'Caio']);
    expect(semAna.restricoes).toEqual([['p2', 'p3']]);
  });
});
