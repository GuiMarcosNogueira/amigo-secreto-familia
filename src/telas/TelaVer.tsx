import { useEffect, useState } from 'react';
import { formatarData, formatarValor } from '../core/formato';
import { lerPayload, type ConteudoDoLink, type LeituraDoLink } from '../core/link';
import { CAMINHOS } from '../core/rotas';
import { t } from '../textos';
import { ListaDoSorteado, MinhaLista } from './ListasDeDesejos';

export function TelaVer({ payload }: { payload: string }) {
  // Guardamos o resultado junto com o payload a que ele pertence: se o link mudar,
  // a tela volta a "carregando" sem mostrar nada do link anterior.
  const [leitura, setLeitura] = useState<{ payload: string; resultado: LeituraDoLink } | null>(
    null,
  );

  useEffect(() => {
    let ativo = true;
    void lerPayload(payload).then((resultado) => {
      if (ativo) setLeitura({ payload, resultado });
    });
    return () => {
      ativo = false;
    };
  }, [payload]);

  if (!leitura || leitura.payload !== payload) {
    return (
      <p className="intro" role="status">
        {t.ver.carregando}
      </p>
    );
  }

  if (!leitura.resultado.ok) {
    return (
      <>
        <h1 tabIndex={-1}>{t.ver.invalidoTitulo}</h1>
        <p className="intro">{t.ver.invalidoTexto}</p>
        <div className="acoes">
          <a className="botao" href={CAMINHOS.evento}>
            {t.ver.organizar}
          </a>
        </div>
      </>
    );
  }

  return <Revelacao key={payload} conteudo={leitura.resultado.conteudo} />;
}

function Revelacao({ conteudo }: { conteudo: ConteudoDoLink }) {
  const [revelado, setRevelado] = useState(false);
  const { ev } = conteudo;

  return (
    <>
      <h1 tabIndex={-1}>{t.ver.ola(conteudo.de)}</h1>
      <p className="intro">{t.ver.evento(ev.n)}</p>

      <section className="cartao cartao-revelacao" aria-live="polite">
        {revelado ? (
          <>
            <p className="rotulo">{t.ver.voceTirou}</p>
            <p className="sorteado">{conteudo.para}</p>
            <dl className="detalhes">
              <div>
                <dt>{t.ver.data}</dt>
                <dd>{formatarData(ev.d)}</dd>
              </div>
              {ev.val !== undefined && (
                <div>
                  <dt>{t.ver.valor}</dt>
                  <dd>{formatarValor(ev.val)}</dd>
                </div>
              )}
              {ev.msg !== undefined && (
                <div>
                  <dt>{t.ver.recado}</dt>
                  <dd className="recado">{ev.msg}</dd>
                </div>
              )}
            </dl>
            <ListaDoSorteado nome={conteudo.para} acesso={conteudo.al} />
            <div className="acoes">
              <button type="button" className="botao" onClick={() => setRevelado(false)}>
                {t.ver.ocultar}
              </button>
            </div>
          </>
        ) : (
          <>
            <p>{t.ver.sozinho}</p>
            <div className="acoes">
              <button
                type="button"
                className="botao botao-principal botao-grande"
                onClick={() => setRevelado(true)}
              >
                {t.ver.revelar}
              </button>
            </div>
          </>
        )}
      </section>

      <MinhaLista semente={conteudo.s} />

      <p className="codigo-rodape">{t.ver.codigo(conteudo.c)}</p>
    </>
  );
}
