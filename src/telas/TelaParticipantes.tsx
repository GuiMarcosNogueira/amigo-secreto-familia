import { useRef, useState, type FormEvent } from 'react';
import { Campo } from '../componentes/Campo';
import { Dialogo } from '../componentes/Dialogo';
import { Passos } from '../componentes/Moldura';
import { novoId } from '../core/aleatorio';
import { CAMINHOS } from '../core/rotas';
import { LIMITES, type Participante } from '../core/tipos';
import {
  adicionarParticipante,
  editarParticipante,
  faltamParaSortear,
  removerParticipante,
  type ErroParticipante,
} from '../core/validacao';
import { useEstado } from '../estado';
import { ir } from '../navegacao';
import { t } from '../textos';

export function TelaParticipantes() {
  const { rascunho, atualizar, avisar } = useEstado();
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<ErroParticipante | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<Participante | null>(null);
  const [avisoFalta, setAvisoFalta] = useState(false);
  const campoNome = useRef<HTMLFormElement>(null);
  const faltam = faltamParaSortear(rascunho);

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    const resultado = adicionarParticipante(rascunho, nome, novoId);
    if (!resultado.ok) {
      setErro(resultado.erro);
    } else {
      atualizar(resultado.rascunho);
      avisar(t.pessoas.adicionada(nome.trim()));
      setNome('');
      setErro(null);
      setAvisoFalta(false);
    }
    campoNome.current?.querySelector('input')?.focus();
  };

  return (
    <>
      <Passos atual={2} />
      <h1 tabIndex={-1}>{t.pessoas.titulo}</h1>
      <p className="intro">{t.pessoas.intro}</p>

      <form onSubmit={adicionar} noValidate ref={campoNome} className="linha-de-adicionar">
        <Campo
          rotulo={t.pessoas.nome}
          value={nome}
          maxLength={LIMITES.nomeParticipante}
          onChange={(e) => {
            setNome(e.target.value);
            setErro(null);
          }}
          erro={erro ? t.pessoas.erros[erro] : undefined}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
        />
        <button type="submit" className="botao">
          {t.pessoas.adicionar}
        </button>
      </form>

      <section aria-labelledby="titulo-lista">
        <h2 id="titulo-lista">
          {t.pessoas.lista}{' '}
          <span className="contagem">({t.pessoas.contagem(rascunho.participantes.length)})</span>
        </h2>
        {rascunho.participantes.length === 0 ? (
          <p className="vazio">{t.pessoas.vazia}</p>
        ) : (
          <ul className="lista">
            {rascunho.participantes.map((p) =>
              editando === p.id ? (
                <EdicaoDeNome key={p.id} pessoa={p} aoFechar={() => setEditando(null)} />
              ) : (
                <li key={p.id} className="item">
                  <span className="item-nome">{p.nome}</span>
                  <span className="item-acoes">
                    <button
                      type="button"
                      className="botao botao-pequeno"
                      aria-label={t.pessoas.editarNome(p.nome)}
                      onClick={() => setEditando(p.id)}
                    >
                      {t.pessoas.editar}
                    </button>
                    <button
                      type="button"
                      className="botao botao-pequeno"
                      aria-label={t.pessoas.removerNome(p.nome)}
                      onClick={() => setRemovendo(p)}
                    >
                      {t.pessoas.remover}
                    </button>
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <p className={avisoFalta ? 'aviso aviso-atencao' : 'aviso'} role="status">
        {faltam > 0 && t.pessoas.faltam(faltam)}
      </p>

      <div className="acoes">
        <a className="botao" href={CAMINHOS.evento}>
          {t.app.voltar}
        </a>
        <button
          type="button"
          className="botao botao-principal"
          onClick={() => (faltam > 0 ? setAvisoFalta(true) : ir(CAMINHOS.restricoes))}
        >
          {t.pessoas.continuar}
        </button>
      </div>

      <Dialogo
        aberto={removendo !== null}
        titulo={removendo ? t.pessoas.removerTitulo(removendo.nome) : ''}
        texto={t.pessoas.removerTexto}
        confirmar={t.pessoas.removerSim}
        aoCancelar={() => setRemovendo(null)}
        aoConfirmar={() => {
          if (removendo) {
            atualizar(removerParticipante(rascunho, removendo.id));
            avisar(t.pessoas.removida(removendo.nome));
          }
          setRemovendo(null);
        }}
      />
    </>
  );
}

function EdicaoDeNome({ pessoa, aoFechar }: { pessoa: Participante; aoFechar: () => void }) {
  const { rascunho, atualizar } = useEstado();
  const [nome, setNome] = useState(pessoa.nome);
  const [erro, setErro] = useState<ErroParticipante | null>(null);

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const resultado = editarParticipante(rascunho, pessoa.id, nome);
    if (!resultado.ok) return setErro(resultado.erro);
    atualizar(resultado.rascunho);
    aoFechar();
  };

  return (
    <li className="item item-editando">
      <form onSubmit={salvar} noValidate>
        <Campo
          onKeyDown={(e) => {
            if (e.key === 'Escape') aoFechar();
          }}
          rotulo={t.pessoas.novoNome(pessoa.nome)}
          value={nome}
          maxLength={LIMITES.nomeParticipante}
          onChange={(e) => {
            setNome(e.target.value);
            setErro(null);
          }}
          erro={erro ? t.pessoas.erros[erro] : undefined}
          autoComplete="off"
          // A pessoa acabou de tocar em "Editar": o foco deve ir para o campo.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <div className="acoes">
          <button type="button" className="botao" onClick={aoFechar}>
            {t.app.cancelar}
          </button>
          <button type="submit" className="botao botao-principal">
            {t.pessoas.salvar}
          </button>
        </div>
      </form>
    </li>
  );
}
