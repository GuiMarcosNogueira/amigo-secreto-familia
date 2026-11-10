# Design

## Context

Projeto novo: o repositório contém apenas a pasta `openspec/`. Motivação e escopo estão em `proposal.md`; o comportamento esperado está em `specs/`.

Restrições que moldam o desenho:

- **Custo zero**: arquivos estáticos na Vercel mais um backend mínimo, só para a lista de desejos, dentro dos planos gratuitos (decisão do dono do projeto; ver D11). Evento, sorteio e links continuam acontecendo só no navegador.
- **Público**: idosos e crianças no celular. Na dúvida entre duas opções, vence a mais simples de usar.
- **Sem login**: ninguém cria conta. O link individual é a única "credencial" de cada pessoa.
- **Privacidade por construção**: o resultado viaja dentro do próprio link, e o servidor nunca recebe nada legível.
- **Ambiente de desenvolvimento**: Windows 11, Node 24 via `fnm` (precisa ser ativado no shell antes de `npm`/`openspec`), `gh` e Vercel dependem de login do dono do projeto.

## Goals / Non-Goals

**Goals:**

- Um app estático pequeno (meta: JS inicial ≤ 80 kB gzip), sem dependências de runtime além do React.
- Lógica crítica (sorteio, viabilidade, criptografia, codificação de links, validações) em módulos puros TypeScript, sem React, 100% testáveis no Vitest.
- Sorteio comprovadamente correto e sem viés; impossibilidade provada, nunca "chutada" por esgotar tentativas.
- Nenhuma tela, log ou dado salvo com os pares em texto legível.
- Lista de desejos cifrada de ponta a ponta: o servidor não consegue ler as listas nem saber de quem são.
- O backend é opcional para o resto: se ele estiver fora do ar, sortear e revelar continuam funcionando.

**Non-Goals:**

- Contas, login ou qualquer dado no servidor além das listas cifradas.
- Notificar quem sorteou quando a lista muda; fotos ou links de lojas nos itens.
- Proteger o resultado contra um organizador mal-intencionado (ver Riscos): o modelo é de confiança familiar.
- Revogar links já enviados, sincronizar entre aparelhos, múltiplos eventos ao mesmo tempo.
- Internacionalização: só pt-BR, textos direto no código em um módulo único.
- Testes automatizados de interface ponta a ponta (a verificação do fluxo é feita no navegador, em viewport de celular).

## Decisions

### D1. Stack: Vite + TypeScript + React 19

Conforme pedido. Svelte daria um bundle menor, mas a diferença (~40 kB gzip) é irrelevante depois do cache do service worker, e React é o caminho sem desvio. TypeScript em modo `strict`.

- **Roteador**: roteamento por hash feito à mão (um hook `useHashRoute` com `hashchange`, ~30 linhas) em vez de `react-router`. São 7 rotas fixas; uma dependência a menos.
- **Estado**: `useReducer` + Context para o rascunho; sem biblioteca de estado.
- **CSS**: um `tokens.css` (variáveis de cor, espaçamento, tipografia) + CSS por componente, sem framework. Fontes do sistema (nenhum download de fonte).
- **Formulários**: controles nativos (`<input type="date">`, `inputmode="decimal"`, `<dialog>` para confirmações). Os nativos são os que idosos já conhecem do próprio celular e já são acessíveis.

Rotas:

| Hash | Tela |
|---|---|
| `#/` | Início / passo 1: evento |
| `#/participantes` | Passo 2 |
| `#/restricoes` | Passo 3 |
| `#/sortear` | Passo 4: conferência e botão de sortear (ou explicação de impossibilidade) |
| `#/links` | Lista de links do organizador |
| `#/ver/<payload>` | Revelação (participante) |
| `#/instalar` | Instruções de instalação |

Rota desconhecida cai em `#/`. Se existir lista de links salva, `#/` oferece "Ver links do último sorteio".

Estrutura de pastas:

```
src/
  core/        # puro, sem React: sorteio, viabilidade, cripto, link, validação, armazenamento, lista de desejos
  telas/       # uma pasta por rota
  componentes/ # Botao, Campo, Dialogo, Passos, Aviso
  textos.ts    # todas as mensagens em pt-BR
  estilos/     # tokens.css, base.css
public/        # favicon e ícones gerados
servidor/      # tratador puro da API de listas + adaptadores (memória, Upstash)
api/           # entrada da função serverless da Vercel
```

