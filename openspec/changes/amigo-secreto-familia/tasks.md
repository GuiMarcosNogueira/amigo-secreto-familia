# Tasks

> Convenções para todos os grupos: ativar o Node com `fnm` antes de usar `npm`; um commit por task concluída, em português, no padrão Conventional Commits (`feat:`, `test:`, `docs:`, `chore:`, `fix:`); nunca registrar em log nem exibir os pares do sorteio.

## 1. Shell PWA

- [x] 1.1 Iniciar o repositório git local e o projeto Vite + React + TypeScript (modo `strict`) na raiz, com `.gitignore`; verificar que `npm run dev` abre a página inicial e `npm run build` gera `dist/`
- [x] 1.2 Configurar ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, Vitest e os scripts `test`, `lint`, `format` e `verificar`; verificar que `npm run verificar` termina sem erros
- [x] 1.3 Criar a estrutura `src/core`, `src/telas`, `src/componentes`, `src/estilos`, `src/textos.ts` e o roteador por hash (`useHashRoute`) com as 7 rotas do design e fallback para `#/`; verificar com teste unitário do parser de rotas (inclui `#/ver/<payload>` e rota desconhecida)
- [x] 1.4 Criar `tokens.css` e `base.css` (cores claro/escuro, tipografia base 18 px, espaçamentos, alvo mínimo de 44 px, foco visível, áreas seguras) e o layout base com cabeçalho; verificar visualmente em 320 px e 375 px sem rolagem horizontal
- [x] 1.5 Desenhar o ícone em SVG e gerar ícones 192, 512, 512 maskable, apple-touch-icon 180 e favicon com `@vite-pwa/assets-generator`; verificar que os arquivos existem em `public/` e que o maskable mantém o desenho dentro da zona segura
- [x] 1.6 Configurar `vite-plugin-pwa` (`generateSW`, `autoUpdate`, precache do build) e o manifest (nome, `short_name`, `lang` pt-BR, `standalone`, cores, ícones); verificar no `npm run preview` que o manifest é válido e o service worker fica ativo no painel Application do navegador
- [x] 1.7 Implementar a tela `#/instalar` com passo a passo para Android (Chrome) e iOS (Safari), detecção de plataforma, botão "Instalar agora" via `beforeinstallprompt` e ocultação do convite em modo standalone; verificar as duas variantes simulando user agents de Android e iPhone
- [x] 1.8 Verificar o funcionamento offline: com `npm run preview`, abrir o app, ativar "Offline" no navegador e recarregar; o app deve abrir e navegar entre as rotas
- [x] 1.9 Adicionar à tela `#/instalar` a variante de computador (explica que funciona direto no navegador, mostra os passos de Android e iOS e só exibe "Instalar agora" quando o navegador oferecer); verificar em janela de computador no Chrome e em um navegador sem instalação de apps web (Firefox) que nada quebra

## 2. Evento e participantes

- [x] 2.1 Implementar em `src/core` os tipos do rascunho e as validações do evento (nome, data de hoje em diante, valor opcional positivo, mensagem até 280) com testes unitários cobrindo cada cenário da spec `evento-participantes`
- [x] 2.2 Implementar em `src/core` as regras de participantes (adicionar, editar, remover, limite de 50, nomes únicos ignorando maiúsculas/acentos/espaços, mínimo de 3) e de restrições simétricas por id (sem duplicatas, remoção em cascata) com testes unitários
- [x] 2.3 Implementar o armazenamento local versionado (`amigo-secreto:rascunho:v1`) com leitura defensiva e modo em memória quando `localStorage` falhar; verificar com testes de ida e volta, de dado corrompido e de armazenamento indisponível
- [x] 2.4 Criar os componentes base (`Botao`, `Campo` com rótulo e erro associado, `Dialogo` com `<dialog>`, `Passos`, `Aviso` com `aria-live`); verificar navegação por teclado e retorno de foco ao fechar o diálogo
- [x] 2.5 Implementar a tela do evento (`#/`) com os quatro campos, erros junto aos campos e avanço para participantes; verificar no navegador os cenários de nome em branco, data no passado e valor inválido
- [x] 2.6 Implementar a tela de participantes com adicionar, editar, remover (com confirmação), contagem e aviso de quantos faltam para 3; verificar no navegador os cenários de nome repetido e de remoção
- [x] 2.7 Implementar a tela de restrições (escolher duas pessoas, listar "A e B não se tiram", remover); verificar que restrição repetida não duplica e que remover participante limpa as restrições dele
- [x] 2.8 Ligar o rascunho ao estado (`useReducer` + Context) com gravação automática, restauração ao abrir, aviso de armazenamento indisponível e botão "Recomeçar" com confirmação; verificar que fechar e reabrir a aba mantém os dados e que "Recomeçar" apaga tudo

