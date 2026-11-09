import { useState } from 'react';
import { Dialogo } from '../componentes/Dialogo';
import { Passos } from '../componentes/Moldura';
import { formatarData, formatarValor, hojeISO } from '../core/formato';
import { gerarLinks } from '../core/link';
import { CAMINHOS } from '../core/rotas';
import { sortear, verificarViabilidade } from '../core/sorteio';
import {
  eventoValido,
  faltamParaSortear,
  interpretarValor,
  nomesDaRestricao,
  removerRestricao,
} from '../core/validacao';
import { useEstado } from '../estado';
import { enderecoDoApp, ir } from '../navegacao';
import { t } from '../textos';

export function TelaSortear() {
  const { rascunho, atualizar, links, definirLinks, avisar } = useEstado();
  const [confirmando, setConfirmando] = useState(false);
  const [sorteando, setSorteando] = useState(false);
  const [erro, setErro] = useState(false);

  const { evento, participantes, restricoes } = rascunho;
  const nomes = new Map(participantes.map((p) => [p.id, p.nome]));
  const nome = (id: string) => nomes.get(id) ?? '';
  const eventoOk = eventoValido(evento, hojeISO());
  const faltam = faltamParaSortear(rascunho);
  const ids = participantes.map((p) => p.id);
  const viabilidade = faltam === 0 ? verificarViabilidade(ids, restricoes) : null;
  const valor = interpretarValor(evento.valor);

  const fazerSorteio = async () => {
    setConfirmando(false);
    setSorteando(true);
    setErro(false);
    try {
      // O resultado só existe dentro desta chamada: vira links e é descartado.
      const novos = await gerarLinks(
        evento,
        participantes,
        sortear(ids, restricoes),
        enderecoDoApp(),
      );
      definirLinks(novos);
      ir(CAMINHOS.links);
    } catch {
      setErro(true);
    } finally {
      setSorteando(false);
    }
  };

  return (
    <>
      <Passos atual={4} />
      <h1 tabIndex={-1}>{t.sorteio.titulo}</h1>

      <section className="cartao" aria-label={evento.nome || t.app.passos[0]}>
        {eventoOk ? (
          <>
            <p className="destaque">{evento.nome}</p>
            <p>{formatarData(evento.data)}</p>
            {typeof valor === 'number' && (
              <p>
                {t.ver.valor}: {formatarValor(valor)}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="aviso aviso-atencao">{t.sorteio.faltaEvento}</p>
            <a className="botao" href={CAMINHOS.evento}>
              {t.sorteio.arrumarEvento}
            </a>
          </>
        )}
        <p>{t.sorteio.resumoPessoas(participantes.length)}</p>
        <p>{t.sorteio.resumoRegras(restricoes.length)}</p>
      </section>

      {faltam > 0 && (
        <section className="cartao">
          <p className="aviso aviso-atencao">{t.pessoas.faltam(faltam)}</p>
          <a className="botao" href={CAMINHOS.participantes}>
            {t.sorteio.arrumarPessoas}
          </a>
        </section>
      )}

      {viabilidade && !viabilidade.possivel && (
        <section className="cartao cartao-alerta" role="alert">
          <h2>{t.sorteio.impossivelTitulo}</h2>
          <p>
            {viabilidade.opcoes.length === 0
              ? t.sorteio.semOpcao(nome(viabilidade.bloqueados[0]!))
              : t.sorteio.poucasOpcoes(
                  viabilidade.bloqueados.map(nome),
                  viabilidade.opcoes.map(nome),
                )}
          </p>
          <p>{t.sorteio.comoCorrigir}</p>
          <ul className="lista">
            {viabilidade.restricoesEnvolvidas.map(([x, y]) => (
              <li key={`${x}|${y}`} className="item">
                <span className="item-nome">
                  {t.regras.regra(...nomesDaRestricao(rascunho, [x, y]))}
                </span>
                <span className="item-acoes">
                  <button
                    type="button"
                    className="botao botao-pequeno"
                    aria-label={t.regras.removerRegra(...nomesDaRestricao(rascunho, [x, y]))}
                    onClick={() => {
                      atualizar(removerRestricao(rascunho, x, y));
                      avisar(t.regras.removida);
                    }}
                  >
                    {t.sorteio.removerRegra}
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <a className="botao" href={CAMINHOS.participantes}>
            {t.sorteio.arrumarPessoas}
          </a>
        </section>
      )}

      {eventoOk && viabilidade?.possivel && <p className="intro">{t.sorteio.segredo}</p>}
      <p className="campo-erro" role="alert">
        {erro && t.sorteio.erro}
      </p>

      <div className="acoes">
        <a className="botao" href={CAMINHOS.restricoes}>
          {t.app.voltar}
        </a>
        {eventoOk && viabilidade?.possivel && (
          <button
            type="button"
            className="botao botao-principal botao-grande"
            disabled={sorteando}
            onClick={() => (links ? setConfirmando(true) : void fazerSorteio())}
          >
            {sorteando ? t.sorteio.sorteando : t.sorteio.sortear}
          </button>
        )}
      </div>

      <Dialogo
        aberto={confirmando}
        titulo={t.sorteio.deNovoTitulo}
        texto={t.sorteio.deNovoTexto}
        confirmar={t.sorteio.deNovoSim}
        aoCancelar={() => setConfirmando(false)}
        aoConfirmar={() => void fazerSorteio()}
      />
    </>
  );
}
