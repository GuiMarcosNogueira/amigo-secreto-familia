import { useState, type FormEvent } from 'react';
import { Campo, CampoLongo } from '../componentes/Campo';
import { Passos } from '../componentes/Moldura';
import { hojeISO } from '../core/formato';
import { CAMINHOS } from '../core/rotas';
import { LIMITES, type Evento } from '../core/tipos';
import { validarEvento, type ErrosEvento } from '../core/validacao';
import { useEstado } from '../estado';
import { ir } from '../navegacao';
import { t } from '../textos';

export function TelaEvento() {
  const { rascunho, atualizar, links } = useEstado();
  const [tentou, setTentou] = useState(false);
  const evento = rascunho.evento;
  const hoje = hojeISO();
  const erros: ErrosEvento = tentou ? validarEvento(evento, hoje) : {};

  const mudar = (campo: keyof Evento, valor: string) =>
    atualizar({ ...rascunho, evento: { ...evento, [campo]: valor } });

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTentou(true);
    const encontrados = validarEvento(evento, hoje);
    const primeiro = (['nome', 'data', 'valor', 'mensagem'] as const).find((c) => encontrados[c]);
    if (primeiro) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${primeiro}"]`)?.focus();
      return;
    }
    ir(CAMINHOS.participantes);
  };

  return (
    <>
      {links && (
        <section className="cartao cartao-destaque" aria-label={t.evento.verLinks}>
          <p>{t.evento.verLinksTexto(links.codigo)}</p>
          <a className="botao" href={CAMINHOS.links}>
            {t.evento.verLinks}
          </a>
        </section>
      )}

      <Passos atual={1} />
      <h1 tabIndex={-1}>{t.evento.titulo}</h1>
      <p className="intro">{t.evento.intro}</p>

      <form onSubmit={enviar} noValidate>
        <Campo
          name="nome"
          rotulo={t.evento.nome}
          dica={t.evento.nomeDica}
          value={evento.nome}
          maxLength={LIMITES.nomeEvento}
          onChange={(e) => mudar('nome', e.target.value)}
          erro={erros.nome && t.evento.erros[erros.nome]}
          autoComplete="off"
          enterKeyHint="next"
        />
        <Campo
          name="data"
          type="date"
          rotulo={t.evento.data}
          value={evento.data}
          min={hoje}
          onChange={(e) => mudar('data', e.target.value)}
          erro={erros.data && t.evento.erros[erros.data]}
        />
        <Campo
          name="valor"
          rotulo={t.evento.valor}
          dica={t.evento.valorDica}
          value={evento.valor}
          inputMode="decimal"
          maxLength={12}
          onChange={(e) => mudar('valor', e.target.value)}
          erro={erros.valor && t.evento.erros[erros.valor]}
          autoComplete="off"
        />
        <CampoLongo
          name="mensagem"
          rotulo={t.evento.mensagem}
          dica={t.evento.mensagemDica}
          value={evento.mensagem}
          maxLength={LIMITES.mensagem}
          onChange={(e) => mudar('mensagem', e.target.value)}
          erro={erros.mensagem && t.evento.erros[erros.mensagem]}
          contador={{ atual: evento.mensagem.length, maximo: LIMITES.mensagem }}
        />
        <div className="acoes">
          <button type="submit" className="botao botao-principal">
            {t.evento.continuar}
          </button>
        </div>
      </form>
    </>
  );
}
