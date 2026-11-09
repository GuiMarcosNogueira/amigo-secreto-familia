/** "quinta-feira, 24 de dezembro de 2026" a partir de "2026-12-24". */
export function formatarData(iso: string): string {
  const data = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(data.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(data);
}

/** "R$ 50,00" */
export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(valor)
    .replace(/ /g, ' ');
}

/** "9 de novembro, 14:30" no horário do aparelho. */
export function formatarDataHora(iso: string, fuso?: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: fuso,
  }).format(data);
}

/** A data de hoje no aparelho, como AAAA-MM-DD. */
export function hojeISO(agora: Date = new Date()): string {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** "Ana", "Ana e Beto", "Ana, Beto e Caio" */
export function listarNomes(nomes: readonly string[]): string {
  return new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' }).format(nomes);
}

export function mensagemDoLink(participante: string, evento: string, url: string): string {
  return `Oi, ${participante}! 🎁 Aqui está o seu Amigo Secreto do ${evento}. Toque no link para descobrir quem você tirou (só você deve abrir): ${url}`;
}

export function urlDoWhatsApp(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
