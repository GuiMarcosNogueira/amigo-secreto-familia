import { useState } from 'react';
import { Dialogo } from '../componentes/Dialogo';
import { mensagemDoLink, urlDoWhatsApp } from '../core/formato';
import { CAMINHOS } from '../core/rotas';
import type { LinkGerado } from '../core/tipos';
import { useEstado } from '../estado';
import { ir } from '../navegacao';
import { t } from '../textos';

const podeCompartilhar = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export function TelaLinks() {
  const { links, definirLinks, rascunho, avisar } = useEstado();
  const [souEu, setSouEu] = useState<LinkGerado | null>(null);
  const [copiaManual, setCopiaManual] = useState<string | null>(null);

  if (!links) {
    return (
      <>
        <h1 tabIndex={-1}>{t.links.vazio}</h1>
        <div className="acoes">
          <a className="botao botao-principal" href={CAMINHOS.evento}>
            {t.links.comecar}
          </a>
        </div>
      </>
    );
  }

  const nomeDoEvento = rascunho.evento.nome.trim() || t.app.nome;
  const enviados = links.links.filter((l) => l.enviado).length;

  const marcar = (participante: string, enviado: boolean) =>
    definirLinks({
      ...links,
      links: links.links.map((l) => (l.participante === participante ? { ...l, enviado } : l)),
    });

  const copiar = async (link: LinkGerado) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiaManual(null);
      avisar(t.links.copiado);
      marcar(link.participante, true);
    } catch {
      // Alguns navegadores bloqueiam a cópia automática: mostramos o link para copiar à mão.
      setCopiaManual(link.participante);
    }
  };

  const compartilhar = async (link: LinkGerado) => {
    try {
      await navigator.share({ text: mensagemDoLink(link.participante, nomeDoEvento, link.url) });
      marcar(link.participante, true);
    } catch {
      // A pessoa fechou o menu de compartilhar: nada a fazer.
    }
  };

  return (
    <>
      <h1 tabIndex={-1}>{t.links.titulo}</h1>
      <p className="intro">{t.links.intro}</p>

      <section className="cartao" aria-label={t.links.codigo}>
        <p>
          {t.links.codigo}: <strong className="codigo">{links.codigo}</strong>
        </p>
        <p className="campo-dica">{t.links.codigoDica}</p>
      </section>

      <p className="aviso" role="status">
        {t.links.progresso(enviados, links.links.length)}
      </p>

      <ul className="lista lista-links">
        {links.links.map((link) => (
          <li key={link.participante} className={link.enviado ? 'cartao enviado' : 'cartao'}>
            <h2>{link.participante}</h2>
            <div
              className="acoes acoes-empilhadas"
              role="group"
              aria-label={t.links.acoesDe(link.participante)}
            >
              <a
                className="botao botao-whatsapp"
                href={urlDoWhatsApp(mensagemDoLink(link.participante, nomeDoEvento, link.url))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => marcar(link.participante, true)}
              >
                {t.links.whatsapp}
              </a>
              <button type="button" className="botao" onClick={() => void copiar(link)}>
                {t.links.copiar}
              </button>
              {podeCompartilhar && (
                <button type="button" className="botao" onClick={() => void compartilhar(link)}>
                  {t.links.compartilhar}
                </button>
              )}
              <button type="button" className="botao" onClick={() => setSouEu(link)}>
                {t.links.souEu}
              </button>
            </div>
            {copiaManual === link.participante && (
              <div className="campo">
                <label htmlFor={`copia-${link.participante}`}>{t.links.copiaManual}</label>
                <input
                  id={`copia-${link.participante}`}
                  readOnly
                  value={link.url}
                  onFocus={(e) => e.target.select()}
                  // O campo aparece porque a cópia falhou: já chega selecionado.
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
            )}
            <label className="marcador">
              <input
                type="checkbox"
                checked={link.enviado}
                onChange={(e) => marcar(link.participante, e.target.checked)}
              />
              <span>{t.links.enviado}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="acoes">
        <a className="botao" href={CAMINHOS.evento}>
          {t.links.voltarEvento}
        </a>
        <a className="botao" href={CAMINHOS.sortear}>
          {t.links.deNovo}
        </a>
      </div>

      <Dialogo
        aberto={souEu !== null}
        titulo={souEu ? t.links.souEuTitulo(souEu.participante) : ''}
        texto={t.links.souEuTexto}
        confirmar={t.links.souEuSim}
        aoCancelar={() => setSouEu(null)}
        aoConfirmar={() => {
          const url = souEu?.url ?? '';
          setSouEu(null);
          const marca = url.indexOf('#');
          if (marca !== -1) ir(url.slice(marca));
        }}
      />
    </>
  );
}
