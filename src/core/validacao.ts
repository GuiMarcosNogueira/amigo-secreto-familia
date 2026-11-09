import { LIMITES, type Evento, type Id, type Par, type Rascunho } from './tipos';

export type ErroEvento =
  'nomeVazio' | 'nomeLongo' | 'dataVazia' | 'dataPassada' | 'valorInvalido' | 'mensagemLonga';

export interface ErrosEvento {
  nome?: ErroEvento;
  data?: ErroEvento;
  valor?: ErroEvento;
  mensagem?: ErroEvento;
}

/**
 * Lê o valor digitado ("50", "50,00", "1.250,90").
 * Devolve `null` para vazio e `'invalido'` para o que não for um valor positivo.
 */
export function interpretarValor(texto: string): number | null | 'invalido' {
  const limpo = texto.trim().replace(/^R\$\s*/i, '');
  if (limpo === '') return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(limpo)) return 'invalido';
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(\.\d{3})+$/.test(limpo)
      ? limpo.replace(/\./g, '')
      : limpo;
  const numero = Number(normalizado);
  if (!Number.isFinite(numero) || numero <= 0 || numero > 1_000_000) return 'invalido';
  return Math.round(numero * 100) / 100;
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const d = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === data;
}

/** `hoje` no formato AAAA-MM-DD (data local do aparelho). */
export function validarEvento(evento: Evento, hoje: string): ErrosEvento {
  const erros: ErrosEvento = {};
  const nome = evento.nome.trim();
  if (nome === '') erros.nome = 'nomeVazio';
  else if (nome.length > LIMITES.nomeEvento) erros.nome = 'nomeLongo';

  if (!dataValida(evento.data)) erros.data = 'dataVazia';
  else if (evento.data < hoje) erros.data = 'dataPassada';

  if (interpretarValor(evento.valor) === 'invalido') erros.valor = 'valorInvalido';
  if (evento.mensagem.trim().length > LIMITES.mensagem) erros.mensagem = 'mensagemLonga';
  return erros;
}

export function eventoValido(evento: Evento, hoje: string): boolean {
  return Object.keys(validarEvento(evento, hoje)).length === 0;
}

/** Chave de comparação de nomes: sem acentos, sem maiúsculas, sem espaços sobrando. */
export function chaveDoNome(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function arrumarNome(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ');
}

export type ErroParticipante = 'vazio' | 'longo' | 'duplicado' | 'limite';
export type Resultado<E> = { ok: true; rascunho: Rascunho } | { ok: false; erro: E };

function validarNome(rascunho: Rascunho, nome: string, ignorarId?: Id): ErroParticipante | null {
  const arrumado = arrumarNome(nome);
  if (arrumado === '') return 'vazio';
  if (arrumado.length > LIMITES.nomeParticipante) return 'longo';
  const chave = chaveDoNome(arrumado);
  const repetido = rascunho.participantes.some(
    (p) => p.id !== ignorarId && chaveDoNome(p.nome) === chave,
  );
  return repetido ? 'duplicado' : null;
}

export function adicionarParticipante(
  rascunho: Rascunho,
  nome: string,
  novoId: () => Id,
): Resultado<ErroParticipante> {
  if (rascunho.participantes.length >= LIMITES.participantes) return { ok: false, erro: 'limite' };
  const erro = validarNome(rascunho, nome);
  if (erro) return { ok: false, erro };
  return {
    ok: true,
    rascunho: {
      ...rascunho,
      participantes: [...rascunho.participantes, { id: novoId(), nome: arrumarNome(nome) }],
    },
  };
}

export function editarParticipante(
  rascunho: Rascunho,
  id: Id,
  nome: string,
): Resultado<ErroParticipante> {
  const erro = validarNome(rascunho, nome, id);
  if (erro) return { ok: false, erro };
  return {
    ok: true,
    rascunho: {
      ...rascunho,
      participantes: rascunho.participantes.map((p) =>
        p.id === id ? { ...p, nome: arrumarNome(nome) } : p,
      ),
    },
  };
}

/** Remove a pessoa e todas as restrições que a envolviam. */
export function removerParticipante(rascunho: Rascunho, id: Id): Rascunho {
  return {
    ...rascunho,
    participantes: rascunho.participantes.filter((p) => p.id !== id),
    restricoes: rascunho.restricoes.filter(([a, b]) => a !== id && b !== id),
  };
}

export function ordenarPar(a: Id, b: Id): Par {
  return a < b ? [a, b] : [b, a];
}

export type ErroRestricao = 'mesmaPessoa' | 'desconhecido' | 'repetida';

export function adicionarRestricao(rascunho: Rascunho, a: Id, b: Id): Resultado<ErroRestricao> {
  if (a === b) return { ok: false, erro: 'mesmaPessoa' };
  const ids = new Set(rascunho.participantes.map((p) => p.id));
  if (!ids.has(a) || !ids.has(b)) return { ok: false, erro: 'desconhecido' };
  const par = ordenarPar(a, b);
  if (rascunho.restricoes.some(([x, y]) => x === par[0] && y === par[1])) {
    return { ok: false, erro: 'repetida' };
  }
  return { ok: true, rascunho: { ...rascunho, restricoes: [...rascunho.restricoes, par] } };
}

export function removerRestricao(rascunho: Rascunho, a: Id, b: Id): Rascunho {
  const par = ordenarPar(a, b);
  return {
    ...rascunho,
    restricoes: rascunho.restricoes.filter(([x, y]) => !(x === par[0] && y === par[1])),
  };
}

/** Nomes de uma restrição, na ordem em que as pessoas aparecem na lista. */
export function nomesDaRestricao(rascunho: Rascunho, [a, b]: Par): [string, string] {
  const posicao = (id: Id) => rascunho.participantes.findIndex((p) => p.id === id);
  const nome = (id: Id) => rascunho.participantes.find((p) => p.id === id)?.nome ?? '';
  return posicao(a) <= posicao(b) ? [nome(a), nome(b)] : [nome(b), nome(a)];
}

/** Quantas pessoas ainda faltam para poder sortear (0 = já pode). */
export function faltamParaSortear(rascunho: Rascunho): number {
  return Math.max(0, LIMITES.minimoParticipantes - rascunho.participantes.length);
}
