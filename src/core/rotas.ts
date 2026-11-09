export type Rota =
  | { tela: 'evento' }
  | { tela: 'participantes' }
  | { tela: 'restricoes' }
  | { tela: 'sortear' }
  | { tela: 'links' }
  | { tela: 'instalar' }
  | { tela: 'ver'; payload: string };

export const CAMINHOS = {
  evento: '#/',
  participantes: '#/participantes',
  restricoes: '#/restricoes',
  sortear: '#/sortear',
  links: '#/links',
  instalar: '#/instalar',
} as const;

/** Interpreta o fragmento da URL (`location.hash`). Rota desconhecida cai no início. */
export function interpretarRota(hash: string): Rota {
  const caminho = hash.replace(/^#/, '');
  if (caminho.startsWith('/ver/')) return { tela: 'ver', payload: caminho.slice('/ver/'.length) };
  switch (caminho.replace(/\/+$/, '')) {
    case '/participantes':
      return { tela: 'participantes' };
    case '/restricoes':
      return { tela: 'restricoes' };
    case '/sortear':
      return { tela: 'sortear' };
    case '/links':
      return { tela: 'links' };
    case '/instalar':
      return { tela: 'instalar' };
    default:
      return { tela: 'evento' };
  }
}