### D2. Sorteio: viabilidade por emparelhamento + amostragem por rejeição

O problema é um emparelhamento perfeito em grafo bipartido: de um lado quem dá, do outro quem recebe; existe aresta `i → j` quando `i ≠ j` e o par não é restrito.

1. **Viabilidade (prova)**: algoritmo de Kuhn (caminhos aumentantes), O(n³) no pior caso; trivial para n ≤ 50. Emparelhamento perfeito existe ⇔ sorteio possível. Isso atende "provar que é impossível" sem depender de limite de tentativas.
2. **Explicação**: quando não há emparelhamento perfeito, a partir de um doador não emparelhado percorre-se os caminhos alternantes; os doadores alcançados formam um conjunto `S` cujas opções `N(S)` são menos que `|S|` (violação do teorema de Hall). A mensagem sai desse conjunto:
   - `|N(S)| = 0`: "Fulano não pode tirar ninguém."
   - caso geral: "Ana e Beto só podem tirar Caio: são 2 pessoas para 1 opção."
   Junto vão as restrições que envolvem pessoas de `S`, com atalho para remover, e a sugestão de adicionar participantes.
3. **Sorteio**: embaralhar a lista de recebedores com Fisher-Yates e aceitar a permutação só se for válida inteira; senão embaralhar de novo. Amostragem por rejeição sobre permutações uniformes dá distribuição **uniforme entre todos os resultados válidos**.
   - Inteiros aleatórios vêm de `crypto.getRandomValues` (Uint32) com rejeição do resto, para não haver viés de módulo.
   - Sem restrições a chance de aceitar é ≈ 37% (1/e); com casais continua alta. Limite de 5.000 tentativas (milissegundos para n = 50).
4. **Plano B (configuração apertada)**: se as 5.000 tentativas falharem numa configuração provada viável, usa-se o emparelhamento de Kuhn com ordem de doadores e de vizinhos embaralhada. Sempre termina e sempre é válido, mas não é perfeitamente uniforme (ver Riscos).

API do núcleo (pura, com gerador aleatório injetável para testes determinísticos):

```ts
verificarViabilidade(participantes, restricoes): { possivel: true } | { possivel: false; bloqueados: Id[]; opcoes: Id[]; restricoesEnvolvidas: Par[] }
sortear(participantes, restricoes, rng?): Map<Id, Id>   // lança se inviável
```

Alternativas descartadas: construir a permutação pessoa a pessoa com backtracking (enviesa o resultado); só "tentar N vezes e desistir" (não prova impossibilidade); exigir um único ciclo (restrição extra sem ganho para a família).

Restrições são **simétricas** (o pedido fala em "pares que não podem se tirar"). Participantes têm `id` estável; restrições guardam pares de ids ordenados, então renomear não quebra nada.

### D3. Link: uma chave AES-GCM por link, tudo no fragmento

Formato: `https://<site>/#/ver/v1.<chave>.<dados>`

- `chave`: 32 bytes aleatórios (AES-256) em base64url.
- `dados`: base64url de `iv (12 bytes aleatórios) ‖ texto cifrado + tag GCM`.
- Texto claro: JSON compacto `{ v, c, de, para, ev: { n, d, val?, msg? }, s, al: { id, k } }` (código do sorteio, quem tirou, sorteado, evento, semente da própria lista de desejos e acesso de leitura à lista do sorteado; ver D11), em UTF-8, **preenchido com espaços até o mesmo tamanho para todos os links do sorteio**, para o comprimento do link não denunciar o tamanho do nome sorteado.
- Prefixo `v1` permite mudar o formato no futuro; versão desconhecida cai na tela de link inválido.
- Qualquer falha (formato, base64, tag GCM, JSON, campos faltando) vira um único resultado `invalido`, que a tela traduz na mensagem amigável. Nada parcial é exibido.

Tamanho estimado: ~550–900 caracteres com mensagem de 280 caracteres (os acessos às listas somam ~180); cabe com folga em WhatsApp e SMS. Por isso os limites de 60/40/280 caracteres nas specs.

