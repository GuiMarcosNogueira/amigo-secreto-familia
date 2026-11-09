import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

interface Base {
  rotulo: string;
  dica?: string;
  erro?: string | undefined;
  /** Mostra "12 de 280" abaixo do campo. */
  contador?: { atual: number; maximo: number };
}

function Moldura({
  id,
  rotulo,
  dica,
  erro,
  contador,
  children,
}: Base & { id: string; children: ReactNode }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      {dica && (
        <p className="campo-dica" id={`${id}-dica`}>
          {dica}
        </p>
      )}
      {children}
      {contador && (
        <p className="campo-contador" aria-hidden="true">
          {contador.atual} de {contador.maximo}
        </p>
      )}
      {/* Sempre presente, para o leitor de tela anunciar quando o erro aparece. */}
      <p className="campo-erro" id={`${id}-erro`} role="alert">
        {erro}
      </p>
    </div>
  );
}

function descricao(id: string, dica?: string, erro?: string): string | undefined {
  return [dica && `${id}-dica`, erro && `${id}-erro`].filter(Boolean).join(' ') || undefined;
}

export function Campo({
  rotulo,
  dica,
  erro,
  contador,
  ...resto
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} erro={erro} contador={contador}>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao(id, dica, erro)}
        {...resto}
      />
    </Moldura>
  );
}

export function CampoLongo({
  rotulo,
  dica,
  erro,
  contador,
  ...resto
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} erro={erro} contador={contador}>
      <textarea
        id={id}
        rows={3}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao(id, dica, erro)}
        {...resto}
      />
    </Moldura>
  );
}