## 3. Motor de sorteio

- [x] 3.1 Implementar o gerador de inteiros sem viés com `crypto.getRandomValues` (rejeição do resto) e o Fisher-Yates com gerador injetável; verificar com testes: permutação preserva os elementos, faixa correta e distribuição aproximadamente uniforme das 6 permutações de 3 itens em 60.000 execuções
- [x] 3.2 Implementar `verificarViabilidade` com emparelhamento bipartido (Kuhn); verificar com testes de casos possíveis e impossíveis, incluindo 3 pessoas com um casal (impossível) e 4 pessoas com dois casais (possível)
- [x] 3.3 Implementar a extração do conjunto bloqueado (violação de Hall) e a montagem da explicação (pessoas sem opção, opções disponíveis, restrições envolvidas); verificar com testes dos cenários "não pode tirar ninguém" e "2 pessoas para 1 opção"
- [x] 3.4 Implementar `sortear` (amostragem por rejeição com limite de 5.000 tentativas e plano B por emparelhamento embaralhado); verificar com testes: ninguém tira a si mesmo, restrições respeitadas, cada pessoa sorteada uma vez, com 3 e com 20 participantes, e erro quando inviável
- [x] 3.5 Adicionar os testes de robustez: 10.000 execuções sem nenhuma violação em uma configuração com casais, teste de imparcialidade (frequências próximas para cada opção de cada participante) e teste do plano B forçado com gerador determinístico; verificar que `npm test` passa em tempo razoável (< 30 s)
- [x] 3.6 Implementar a tela `#/sortear`: resumo (evento, quantidade, restrições), botão "Sortear" quando viável e, quando inviável, a explicação com atalhos para remover as restrições indicadas; verificar no navegador que corrigir a restrição libera o sorteio

## 4. Resultados privados

- [x] 4.1 Implementar em `src/core` base64url, cifra e decifra AES-GCM (chave de 32 bytes e IV de 12 bytes aleatórios por link) e o formato `v1.<chave>.<dados>`; verificar com teste de ida e volta, inclusive com acentos e emoji
- [x] 4.2 Implementar a montagem do payload (código do sorteio, quem tirou, sorteado, evento, semente da própria lista de desejos e acesso de leitura à lista do sorteado) com preenchimento para tamanho igual em todos os links e a leitura validada que devolve `invalido` para qualquer falha; verificar com testes de link adulterado (um caractere trocado), link cortado, chave de outro link, versão desconhecida e links de mesmo comprimento
- [x] 4.3 Implementar a geração dos links a partir do sorteio (com código de 4 caracteres sem ambíguos), descartando o resultado em seguida, e o armazenamento `amigo-secreto:links:v1`; verificar com teste que o conteúdo salvo não contém nenhum nome de sorteado em texto legível
- [x] 4.4 Implementar a tela `#/links`: nome de cada participante, código do sorteio, contagem de enviados, botões "Enviar pelo WhatsApp" (`wa.me/?text=`), "Copiar link" (com alternativa manual) e "Compartilhar" (só com `navigator.share`), marcação de enviado; verificar no navegador que nenhum sorteado aparece, que a URL do WhatsApp contém a mensagem pronta codificada e que, no computador, ela abre em nova aba mantendo a lista de links aberta
- [x] 4.5 Implementar "Sou eu" com diálogo de confirmação e "Sortear de novo" com aviso sobre links antigos; verificar que cancelar não revela nada e que o novo sorteio troca o código
- [x] 4.6 Implementar a tela `#/ver/<payload>`: saudação, evento, botão de revelar, sorteado em destaque com data, valor e mensagem quando existirem, botão de ocultar e código do sorteio; verificar no navegador revelar/ocultar e o evento sem valor nem mensagem
- [x] 4.7 Implementar a tela de link inválido com mensagem amigável e orientação para pedir novo link; verificar adulterando um caractere de um link real na barra de endereços
- [x] 4.8 Mostrar na tela inicial o atalho "Ver links do último sorteio" quando houver lista salva; verificar fechando e reabrindo o app após um sorteio
- [x] 4.9 Implementar em `src/core` a lista de desejos: derivação HKDF de `token`, chave e `id` a partir da semente, validação dos limites (10 itens × 100 caracteres, observação de 200) e cifra/decifra do conteúdo; verificar com testes: derivação determinística, quem tem só `id` e chave decifra mas não obtém o `token`, ida e volta com acentos e conteúdo adulterado recusado
- [x] 4.10 Implementar em `servidor/listas.ts` o tratador puro da API (`GET` e `PUT /api/listas/<id>`) com a interface `Armazenamento` e o adaptador em memória; verificar com testes: 404 para lista inexistente, gravação aceita só quando `SHA-256(token) == id`, `id` malformado → 400, corpo acima de 8 kB recusado, 429 após 30 gravações por hora do mesmo IP, validade de 400 dias aplicada e `Cache-Control: no-store`
- [x] 4.11 Montar o tratador no Vite (`configureServer` e `configurePreviewServer`) com armazenamento em memória e criar o cliente HTTP da lista em `src/core` (ler, salvar, erros de rede → resultado amigável); verificar com `npm run dev` que salvar e ler uma lista funciona sem nenhuma conta externa
- [x] 4.12 Implementar o adaptador Upstash Redis e a entrada `api/listas/[id].ts` da função da Vercel, lendo as credenciais só de variáveis de ambiente; verificar com teste do adaptador usando um cliente Redis falso e com `npm run build` sem erros de tipo
- [x] 4.13 Implementar "Minha lista de desejos" na tela `#/ver/<payload>` (disponível antes de revelar): carregar a lista salva, adicionar e remover itens, observação, "Salvar minha lista", confirmação e data da última alteração; verificar no navegador os cenários de primeira lista, limite de 10 itens, item vazio e edição posterior
- [x] 4.14 Implementar "Lista de desejos de {sorteado}" na revelação: buscar só depois do toque de revelar, esconder ao ocultar, estados de carregando, lista, "ainda não escreveu" e erro com "Tentar de novo", botão "Atualizar" e nenhuma ação de edição; verificar com dois links do mesmo sorteio em abas diferentes que só quem sorteou vê a lista e que a alteração aparece após "Atualizar"
- [x] 4.15 Tratar falta de conexão na lista de desejos (aviso amigável, texto digitado preservado, revelação não bloqueada), garantir que `/api/*` não é cacheado pelo service worker e incluir no aviso de "Sortear de novo" que as listas precisarão ser preenchidas outra vez; verificar com o navegador em modo offline

