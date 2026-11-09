import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Campo, CampoLongo } from '../componentes/Campo';
import {
  lerLista,
  lerMinhaLista,
  salvarMinhaLista,
  type LeituraDaLista,
} from '../core/clienteListas';
import { validarItem, validarLista, type AcessoDeLeitura, type ErroLista } from '../core/desejos';
import { formatarDataHora } from '../core/formato';
import { LIMITES } from '../core/tipos';
import { t } from '../textos';

/** Busca uma lista e permite buscar de novo. `null` enquanto carrega. */
function useLista(buscar: () => Promise<LeituraDaLista>) {
  const [pedido, setPedido] = useState(0);
  const [resposta, setResposta] = useState<{ pedido: number; leitura: LeituraDaLista } | null>(
    null,
  );

  useEffect(() => {
    let ativo = true;
    void buscar().then((leitura) => {
      // Ignora respostas de pedidos antigos.
      if (ativo) setResposta({ pedido, leitura });
    });
    return () => {
      ativo = false;
    };
  }, [buscar, pedido]);

  return {
    leitura: resposta?.pedido === pedido ? resposta.leitura : null,
    recarregar: () => setPedido((n) => n + 1),
  };
}

/** A lista de quem a pessoa tirou: só leitura, e só existe na tela depois de revelar. */
export function ListaDoSorteado({ nome, acesso }: { nome: string; acesso: AcessoDeLeitura }) {
  const buscar = useCallback(() => lerLista(acesso), [acesso]);
  const { leitura, recarregar } = useLista(buscar);
  const id = useId();

  return (
    <section className="lista-dela" aria-labelledby={id}>
      <h2 id={id}>{t.desejos.delaTitulo(nome)}</h2>
      <div role="status">
        {leitura === null && <p className="vazio">{t.desejos.carregando}</p>}
        {leitura?.tipo === 'vazia' && <p className="vazio">{t.desejos.delaVazia(nome)}</p>}
        {leitura?.tipo === 'erro' && (
          <p className="aviso aviso-atencao">{t.desejos.erroCarregar}</p>
        )}
      </div>
      {leitura?.tipo === 'ok' && (
        <>
          <ul className="desejos">
            {leitura.lista.itens.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          {leitura.lista.obs && (
            <p className="recado">
              <strong>{t.desejos.obsDela}:</strong> {leitura.lista.obs}
            </p>
          )}
          <p className="campo-dica">{t.desejos.alteradaEm(formatarDataHora(leitura.lista.em))}</p>
        </>
      )}
      {leitura !== null && (
        <button type="button" className="botao botao-pequeno" onClick={recarregar}>
          {leitura.tipo === 'erro' ? t.desejos.tentar : t.desejos.atualizar}
        </button>
      )}
    </section>
  );
}

type Situacao = 'parado' | 'salvando' | 'salva' | 'erro' | 'limite';

/** A lista da própria pessoa: disponível mesmo antes de revelar. */
export function MinhaLista({ semente }: { semente: string }) {
  const buscar = useCallback(() => lerMinhaLista(semente), [semente]);
  const { leitura, recarregar } = useLista(buscar);
  const id = useId();

  return (
    <section className="cartao" aria-labelledby={id}>
      <h2 id={id}>{t.desejos.minhaTitulo}</h2>
      <p className="campo-dica">{t.desejos.minhaIntro}</p>
      {leitura === null && (
        <p className="vazio" role="status">
          {t.desejos.carregando}
        </p>
      )}
      {leitura?.tipo === 'erro' && (
        <>
          <p className="aviso aviso-atencao" role="status">
            {t.desejos.erroCarregar}
          </p>
          <button type="button" className="botao" onClick={recarregar}>
            {t.desejos.tentar}
          </button>
        </>
      )}
      {leitura && leitura.tipo !== 'erro' && (
        <Editor
          semente={semente}
          itensIniciais={leitura.tipo === 'ok' ? leitura.lista.itens : []}
          obsInicial={leitura.tipo === 'ok' ? leitura.lista.obs : ''}
          alteradaEm={leitura.tipo === 'ok' ? leitura.lista.em : null}
        />
      )}
    </section>
  );
}

function Editor({
  semente,
  itensIniciais,
  obsInicial,
  alteradaEm,
}: {
  semente: string;
  itensIniciais: string[];
  obsInicial: string;
  alteradaEm: string | null;
}) {
  const [itens, setItens] = useState(itensIniciais);
  const [obs, setObs] = useState(obsInicial);
  const [novo, setNovo] = useState('');
  const [erro, setErro] = useState<ErroLista | null>(null);
  const [mudou, setMudou] = useState(false);
  const [situacao, setSituacao] = useState<Situacao>('parado');
  const [salvaEm, setSalvaEm] = useState(alteradaEm);
  const formulario = useRef<HTMLFormElement>(null);

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    const problema = validarItem(itens, novo);
    setErro(problema);
    if (!problema) {
      setItens([...itens, novo.trim()]);
      setNovo('');
      setMudou(true);
      setSituacao('parado');
    }
    formulario.current?.querySelector('input')?.focus();
  };

  const salvar = async () => {
    const problema = validarLista(itens, obs);
    if (problema) return setErro(problema);
    setSituacao('salvando');
    const em = new Date().toISOString();
    const resultado = await salvarMinhaLista(semente, { itens, obs: obs.trim(), em });
    if (resultado === 'ok') {
      setMudou(false);
      setSalvaEm(em);
      setSituacao('salva');
    } else {
      // O que a pessoa escreveu continua na tela para tentar de novo.
      setSituacao(resultado);
    }
  };

  return (
    <>
      <form onSubmit={adicionar} noValidate ref={formulario} className="linha-de-adicionar">
        <Campo
          rotulo={t.desejos.item}
          value={novo}
          maxLength={LIMITES.itemLista}
          onChange={(e) => {
            setNovo(e.target.value);
            setErro(null);
          }}
          erro={erro && erro !== 'obsLonga' ? t.desejos.erros[erro] : undefined}
          autoComplete="off"
          enterKeyHint="done"
        />
        <button type="submit" className="botao">
          {t.desejos.adicionar}
        </button>
      </form>

      <h3>{t.desejos.itens}</h3>
      {itens.length === 0 ? (
        <p className="vazio">{t.desejos.semItens}</p>
      ) : (
        <ul className="lista">
          {itens.map((item, i) => (
            <li key={`${i}-${item}`} className="item">
              <span className="item-nome">{item}</span>
              <span className="item-acoes">
                <button
                  type="button"
                  className="botao botao-pequeno"
                  aria-label={t.desejos.removerItem(item)}
                  onClick={() => {
                    setItens(itens.filter((_, j) => j !== i));
                    setMudou(true);
                    setErro(null);
                    setSituacao('parado');
                  }}
                >
                  {t.desejos.remover}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <CampoLongo
        rotulo={t.desejos.obs}
        dica={t.desejos.obsDica}
        value={obs}
        maxLength={LIMITES.observacaoLista}
        onChange={(e) => {
          setObs(e.target.value);
          setMudou(true);
          setSituacao('parado');
        }}
        erro={erro === 'obsLonga' ? t.desejos.erros.obsLonga : undefined}
        contador={{ atual: obs.length, maximo: LIMITES.observacaoLista }}
      />

      <div role="status">
        {situacao === 'salva' && <p className="aviso aviso-sucesso">{t.desejos.salva}</p>}
        {situacao === 'erro' && <p className="aviso aviso-atencao">{t.desejos.erroSalvar}</p>}
        {situacao === 'limite' && <p className="aviso aviso-atencao">{t.desejos.erroLimite}</p>}
        {situacao === 'parado' && mudou && <p className="aviso">{t.desejos.naoSalva}</p>}
      </div>
      {salvaEm && <p className="campo-dica">{t.desejos.alteradaEm(formatarDataHora(salvaEm))}</p>}

      <div className="acoes">
        <button
          type="button"
          className="botao botao-principal"
          disabled={situacao === 'salvando'}
          onClick={() => void salvar()}
        >
          {situacao === 'salvando'
            ? t.desejos.salvando
            : situacao === 'erro'
              ? t.desejos.tentar
              : t.desejos.salvar}
        </button>
      </div>
    </>
  );
}
