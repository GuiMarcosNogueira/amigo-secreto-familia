import { useEffect, useRef } from 'react';
import { Moldura } from './componentes/Moldura';
import { ProvedorDeEstado } from './estado';
import { useHashRoute } from './navegacao';
import { TelaEvento } from './telas/TelaEvento';
import { TelaInstalar } from './telas/TelaInstalar';
import { TelaLinks } from './telas/TelaLinks';
import { TelaParticipantes } from './telas/TelaParticipantes';
import { TelaRestricoes } from './telas/TelaRestricoes';
import { TelaSortear } from './telas/TelaSortear';
import { TelaVer } from './telas/TelaVer';

export function App() {
  const rota = useHashRoute();
  const primeira = useRef(true);

  // Ao trocar de tela, volta ao topo e leva o foco para o título (leitores de tela e teclado).
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [rota.tela]);

  const organizador = rota.tela !== 'ver' && rota.tela !== 'instalar';

  return (
    <ProvedorDeEstado>
      <Moldura organizador={organizador}>
        {rota.tela === 'evento' && <TelaEvento />}
        {rota.tela === 'participantes' && <TelaParticipantes />}
        {rota.tela === 'restricoes' && <TelaRestricoes />}
        {rota.tela === 'sortear' && <TelaSortear />}
        {rota.tela === 'links' && <TelaLinks />}
        {rota.tela === 'instalar' && <TelaInstalar />}
        {rota.tela === 'ver' && <TelaVer payload={rota.payload} />}
      </Moldura>
    </ProvedorDeEstado>
  );
}
