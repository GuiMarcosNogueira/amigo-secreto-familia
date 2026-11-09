import { bytesAleatorios } from './aleatorio';

type Bytes = Uint8Array<ArrayBuffer>;

const codificador = new TextEncoder();
const decodificador = new TextDecoder('utf-8', { fatal: true });

export function textoParaBytes(texto: string): Bytes {
  return codificador.encode(texto) as Bytes;
}

export function bytesParaTexto(bytes: Uint8Array): string {
  return decodificador.decode(bytes);
}

export function paraBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Lança erro se o texto não for base64url válido. */
export function deBase64Url(texto: string): Bytes {
  if (!/^[A-Za-z0-9_-]*$/.test(texto) || texto.length % 4 === 1) {
    throw new Error('base64url inválido');
  }
  const binario = atob(texto.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

const TAMANHO_IV = 12;
export const TAMANHO_CHAVE = 32;

async function importarChave(chave: Bytes, uso: KeyUsage): Promise<CryptoKey> {
  if (chave.length !== TAMANHO_CHAVE) throw new Error('chave com tamanho errado');
  return crypto.subtle.importKey('raw', chave, 'AES-GCM', false, [uso]);
}

/** AES-256-GCM. Devolve `iv (12 bytes) ‖ texto cifrado + tag`. */
export async function cifrar(chave: Bytes, dados: Bytes): Promise<Bytes> {
  const iv = bytesAleatorios(TAMANHO_IV);
  const cifra = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await importarChave(chave, 'encrypt'),
    dados,
  );
  const saida = new Uint8Array(TAMANHO_IV + cifra.byteLength);
  saida.set(iv, 0);
  saida.set(new Uint8Array(cifra), TAMANHO_IV);
  return saida;
}

/** Lança erro se a chave estiver errada ou se um único bit tiver sido alterado. */
export async function decifrar(chave: Bytes, pacote: Bytes): Promise<Bytes> {
  if (pacote.length <= TAMANHO_IV) throw new Error('pacote curto demais');
  const claro = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: pacote.slice(0, TAMANHO_IV) },
    await importarChave(chave, 'decrypt'),
    pacote.slice(TAMANHO_IV),
  );
  return new Uint8Array(claro);
}

/** HKDF-SHA-256 de 32 bytes, com um rótulo para separar os usos. */
export async function derivar(semente: Bytes, rotulo: string): Promise<Bytes> {
  const base = await crypto.subtle.importKey('raw', semente, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: textoParaBytes(rotulo) },
    base,
    256,
  );
  return new Uint8Array(bits);
}

export async function sha256(dados: Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', dados));
}