O que a criptografia entrega aqui, honestamente: (a) nada legível no link, na pré-visualização do WhatsApp ou no histórico; (b) nada chega ao servidor, pois fragmento não é enviado em requisições; (c) integridade: link alterado ou cortado é detectado pela tag GCM. A chave viaja junto no mesmo link (consequência de não ter login), então quem tem o link consegue abri-lo. Isso é intencional.

Alternativa descartada: uma chave única do evento combinada à parte (segunda informação para a família digitar; ruim para idosos).

### D4. O organizador não vê os pares

- O `Map` do sorteio vive só dentro da função que gera os links e é descartado; nunca entra em estado React, `localStorage` ou `console`.
- A lista mostra **nome do participante + botões**, nunca o texto do link nem o sorteado.
- "Sou eu" abre a revelação no próprio aparelho após um `<dialog>` "Você é a Ana?", para o organizador participar sem precisar mandar o link para si mesmo.
- "Marcar como enviado" é automático ao tocar em WhatsApp/Compartilhar/Copiar, e pode ser desfeito.
- **Código do sorteio**: 4 caracteres de um alfabeto sem ambíguos (sem 0/O, 1/I/L), gerado a cada sorteio, mostrado na lista e na revelação. Como não dá para revogar links antigos, é o jeito simples de a família conferir que todos estão no mesmo sorteio.

### D5. Compartilhamento

- **WhatsApp**: `https://wa.me/?text=<mensagem codificada>` sem número; o WhatsApp abre o seletor de conversa. Evita cadastrar telefones (menos digitação, menos dado pessoal).
- **Mensagem pronta**: "Oi, {nome}! 🎁 Aqui está o seu Amigo Secreto do {evento}. Toque no link para descobrir quem você tirou (só você deve abrir): {link}".
- **Compartilhar**: botão só aparece se `navigator.share` existir.
- **Copiar**: `navigator.clipboard.writeText`; se falhar, mostra o link num campo somente leitura já selecionado.

### D6. Persistência local

Duas chaves em `localStorage`, versionadas, lidas com validação defensiva (qualquer erro → estado em branco):

| Chave | Conteúdo |
|---|---|
| `amigo-secreto:rascunho:v1` | evento, participantes `{id, nome}`, restrições `[idA, idB]` |
| `amigo-secreto:links:v1` | código do sorteio, data/hora, `[{ participante, url, enviado }]` |
| `amigo-secreto:tema` | `claro` \| `escuro` (ausente = seguir o aparelho) |

Gravação a cada mudança (dados minúsculos, sem debounce). "Recomeçar" apaga as duas primeiras. Se `localStorage` lançar erro, o app segue em memória e mostra um aviso.

A lista de links guardada contém as chaves (é o que permite reenviar). É o único vestígio do resultado no aparelho, e não é legível sem abrir cada link.

### D7. PWA

- `vite-plugin-pwa` em modo `generateSW`, `registerType: 'autoUpdate'`, precache de todo o build. Como o roteamento é por hash, toda navegação é para `/`: não precisa de fallback de navegação nem de rewrites na Vercel.
- `/api/*` nunca passa pelo cache do service worker (sem regra de runtime caching): lista de desejos é sempre rede, e a falha vira o aviso amigável.
- Manifest: `name` "Amigo Secreto da Família", `short_name` "Amigo Secreto", `lang` "pt-BR", `display` "standalone", `start_url` "/", `theme_color`/`background_color` dos tokens, ícones 192, 512 e 512 maskable, mais `apple-touch-icon` 180.
- Ícones gerados de um único SVG com `@vite-pwa/assets-generator` (dependência só de desenvolvimento).
- Tela `#/instalar`: detecta plataforma por user agent só para escolher qual instrução mostrar primeiro; captura `beforeinstallprompt` para o botão "Instalar agora" no Android; esconde o convite quando `display-mode: standalone`.
- Links de revelação abertos pelo WhatsApp caem no navegador (ou no navegador interno do WhatsApp), não no app instalado. Tudo bem: a revelação não depende de nenhum dado local.

### D8. Acessibilidade e temas

