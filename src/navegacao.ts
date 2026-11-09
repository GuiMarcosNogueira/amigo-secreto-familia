import { useSyncExternalStore } from 'react';
import { interpretarRota, type Rota } from './core/rotas';

function assinar(aoMudar: () => void): () => void {
  window.addEventListener('hashchange', aoMudar);
  return () => window.removeEventListener('hashchange', aoMudar);
}

/** A rota atual, a partir do fragmento (#) da URL. */
export function useHashRoute(): Rota {
  const hash = useSyncExternalStore(assinar, () => window.location.hash);
  return interpretarRota(hash);
}

export function ir(caminho: string): void {
  window.location.hash = caminho;
}

/** Endereço do app sem o fragmento: a base dos links de revelação. */
export function enderecoDoApp(): string {
  return window.location.origin + window.location.pathname;
}
