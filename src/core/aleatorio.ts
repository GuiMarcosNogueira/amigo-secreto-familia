/** Devolve um inteiro uniforme em [0, n). */
export type Rng = (n: number) => number;

const DOIS_32 = 0x1_0000_0000;

/**
 * Inteiro uniforme em [0, n) a partir de `crypto.getRandomValues`.
 * Descarta os valores do "resto" para não haver viés de módulo.
 */
export const rngCripto: Rng = (n) => {
  if (!Number.isInteger(n) || n <= 0 || n > DOIS_32) throw new RangeError('n inválido');
  const limite = DOIS_32 - (DOIS_32 % n);
  const balde = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(balde);
    const valor = balde[0]!;
    if (valor < limite) return valor % n;
  }
};

/** Fisher-Yates: devolve uma cópia embaralhada, sem alterar a lista original. */
export function embaralhar<T>(lista: readonly T[], rng: Rng = rngCripto): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    const tmp = copia[i]!;
    copia[i] = copia[j]!;
    copia[j] = tmp;
  }
  return copia;
}

export function bytesAleatorios(quantidade: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(quantidade);
  crypto.getRandomValues(bytes);
  return bytes;
}

// Sem 0/O, 1/I/L: fácil de ler em voz alta.
const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function gerarCodigo(tamanho = 4, rng: Rng = rngCripto): string {
  let codigo = '';
  for (let i = 0; i < tamanho; i++) codigo += ALFABETO_CODIGO[rng(ALFABETO_CODIGO.length)];
  return codigo;
}

export function novoId(): string {
  return crypto.randomUUID();
}
