import { useEffect, useId, useRef } from 'react';
import { t } from '../textos';

interface Props {
  aberto: boolean;
  titulo: string;
  texto: string;
  confirmar: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

/**
 * Pergunta de confirmação. Usa o <dialog> do navegador: o foco fica preso
 * dentro dele, Esc cancela e o foco volta para o botão que o abriu.
 */
export function Dialogo({ aberto, titulo, texto, confirmar, aoConfirmar, aoCancelar }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-texto`}
      onCancel={(evento) => {
        evento.preventDefault();
        aoCancelar();
      }}
    >
      <h2 id={`${id}-titulo`}>{titulo}</h2>
      <p id={`${id}-texto`}>{texto}</p>
      <div className="acoes">
        <button type="button" className="botao" onClick={aoCancelar}>
          {t.app.cancelar}
        </button>
        <button type="button" className="botao botao-principal" onClick={aoConfirmar}>
          {confirmar}
        </button>
      </div>
    </dialog>
  );
}
