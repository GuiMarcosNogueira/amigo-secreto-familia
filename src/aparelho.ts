import { useSyncExternalStore } from 'react';
import { gravarTema, lerTema, type Tema } from './core/armazenamento';

// ---------- Instalação ----------

interface EventoDeInstalacao extends Event {
  prompt: () => Promise<unknown>;
}

let convite: EventoDeInstalacao | null = null;
const ouvintes = new Set<() => void>();
const notificar = () => ouvintes.forEach((o) => o());

/** Guarda o convite de instalação do navegador (Chrome/Edge) para o botão "Instalar agora". */
export function observarInstalacao(): void {
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    convite = evento as EventoDeInstalacao;
    notificar();
  });
  window.addEventListener('appinstalled', () => {
    convite = null;
    notificar();
  });
}

function assinar(aoMudar: () => void): () => void {
  ouvintes.add(aoMudar);
  return () => ouvintes.delete(aoMudar);
}

export function usePodeInstalar(): boolean {
  return useSyncExternalStore(assinar, () => convite !== null);
}

export async function instalarAgora(): Promise<void> {
  const atual = convite;
  if (!atual) return;
  convite = null;
  notificar();
  await atual.prompt();
}

/** `true` quando o app foi aberto pelo ícone da tela inicial. */
export function abertoComoApp(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type Plataforma = 'android' | 'iphone' | 'computador';

/** Só para escolher qual instrução mostrar primeiro. */
export function detectarPlataforma(agente: string = navigator.userAgent): Plataforma {
  if (/android/i.test(agente)) return 'android';
  if (/iphone|ipad|ipod/i.test(agente)) return 'iphone';
  // iPad recente se apresenta como Mac, mas tem tela de toque.
  if (/macintosh/i.test(agente) && navigator.maxTouchPoints > 1) return 'iphone';
  return 'computador';
}

// ---------- Tema ----------

export function temaAtual(): Tema {
  const escolhido = document.documentElement.getAttribute('data-tema');
  if (escolhido === 'claro' || escolhido === 'escuro') return escolhido;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.setAttribute('data-tema', tema);
  gravarTema(tema);
  notificar();
}

function assinarTema(aoMudar: () => void): () => void {
  const consulta = window.matchMedia('(prefers-color-scheme: dark)');
  consulta.addEventListener('change', aoMudar);
  ouvintes.add(aoMudar);
  return () => {
    consulta.removeEventListener('change', aoMudar);
    ouvintes.delete(aoMudar);
  };
}

export function useTema(): Tema {
  return useSyncExternalStore(assinarTema, temaAtual);
}

/** Se a pessoa nunca escolheu, seguimos o aparelho. */
export function temaFoiEscolhido(): boolean {
  return lerTema() !== null;
}