- Tokens em `:root`, tema escuro por `@media (prefers-color-scheme: dark)` e sobrescrita manual por `data-tema` no `<html>` (aplicado por script inline antes da pintura, para não piscar).
- Base 18 px em `rem`, `min-height: 44px` em todo controle, `:focus-visible` com contorno de 3 px, `env(safe-area-inset-*)`.
- Animações só dentro de `@media (prefers-reduced-motion: no-preference)`.
- Avisos dinâmicos em região `aria-live="polite"`; erros ligados ao campo por `aria-describedby` + `aria-invalid`.

### D8b. Navegadores de computador

O desenho continua mobile-first; o computador é atendido sem uma interface separada.

- **Navegadores alvo**: versões atuais de Chrome, Edge, Firefox e Safari (macOS), além de Chrome/Android e Safari/iOS. Todas as APIs usadas (Web Crypto, Service Worker, `localStorage`, `<dialog>`, `clipboard.writeText`) existem em todos eles; `build.target` do Vite fica no padrão.
- **Layout**: uma única coluna com `max-width` de ~560 px centralizada; em telas largas sobra margem dos lados, com o fundo do tema. Sem grade de várias colunas nem breakpoints de layout: menos CSS e a mesma tela que a família vê no celular.
- **Entrada**: tudo com elementos nativos (`<button>`, `<form>`, `<dialog>`), então clique, Enter, Espaço e Esc funcionam sem código extra. Estados `:hover` só dentro de `@media (hover: hover)`, e nunca como único meio de mostrar algo.
- **Recursos que variam por navegador**, sempre por detecção de recurso e nunca por user agent:
  - `navigator.share`: ausente no Firefox de computador → o botão "Compartilhar" some (já previsto na spec).
  - `beforeinstallprompt`: só Chrome/Edge → "Instalar agora" aparece só neles; Firefox e Safari de computador mostram apenas o texto "funciona direto no navegador".
  - `wa.me`: no computador abre o WhatsApp Web ou o app de desktop; o link é aberto com `target="_blank"` e `rel="noopener"` para a lista de links não sair da tela.
- **Tela `#/instalar` no computador**: variante "computador" com a explicação e os passos de Android e iOS lado a lado em abas.

Limite de verificação: a máquina de desenvolvimento é Windows, então Chrome, Edge e Firefox são verificados de verdade; o Safari de macOS fica coberto só pelo uso de APIs padrão e pelo teste no iPhone (mesmo motor).

### D9. Qualidade e auditoria

- Vitest para `src/core` (ambiente Node, que já tem `crypto.subtle`). ESLint (typescript-eslint + react-hooks + jsx-a11y) e Prettier. Scripts: `dev`, `build`, `preview`, `test`, `lint`, `format`, `verificar` (lint + test + build).
- **Desvio registrado — Lighthouse PWA**: o Lighthouse removeu a categoria "PWA" na versão 12 (2024), então não existe mais nota de PWA para atingir ≥ 90. Substituição: Lighthouse ≥ 90 em Desempenho, Acessibilidade e Boas Práticas (mobile) + checklist de instalabilidade verificado no navegador (manifest válido, ícones 192/512/maskable, service worker ativo controlando a página, abre offline, instala no Android e no iOS).
- Verificação do fluxo completo no navegador em viewport 375 × 812: criar evento → participantes → restrição → sortear → abrir um link → revelar/ocultar → link adulterado.

### D11. Lista de desejos: backend mínimo com cifra de ponta a ponta

**Desvio registrado**: o pedido original era "sem backend"; o dono do projeto escolheu um backend mínimo cifrado para que cada pessoa edite a própria lista e só quem a sorteou leia. As alternativas sem servidor foram descartadas: o organizador digitar as listas antes do sorteio (ele veria todas e ninguém editaria depois) e postar links cifrados no grupo da família (confuso para idosos e preso a um único navegador).

**Chaves, sem cadastro e sem login.** No sorteio (que continua offline, sem falar com o servidor), cada participante P recebe uma semente aleatória de 32 bytes `S_P`. Dela saem, por HKDF-SHA-256 com rótulos distintos:

| Derivado | Para quê | Quem tem |
|---|---|---|
| `token = HKDF(S_P, "escrita")` | autoriza gravar | só P (deriva da semente) |
| `K = HKDF(S_P, "cifra")` | chave AES-GCM do conteúdo | P e quem sorteou P |
| `id = base64url(SHA-256(token))` | endereço da lista no servidor | P, quem sorteou P e o servidor |

