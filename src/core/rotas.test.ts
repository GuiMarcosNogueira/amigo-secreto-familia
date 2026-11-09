import { describe, expect, it } from 'vitest';
import { CAMINHOS, interpretarRota } from './rotas';

describe('interpretarRota', () => {
  it('reconhece as rotas do organizador', () => {
    expect(interpretarRota('')).toEqual({ tela: 'evento' });
    expect(interpretarRota('#')).toEqual({ tela: 'evento' });
    expect(interpretarRota(CAMINHOS.evento)).toEqual({ tela: 'evento' });
    expect(interpretarRota(CAMINHOS.participantes)).toEqual({ tela: 'participantes' });
    expect(interpretarRota(CAMINHOS.restricoes)).toEqual({ tela: 'restricoes' });
    expect(interpretarRota(CAMINHOS.sortear)).toEqual({ tela: 'sortear' });
    expect(interpretarRota(CAMINHOS.links)).toEqual({ tela: 'links' });
    expect(interpretarRota(CAMINHOS.instalar)).toEqual({ tela: 'instalar' });
    expect(interpretarRota('#/links/')).toEqual({ tela: 'links' });
  });

  it('entrega o payload do link de revelação inteiro, com pontos e hífens', () => {
    expect(interpretarRota('#/ver/v1.Ab-_.Cd-_')).toEqual({ tela: 'ver', payload: 'v1.Ab-_.Cd-_' });
    expect(interpretarRota('#/ver/')).toEqual({ tela: 'ver', payload: '' });
  });

  it('rota desconhecida cai no início', () => {
    expect(interpretarRota('#/nao-existe')).toEqual({ tela: 'evento' });
    expect(interpretarRota('#/ver')).toEqual({ tela: 'evento' });
    expect(interpretarRota('#qualquer-coisa')).toEqual({ tela: 'evento' });
  });
});
