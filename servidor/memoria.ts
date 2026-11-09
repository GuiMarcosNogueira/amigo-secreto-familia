import type { Armazenamento } from './listas.js';

interface Registro {
  valor: string;
  expiraEm: number;
}

/** Armazenamento em memória, para desenvolvimento local e testes. */
export function armazenamentoEmMemoria(agora: () => number = Date.now) {
  const listas = new Map<string, Registro>();
  const contadores = new Map<string, { total: number; expiraEm: number }>();

  const armazenamento: Armazenamento = {
    async ler(id) {
      const registro = listas.get(id);
      if (!registro) return null;
      if (registro.expiraEm <= agora()) {
        listas.delete(id);
        return null;
      }
      return registro.valor;
    },
    async gravar(id, conteudo, validadeEmSegundos) {
      listas.set(id, { valor: conteudo, expiraEm: agora() + validadeEmSegundos * 1000 });
    },
    async contar(chave, janelaEmSegundos) {
      const atual = contadores.get(chave);
      if (!atual || atual.expiraEm <= agora()) {
        contadores.set(chave, { total: 1, expiraEm: agora() + janelaEmSegundos * 1000 });
        return 1;
      }
      atual.total += 1;
      return atual.total;
    },
  };

  return Object.assign(armazenamento, { listas });
}
