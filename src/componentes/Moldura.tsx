import { useEffect, useRef, useState, type ReactNode } from 'react';
import { abertoComoApp, aplicarTema, useTema } from '../aparelho';
import { CAMINHOS } from '../core/rotas';
import { useEstado } from '../estado';
import { ir } from '../navegacao';
import { t } from '../textos';
import { Dialogo } from './Dialogo';

/** Cabeçalho, área de avisos e rodapé comuns a todas as telas. */
export function Moldura({ organizador, children }: { organizador: boolean; children: ReactNode }) {
  const { aviso, guardaDados, recomecar } = useEstado();
  const tema = useTema();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <header className="topo">
        <a className="marca" href={CAMINHOS.evento} title={t.app.inicio}>
          <span aria-hidden="true">🎁</span> {t.app.nome}
        </a>
        <button
          type="button"
          className="botao botao-icone"
          onClick={() => aplicarTema(tema === 'escuro' ? 'claro' : 'escuro')}
          aria-label={tema === 'escuro' ? t.app.temaClaro : t.app.temaEscuro}
          title={tema === 'escuro' ? t.app.temaClaro : t.app.temaEscuro}
        >
          <span aria-hidden="true">{tema === 'escuro' ? '☀️' : '🌙'}</span>
        </button>
      </header>

      <main className="conteudo">
        {organizador && !guardaDados && (
          <p className="aviso aviso-atencao">{t.app.semArmazenamento}</p>
        )}
        {children}
      </main>

      <footer className="rodape">
        {!abertoComoApp() && <a href={CAMINHOS.instalar}>{t.app.instalar}</a>}
        {organizador && (
          <button type="button" className="botao-texto" onClick={() => setConfirmando(true)}>
            {t.app.recomecar}
          </button>
        )}
      </footer>

      <Torrada aviso={aviso} />

      <Dialogo
        aberto={confirmando}
        titulo={t.app.recomecarTitulo}
        texto={t.app.recomecarTexto}
        confirmar={t.app.recomecarSim}
        aoCancelar={() => setConfirmando(false)}
        aoConfirmar={() => {
          setConfirmando(false);
          recomecar();
          ir(CAMINHOS.evento);
        }}
      />
    </>
  );
}

/** Aviso curto no pé da tela, anunciado por leitores de tela. */
function Torrada({ aviso }: { aviso: { texto: string; n: number } | null }) {
  // Guarda o número do último aviso que já sumiu.
  const [escondido, setEscondido] = useState(0);
  const relogio = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!aviso) return;
    const n = aviso.n;
    relogio.current = window.setTimeout(() => setEscondido(n), 5000);
    return () => window.clearTimeout(relogio.current);
  }, [aviso]);

  return (
    <div className="torrada" role="status" aria-live="polite" aria-atomic="true">
      {aviso && escondido !== aviso.n && <p>{aviso.texto}</p>}
    </div>
  );
}

export function Passos({ atual }: { atual: 1 | 2 | 3 | 4 }) {
  const caminhos = [CAMINHOS.evento, CAMINHOS.participantes, CAMINHOS.restricoes, CAMINHOS.sortear];
  return (
    <nav aria-label={t.app.passoAtual(atual, t.app.passos[atual - 1]!)}>
      <ol className="passos">
        {t.app.passos.map((nome, i) => (
          <li
            key={nome}
            className={i + 1 === atual ? 'atual' : i + 1 < atual ? 'feito' : undefined}
          >
            <a href={caminhos[i]} aria-current={i + 1 === atual ? 'step' : undefined}>
              <span className="passo-numero" aria-hidden="true">
                {i + 1}
              </span>
              <span className="passo-nome">{nome}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