## 5. Acabamento

- [x] 5.1 Implementar a troca de tema (seguir o aparelho por padrão, escolha manual lembrada, script inline para não piscar); verificar os dois temas em todas as telas e a persistência da escolha
- [x] 5.2 Revisar o contraste dos dois temas (4,5:1 texto, 3:1 texto grande e componentes) e ajustar os tokens; verificar com a auditoria de contraste do navegador sem nenhuma falha
- [x] 5.3 Revisar alvos de toque (≥ 44 × 44 px), espaçamentos, foco visível, ordem de foco, nomes acessíveis, `aria-live` nos avisos e na revelação; verificar percorrendo cada tela só com teclado e com a árvore de acessibilidade do navegador
- [x] 5.4 Aplicar `prefers-reduced-motion` a todas as animações e transições; verificar com a emulação de movimento reduzido que a revelação aparece sem animação
- [x] 5.5 Revisar todos os textos em `textos.ts` (tom caloroso, sem termos técnicos nem inglês, datas por extenso e valores em reais com `Intl`); verificar com teste unitário da formatação de data e valor e leitura completa de cada tela
- [x] 5.6 Verificar o layout em 320 px, 375 px e com fonte em 200%, e com teclado virtual aberto nos campos de nome; corrigir cortes e rolagem horizontal
- [x] 5.7 Ajustar o layout para computador (coluna centralizada de ~560 px, `:hover` só em `@media (hover: hover)`, Enter envia os formulários, Esc fecha diálogos); verificar em janelas de 1280 px e 1920 px e redimensionando até 320 px sem rolagem horizontal nem perda de dados

## 6. Qualidade

- [x] 6.1 Rodar `npm run verificar` e confirmar lint limpo, build sem avisos e a suíte completa passando, incluindo: ninguém tira a si mesmo, restrições respeitadas, impossíveis detectados, 3 e 20 participantes, 10.000 execuções sem violação, ida e volta da criptografia, link adulterado e os testes da lista de desejos (cifra, permissão de gravação e limites da API)
- [x] 6.2 Rodar o Lighthouse (mobile) sobre `npm run preview` e atingir ≥ 90 em Desempenho, Acessibilidade e Boas Práticas; corrigir o que ficar abaixo e guardar o resumo das notas para o README
- [x] 6.3 Conferir o checklist de PWA que substitui a antiga nota de PWA do Lighthouse (ver design D9): manifest válido, ícones 192/512/maskable, service worker ativo controlando a página, abertura offline e instalabilidade reconhecida pelo navegador
- [x] 6.4 Verificar o fluxo completo no navegador em viewport de celular (375 × 812): criar evento → adicionar participantes → criar restrição → provocar e corrigir um sorteio impossível → sortear → abrir um link em aba nova → revelar e ocultar → abrir link adulterado → "Recomeçar"
- [x] 6.5 Confirmar pelo painel de rede que nenhuma requisição carrega payload do link, chaves, nomes ou dados do evento, que as únicas requisições com dados são as de `/api/listas/<id>` com conteúdo cifrado e que não há chamadas a outros domínios; confirmar que o `localStorage` não contém os pares em texto legível
- [x] 6.6 Verificar o fluxo da lista de desejos em viewport de celular e de computador, com três links do mesmo sorteio: A salva a lista, quem tirou A vê a lista após revelar, o terceiro participante não tem como vê-la, a lista de links do organizador não mostra nada, e A edita e a mudança aparece após "Atualizar"
- [x] 6.7 Repetir o fluxo completo da 6.4 e da 6.6 em navegador de computador (janela de 1280 px, só com mouse e depois só com teclado) no Chrome, no Edge e no Firefox instalados na máquina, conferindo copiar link, WhatsApp em nova aba, ausência do botão "Compartilhar" onde não há suporte e abertura offline; registrar quais navegadores foram verificados e que o Safari de macOS não pôde ser testado nesta máquina

