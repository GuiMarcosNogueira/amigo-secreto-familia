export type Id = string;

export interface Participante {
  id: Id;
  nome: string;
}

/** Par de ids que não podem se tirar. Sempre guardado em ordem alfabética dos ids. */
export type Par = [Id, Id];

export interface Evento {
  nome: string;
  /** Data da troca, no formato AAAA-MM-DD. */
  data: string;
  /** Valor sugerido, como a pessoa digitou. Vazio = sem valor. */
  valor: string;
  mensagem: string;
}

export interface Rascunho {
  evento: Evento;
  participantes: Participante[];
  restricoes: Par[];
}

export interface LinkGerado {
  participante: string;
  url: string;
  enviado: boolean;
}

export interface LinksSalvos {
  codigo: string;
  criadoEm: string;
  links: LinkGerado[];
}

export const LIMITES = {
  nomeEvento: 60,
  mensagem: 280,
  nomeParticipante: 40,
  participantes: 50,
  minimoParticipantes: 3,
  itensLista: 10,
  itemLista: 100,
  observacaoLista: 200,
} as const;

export function rascunhoVazio(): Rascunho {
  return {
    evento: { nome: '', data: '', valor: '', mensagem: '' },
    participantes: [],
    restricoes: [],
  };
}
