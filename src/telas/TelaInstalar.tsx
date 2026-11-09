import { useState } from 'react';
import {
  abertoComoApp,
  detectarPlataforma,
  instalarAgora,
  usePodeInstalar,
  type Plataforma,
} from '../aparelho';
import { CAMINHOS } from '../core/rotas';
import { t } from '../textos';

export function TelaInstalar() {
  const [plataforma] = useState<Plataforma>(() => detectarPlataforma());
  const [aba, setAba] = useState<'android' | 'iphone'>(
    plataforma === 'iphone' ? 'iphone' : 'android',
  );
  const podeInstalar = usePodeInstalar();
  const instalado = abertoComoApp();

  return (
    <>
      <h1 tabIndex={-1}>{t.instalar.titulo}</h1>
      <p className="intro">{t.instalar.intro}</p>

      {instalado && <p className="aviso aviso-sucesso">{t.instalar.jaInstalado}</p>}
      {plataforma === 'computador' && <p className="cartao">{t.instalar.computador}</p>}

      {podeInstalar && !instalado && (
        <div className="acoes">
          <button
            type="button"
            className="botao botao-principal botao-grande"
            onClick={() => void instalarAgora()}
          >
            {t.instalar.agora}
          </button>
        </div>
      )}

      <div className="abas" role="group" aria-label={t.instalar.escolha}>
        <button
          type="button"
          className="botao"
          aria-pressed={aba === 'android'}
          onClick={() => setAba('android')}
        >
          {t.instalar.android}
        </button>
        <button
          type="button"
          className="botao"
          aria-pressed={aba === 'iphone'}
          onClick={() => setAba('iphone')}
        >
          {t.instalar.iphone}
        </button>
      </div>

      <section className="cartao" aria-live="polite">
        <h2>{aba === 'android' ? t.instalar.tituloAndroid : t.instalar.tituloIphone}</h2>
        <ol className="instrucoes">
          {(aba === 'android' ? t.instalar.passosAndroid : t.instalar.passosIphone).map((passo) => (
            <li key={passo}>{passo}</li>
          ))}
        </ol>
      </section>

      <div className="acoes">
        <a className="botao" href={CAMINHOS.evento}>
          {t.app.voltar}
        </a>
      </div>
    </>
  );
}