- O link de P carrega `s = S_P` (para escrever a própria lista) e `al = { id, k }` do sorteado (para ler a lista dele).
- Quem sorteou tem `id` e `K`, mas não o `token`: lê e não grava. O `id` é um hash do `token`, então não dá para voltar dele ao `token`.
- O servidor valida a gravação conferindo `SHA-256(token) == id`. Não precisa de cadastro prévio nem de tabela de permissões, e por isso o sorteio não depende de internet.

**Conteúdo.** `{ v: 1, itens: string[], obs?: string, em: ISO-8601 }` em JSON, cifrado com `K` e IV aleatório de 12 bytes; vai ao servidor como base64url de `iv ‖ cifra`. A data da última alteração fica dentro do conteúdo cifrado. Limites validados no cliente (10 itens × 100 caracteres, observação de 200) e teto de 8 kB no servidor (uma lista cheia de emojis, no pior caso, passa de 8 kB depois de cifrada).

**API** (mesma origem, sem CORS):

| Método | Rota | Regra |
|---|---|---|
| `GET` | `/api/listas/<id>` | devolve o conteúdo cifrado ou 404 (lista ainda não escrita) |
| `PUT` | `/api/listas/<id>` | `Authorization: Bearer <token>`; exige `SHA-256(token) == id`, corpo ≤ 8 kB em base64url; grava com validade de 400 dias; última gravação vence |

- `id` precisa ter o formato exato (43 caracteres base64url); fora disso, 400.
- Limite de gravações por IP com contador de janela fixa no próprio Redis (`INCR` + `EXPIRE`, 30 gravações por hora), sem biblioteca extra. Excesso → 429.
- Respostas com `Cache-Control: no-store`.
- Apagar a lista = gravar uma lista vazia (não há `DELETE`).

**Implementação.** O tratador é uma função pura `tratar(requisicao, armazenamento, relogio) → resposta` em `servidor/listas.ts`, com a interface `Armazenamento { ler, gravar, contar }`. Três usos:

- `api/listas/[id].ts`: função da Vercel (runtime Node), com o adaptador Upstash Redis (`@upstash/redis`, variáveis de ambiente criadas pela integração da Vercel).
- Plugin local do Vite (`configureServer` e `configurePreviewServer`) que monta o mesmo tratador com armazenamento em memória. Assim `npm run dev` e `npm run preview` têm lista de desejos funcionando sem conta em lugar nenhum; a conta Upstash só é necessária no grupo de publicação.
- Vitest: testes do tratador com o armazenamento em memória.

Alternativas de banco descartadas: Supabase (projetos gratuitos pausam por inatividade, e o Amigo Secreto fica meses parado), Firebase (SDK pesado no cliente e regras de segurança à parte), Vercel Blob (sem validade automática nem contador para o limite por IP).

**Tela** (`#/ver/<payload>`), em duas partes independentes:

- "Minha lista de desejos": aparece sempre, mesmo antes de revelar. Ao abrir, busca a lista com o `id`/`K` derivados da própria semente; editor simples (campo + "Adicionar", remover por item, observação, "Salvar minha lista").
- "Lista de desejos de {sorteado}": só é buscada e mostrada depois do toque de revelar, e some ao ocultar. Estados: carregando, lista, "ainda não escreveu", sem conexão/erro com "Tentar de novo", e botão "Atualizar".
- A falha de uma parte nunca bloqueia a outra nem a revelação.

**O que o servidor e os registros da Vercel enxergam**: `id` aleatório, conteúdo cifrado, IP e horário. Nada liga um `id` a um nome ou a um evento.

### D10. Repositório e publicação

- Git local desde a primeira task (um commit por task ou grupo, em português, Conventional Commits: `feat: ...`, `test: ...`, `docs: ...`, `chore: ...`). O repositório remoto público `amigo-secreto-familia` é criado no grupo 7 com `gh repo create`.
- Vercel ligada ao repositório GitHub (deploy automático a cada push na `main`), preset Vite, build `npm run build`, saída `dist`. Um `vercel.json` mínimo fixa essas três configurações para o projeto não depender do painel. A pasta `api/` vira função serverless automaticamente.
- Banco: Upstash Redis criado pela integração do Marketplace da Vercel e conectado ao projeto (as variáveis de ambiente são injetadas pela integração; nenhum segredo vai para o repositório). Criar a integração exige aceitar termos no navegador: **parar e pedir ao dono do projeto**.
- Antes de usar `gh` ou `vercel`, verificar `gh auth status` / `vercel whoami`; sem login, **parar e pedir ao dono do projeto para autenticar** (não tentar contornar).

