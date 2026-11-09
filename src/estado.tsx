import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  apagarTudo,
  armazenamentoDisponivel,
  gravarLinks,
  gravarRascunho,
  lerLinks,
  lerRascunho,
} from './core/armazenamento';
import { rascunhoVazio, type LinksSalvos, type Rascunho } from './core/tipos';

interface Estado {
  rascunho: Rascunho;
  /** Troca o rascunho e já guarda no aparelho. */
  atualizar: (novo: Rascunho) => void;
  links: LinksSalvos | null;
  definirLinks: (novos: LinksSalvos) => void;
  recomecar: () => void;
  /** `false` quando o navegador não deixa guardar dados. */
  guardaDados: boolean;
  /** Mostra um aviso curto, lido também por leitores de tela. */
  avisar: (texto: string) => void;
  aviso: { texto: string; n: number } | null;
}

const Contexto = createContext<Estado | null>(null);

export function ProvedorDeEstado({ children }: { children: ReactNode }) {
  const [rascunho, setRascunho] = useState<Rascunho>(() => lerRascunho());
  const [links, setLinks] = useState<LinksSalvos | null>(() => lerLinks());
  const [guardaDados] = useState(() => armazenamentoDisponivel());
  const [aviso, setAviso] = useState<Estado['aviso']>(null);
  const contador = useRef(0);

  const atualizar = useCallback((novo: Rascunho) => {
    setRascunho(novo);
    gravarRascunho(novo);
  }, []);

  const definirLinks = useCallback((novos: LinksSalvos) => {
    setLinks(novos);
    gravarLinks(novos);
  }, []);

  const recomecar = useCallback(() => {
    apagarTudo();
    setRascunho(rascunhoVazio());
    setLinks(null);
  }, []);

  const avisar = useCallback((texto: string) => {
    contador.current += 1;
    setAviso({ texto, n: contador.current });
  }, []);

  const valor = useMemo(
    () => ({ rascunho, atualizar, links, definirLinks, recomecar, guardaDados, avisar, aviso }),
    [rascunho, atualizar, links, definirLinks, recomecar, guardaDados, avisar, aviso],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useEstado(): Estado {
  const estado = useContext(Contexto);
  if (!estado) throw new Error('useEstado fora do ProvedorDeEstado');
  return estado;
}
