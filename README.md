# 🎁 Amigo Secreto da Família

Um app simples para organizar o Amigo Secreto da família, feito para funcionar no celular de todo mundo, da criançada aos avós. Sem cadastro, sem anúncio e sem loja de aplicativos.

**Endereço:** _(a URL de produção entra aqui depois da publicação)_

## O que ele faz

- **Organiza o evento**: nome, dia da troca, valor sugerido e um recado.
- **Sorteia de forma justa**: ninguém tira a si mesmo, e você pode marcar quem não deve tirar quem (casais, pais e filhos). Se as regras tornarem o sorteio impossível, o app explica o motivo e como resolver.
- **Mantém o segredo**: cada pessoa recebe um link só dela, por WhatsApp. Nem quem organiza vê quem tirou quem.
- **Lista de desejos**: cada pessoa escreve ideias de presente pelo próprio link, e só quem a sorteou consegue ler.
- **Funciona sem internet** depois da primeira vez (só a lista de desejos precisa de conexão).

## Como instalar no celular

Não precisa de loja de aplicativos. Dentro do app há uma tela "Instalar no celular" com o mesmo passo a passo.

**Android (Chrome)**

1. Abra o endereço do app no Chrome.
2. Toque nos três pontinhos (⋮), no canto de cima.
3. Toque em "Adicionar à tela inicial" ou "Instalar app" e confirme.

**iPhone (Safari)**

1. Abra o endereço do app no Safari.
2. Toque no botão Compartilhar (o quadradinho com a seta para cima).
3. Toque em "Adicionar à Tela de Início" e depois em "Adicionar".

**Computador**: não precisa instalar. Funciona direto no navegador (Chrome, Edge, Firefox ou Safari).

## Como usar

1. Quem organiza preenche o evento, os participantes e as regras, e toca em **Sortear agora**.
2. Aparece uma lista com um botão **Enviar pelo WhatsApp** para cada pessoa. Envie cada link para o seu dono.
3. Cada pessoa abre o link, toca em **Ver quem eu tirei** e, se quiser, escreve a própria lista de desejos.
4. Quem organiza também participa: é só tocar em **Sou eu** na própria linha.

O **código do sorteio** (4 letras e números) aparece para o organizador e para cada participante. Se alguém estiver com um código diferente, está com um link de um sorteio antigo.

## Como funciona a privacidade

O que fica **só no aparelho** de quem organiza: o evento, os nomes, as regras e a lista de links gerados (para poder reenviar a quem perder o seu). O resultado do sorteio não é guardado em lugar nenhum de forma legível.

O que viaja **dentro de cada link**: quem tirou, quem foi sorteado e os dados do evento, cifrados com AES-GCM de 256 bits. O conteúdo e a chave ficam depois do `#` do endereço, uma parte que o navegador nunca envia ao servidor. Um link alterado ou cortado é detectado e mostra uma mensagem amigável.

O que vai **ao servidor**: apenas as listas de desejos, já cifradas no aparelho. O servidor guarda um endereço aleatório e um conteúdo ilegível, sem nomes, sem evento e sem chaves. A chave de leitura de cada lista só existe em dois links: o da própria pessoa e o de quem a sorteou. Só o dono consegue alterar a lista. Listas sem alteração por 400 dias são apagadas.

O app não usa cookies, contas, análise de uso nem serviços de terceiros.

### Os limites, com franqueza

Não existe login: **o link é a chave**. Isso tem consequências que vale conhecer:

- Quem tiver o link de uma pessoa vê quem ela tirou e a lista de desejos dela. Por isso cada um deve abrir só o seu.
- Quem organiza guarda todos os links e, tecnicamente, poderia abrir os dos outros. O app nunca mostra os pares e pede confirmação antes de abrir um link, mas o modelo é de confiança entre a família.
- Links já enviados não podem ser cancelados. Se você sortear de novo, os antigos continuam abrindo o resultado antigo; o código do sorteio serve para conferir.
- Se o organizador limpar os dados do navegador, perde a lista de links (os que já foram enviados continuam funcionando).

## Como rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
npm install
```

```bash
npm run dev
```

Abra o endereço que aparecer no terminal. No modo de desenvolvimento a lista de desejos funciona com um servidor local em memória: não precisa de conta em lugar nenhum, e as listas somem quando o servidor é encerrado.

Outros comandos:

| Comando             | O que faz                                              |
| ------------------- | ------------------------------------------------------ |
| `npm test`          | Roda os testes (sorteio, criptografia, API das listas) |
| `npm run lint`      | Confere o código                                       |
| `npm run build`     | Gera a versão de produção em `dist/`                   |
| `npm run preview`   | Serve a versão de produção, com service worker         |
| `npm run verificar` | Lint + testes + build                                  |
| `npm run icones`    | Gera os ícones a partir de `public/icone.svg`          |

## Como publicar a sua própria cópia

1. Crie um projeto na [Vercel](https://vercel.com) a partir deste repositório. O `vercel.json` já define Vite, `npm run build` e a pasta `dist`.
2. No painel do projeto, em **Storage**, adicione um banco **Upstash Redis** (plano gratuito) e conecte-o ao projeto. A integração cria sozinha as variáveis de ambiente `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
3. Faça um novo deploy.

Sem o banco, o app funciona normalmente; só a lista de desejos avisa que não conseguiu carregar.

## Como é feito

- **Vite + React + TypeScript**, CSS simples, sem biblioteca de componentes.
- **Sorteio**: embaralhamento Fisher-Yates com `crypto.getRandomValues`, aceitando só resultados inteiros que respeitam as regras, o que dá chance igual a todo resultado válido. Antes de sortear, um emparelhamento em grafo bipartido prova se existe solução.
- **PWA**: `vite-plugin-pwa`, com todo o app guardado para uso offline.
- **Lista de desejos**: uma função serverless (`api/listas/[id].ts`) e Upstash Redis, guardando apenas conteúdo cifrado.
- A lógica fica em `src/core` e `servidor`, sem dependência de interface, e é coberta por testes.

### Qualidade

Lighthouse 13 (celular) na versão de produção: **Desempenho 100, Acessibilidade 100, Boas práticas 100**. A categoria "PWA" deixou de existir no Lighthouse; no lugar dela foram conferidos o manifest, os ícones, o service worker e a abertura sem internet.

## Ideias para o futuro

- Avisar quem sorteou quando a lista de desejos mudar.
- Links de lojas e fotos nos desejos.
- Levar o rascunho de um aparelho para outro.
- "Não repetir o par do ano passado".

## Licença

[MIT](LICENSE)
