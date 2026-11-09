import { useId, useState, type FormEvent } from 'react';
import { Passos } from '../componentes/Moldura';
import { CAMINHOS } from '../core/rotas';
import {
  adicionarRestricao,
  nomesDaRestricao,
  removerRestricao,
  type ErroRestricao,
} from '../core/validacao';
import { useEstado } from '../estado';
import { t } from '../textos';

export function TelaRestricoes() {
  const { rascunho, atualizar, avisar } = useEstado();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [erro, setErro] = useState<ErroRestricao | 'incompleta' | null>(null);
  const id = useId();
  const nomes = new Map(rascunho.participantes.map((p) => [p.id, p.nome]));

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!a || !b) return setErro('incompleta');
    const resultado = adicionarRestricao(rascunho, a, b);
    if (!resultado.ok) return setErro(resultado.erro);
    atualizar(resultado.rascunho);
    avisar(t.regras.adicionada(nomes.get(a)!, nomes.get(b)!));
    setA('');
    setB('');
    setErro(null);
  };

  const opcoes = (
    <>
      <option value="">{t.regras.escolha}</option>
      {rascunho.participantes.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nome}
        </option>
      ))}
    </>
  );

  return (
    <>
      <Passos atual={3} />
      <h1 tabIndex={-1}>{t.regras.titulo}</h1>
      <p className="intro">{t.regras.intro}</p>

      <form onSubmit={adicionar} noValidate>
        <div className="campo">
          <label htmlFor={`${id}-a`}>{t.regras.primeira}</label>
          <select
            id={`${id}-a`}
            value={a}
            aria-describedby={erro ? `${id}-erro` : undefined}
            onChange={(e) => {
              setA(e.target.value);
              setErro(null);
            }}
          >
            {opcoes}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-b`}>{t.regras.segunda}</label>
          <select
            id={`${id}-b`}
            value={b}
            aria-describedby={erro ? `${id}-erro` : undefined}
            onChange={(e) => {
              setB(e.target.value);
              setErro(null);
            }}
          >
            {opcoes}
          </select>
          <p className="campo-erro" id={`${id}-erro`} role="alert">
            {erro && t.regras.erros[erro]}
          </p>
        </div>
        <div className="acoes">
          <button type="submit" className="botao">
            {t.regras.adicionar}
          </button>
        </div>
      </form>

      <section aria-labelledby={`${id}-lista`}>
        <h2 id={`${id}-lista`}>{t.regras.lista}</h2>
        {rascunho.restricoes.length === 0 ? (
          <p className="vazio">{t.regras.vazia}</p>
        ) : (
          <ul className="lista">
            {rascunho.restricoes.map(([x, y]) => (
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
                    {t.regras.remover}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="acoes">
        <a className="botao" href={CAMINHOS.participantes}>
          {t.app.voltar}
        </a>
        <a className="botao botao-principal" href={CAMINHOS.sortear}>
          {t.regras.continuar}
        </a>
      </div>
    </>
  );
}