## 7. GitHub

- [x] 7.1 Escrever o `README.md` em português: o que é, como instalar no celular (Android e iPhone), como rodar e testar localmente, como funciona a lista de desejos, como funciona a privacidade (o que fica no aparelho, o que vai cifrado ao servidor e, com franqueza, os limites do modelo sem login), como configurar o banco Upstash para quem quiser publicar a própria cópia e melhorias futuras; verificar que os comandos documentados funcionam como escritos
- [x] 7.2 Adicionar `LICENSE` (MIT, com o nome do dono do projeto) e revisar o `.gitignore` (`node_modules`, `dist`, `dev-dist`, `.vercel`, arquivos de ambiente); verificar com `git status` que nada indevido está rastreado
- [x] 7.3 Verificar o login com `gh auth status`; **se não estiver autenticado, PAUSAR e pedir ao dono do projeto para rodar `gh auth login`**, retomando só depois da confirmação
- [x] 7.4 Revisar o histórico (commits em português no padrão Conventional Commits), criar o repositório público com `gh repo create amigo-secreto-familia --public --source . --push` e verificar com `gh repo view` que o repositório está público e com a `main` enviada

## 8. Publicação

- [x] 8.1 Adicionar `vercel.json` mínimo (framework Vite, build `npm run build`, saída `dist`; a pasta `api/` vira função automaticamente) e verificar que `npm run build` local continua gerando `dist/` com `sw.js` e o manifest
- [x] 8.2 Verificar o login com `vercel whoami` (via `npx vercel`); **se não estiver autenticado, PAUSAR e pedir ao dono do projeto para rodar `vercel login`**, retomando só depois da confirmação
- [x] 8.3 Criar o projeto na Vercel ligado ao repositório GitHub (deploy automático a cada push na `main`) e fazer o primeiro deploy de produção; **se a ligação com o GitHub exigir autorização no navegador, PAUSAR e pedir ao dono do projeto**; verificar que o deploy termina com sucesso e anotar a URL de produção
- [x] 8.4 Criar o banco Upstash Redis (plano gratuito) pela integração do Marketplace da Vercel e conectá-lo ao projeto; **como isso exige criar conta e aceitar termos no navegador, PAUSAR e pedir ao dono do projeto para fazer, informando o passo a passo**; depois da confirmação, verificar que as variáveis de ambiente do Redis existem no projeto (`vercel env ls`), sem exibir os valores, e refazer o deploy
- [x] 8.5 Verificar em produção: HTTPS ativo, manifest servido e válido, service worker registrado e controlando a página, app abrindo offline na segunda visita e `sw.js` sem cache longo
- [x] 8.6 Verificar em produção o fluxo real: gerar um sorteio, abrir um link de revelação direto em aba nova (sem ter aberto o app antes), revelar, e conferir que um link adulterado mostra a mensagem amigável; repetir a abertura do link em um navegador de computador
- [x] 8.7 Verificar em produção a lista de desejos: salvar uma lista por um link, ler pelo link de quem sorteou, conferir `GET /api/listas/<id inexistente>` → 404 e uma gravação com `token` errado recusada, e confirmar no painel do Upstash que o valor guardado é ilegível
- [x] 8.8 Colocar a URL de produção no `README.md` e na descrição do repositório (`gh repo edit --homepage`), fazer o commit e o push; verificar que o deploy automático é disparado e conclui

## Workflow follow-up

- Testar a instalação em um Android e em um iPhone reais da família (a verificação automatizada usa emulação).
- Se alguém da família tiver um Mac, abrir o app e um link de revelação no Safari de macOS.
- Arquivar a change depois da revisão e da publicação.