## Risks / Trade-offs

- **[O organizador tem todos os links e, tecnicamente, pode abrir os dos outros]** → Inevitável sem login. Mitigação: a interface nunca mostra os pares nem o texto dos links, "Sou eu" pede confirmação, e o README explica com franqueza que o modelo é de confiança.
- **[Quem tem o link de alguém lê e altera a lista dessa pessoa; o organizador tem todos]** → Mesmo modelo de confiança do sorteio. O servidor e terceiros não leem nada.
- **[Backend fora do ar ou plano gratuito esgotado]** → Só a lista de desejos é afetada, com aviso amigável; sorteio e revelação seguem. O uso de uma família fica ordens de grandeza abaixo dos limites gratuitos.
- **[Endpoint público pode receber lixo de terceiros]** → Só aceita gravação cujo `token` bate com o `id`, com teto de 8 kB, limite por IP e validade de 400 dias; o pior caso é ocupar espaço que expira sozinho.
- **[Duas edições ao mesmo tempo da mesma lista]** → Última gravação vence; aceitável para uma lista pessoal.
- **[Listas somem no novo sorteio]** → Sementes novas a cada sorteio; o aviso de "Sortear de novo" diz isso. As antigas expiram sozinhas.
- **[Planos gratuitos podem mudar]** → O armazenamento fica atrás de uma interface de três funções; trocar de banco é reescrever um adaptador.
- **[Links antigos continuam funcionando após "Sortear de novo"]** → Aviso antes de refazer + código do sorteio visível nos dois lados para conferência.
- **[Quem pega o celular de alguém abre o link]** → O sorteado fica oculto até o toque e pode ser ocultado de novo; a mensagem do WhatsApp avisa "só você deve abrir".
- **[Organizador troca de aparelho ou limpa os dados do navegador e perde a lista de links]** → Os links já enviados continuam valendo; o README orienta a terminar de enviar antes de limpar. No iOS, dados de sites sem uso por semanas podem ser apagados: instalar na tela inicial reduz esse risco.
- **[Plano B do sorteio não é perfeitamente uniforme]** → Só entra em configurações muito apertadas (raras em família), continua válido e imprevisível. Um teste garante que o caminho principal resolve os casos típicos sem recorrer a ele.
- **[Navegador interno do WhatsApp/Instagram com APIs limitadas]** → A revelação usa só Web Crypto, disponível em qualquer WebView atual; copiar e compartilhar têm alternativa manual.
- **[Safari de macOS não é verificado na máquina de desenvolvimento (Windows)]** → Só APIs padrão, sem prefixos; o teste no iPhone exercita o mesmo motor. Fica como verificação manual se alguém da família tiver um Mac.
- **[Service worker servindo versão antiga]** → `autoUpdate` + `sw.js` servido sem cache longo pela Vercel; verificado na publicação.
- **[Nomes repetidos na família]** → Bloqueio com sugestão de apelido ("José (tio)").

## Migration Plan

Não há sistema anterior. Publicação: criar o banco Upstash pela integração da Vercel, depois push na `main` → deploy automático na Vercel. Reversão: "Promote" do deploy anterior no painel da Vercel ou `git revert`. O formato do link é versionado (`v1`), então mudanças futuras não quebram links já enviados.

## Melhorias futuras

- Lista de desejos: avisar quem sorteou quando a lista mudar, links de lojas e fotos nos itens, e reaproveitar a lista antiga depois de um novo sorteio.
- Exportar/importar o rascunho para trocar de aparelho.
- Vários eventos guardados ao mesmo tempo.
- Restrições em um só sentido e "não repetir o par do ano passado".

## Open Questions

- Identidade visual (cores e desenho do ícone): começa com uma paleta natalina sóbria e um ícone de presente; pode ser trocada depois sem afetar specs nem tasks.
- Domínio próprio: a versão inicial usa o endereço `*.vercel.app`.
