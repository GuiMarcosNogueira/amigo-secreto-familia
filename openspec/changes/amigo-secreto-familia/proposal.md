# Proposal

## Why

Todo fim de ano a família organiza o Amigo Secreto com papeizinhos ou com apps cheios de anúncios, cadastro e login, que os mais velhos e as crianças não conseguem usar. Queremos um app nosso, gratuito, em português, que funcione no celular de todo mundo e em que nem quem organiza fique sabendo quem tirou quem.

## What Changes

Projeto novo (repositório vazio). Esta change entrega a primeira versão completa:

- App web estático em português do Brasil, mobile-first, instalável como PWA (Android e iPhone), que funciona offline depois do primeiro acesso e traz uma tela de "Adicionar à tela inicial".
- Funciona também em navegadores de computador (Chrome, Edge, Firefox e Safari), com mouse e teclado, tanto para organizar quanto para abrir um link de revelação. O celular continua sendo a prioridade do desenho.
- Fluxo do organizador em passos: criar o evento (nome, data da troca, valor sugerido opcional, mensagem opcional), cadastrar participantes (mínimo 3, sem nomes repetidos) e marcar pares que não podem se tirar.
- Verificação de viabilidade antes do sorteio: se as restrições tornam o sorteio impossível, o app explica quem está sem opção e como corrigir.
- Sorteio justo e imparcial: ninguém tira a si mesmo, restrições respeitadas, aleatoriedade criptográfica.
- Distribuição privada: um link individual por participante (`https://<site>/#/ver/<payload>`), com conteúdo cifrado em AES-GCM e chave apenas no fragmento da URL. Envio por WhatsApp, cópia do link e compartilhamento nativo.
- Tela de revelação: toque para revelar, mostra o sorteado, valor e data, permite ocultar de novo; link adulterado mostra mensagem amigável.
- Lista de desejos: cada participante escreve e edita a própria lista pelo seu link, a qualquer momento, e só quem o sorteou consegue ler. As listas ficam em um servidor mínimo, cifradas de ponta a ponta: o servidor guarda apenas conteúdo ilegível, sem nomes.
- O organizador nunca vê os pares: só a lista de links para (re)enviar. Nenhuma tela mostra o resultado completo.
- Rascunho salvo no aparelho (localStorage) com botão "Recomeçar"; do resultado, só a lista de links fica guardada.
- Tema claro e escuro e acessibilidade (contraste, alvos de toque ≥ 44px, foco visível, labels, movimento reduzido).
- Repositório público no GitHub (`amigo-secreto-familia`, MIT) e publicação gratuita na Vercel.

Mudança em relação à ideia inicial: o app deixa de ser 100% estático. A lista de desejos exige um backend mínimo (uma função serverless e um banco chave-valor, ambos em plano gratuito). Evento, participantes, sorteio e links continuam acontecendo só no aparelho e funcionando offline.

Fora de escopo nesta versão: contas/login, qualquer dado no servidor além das listas cifradas, notificações (por exemplo, avisar quando a lista mudar), fotos ou links de lojas nos itens, múltiplos eventos simultâneos e revogação de links já enviados.

## Capabilities

### New Capabilities

- `instalacao-pwa`: instalação na tela inicial, instruções por plataforma (Android/Chrome e iOS/Safari), funcionamento offline e atualização do app.
- `evento-participantes`: cadastro do evento, dos participantes e das restrições entre pares, com validações e rascunho salvo no aparelho.
- `sorteio`: verificação de viabilidade, explicação de impossibilidade e sorteio justo respeitando as regras.
- `resultados-privados`: links individuais cifrados, lista de links do organizador, compartilhamento e tela de revelação.
- `lista-de-desejos`: lista de desejos de cada participante, escrita pelo próprio link e legível apenas por quem o sorteou, guardada cifrada no servidor.
- `acessibilidade-temas`: idioma e tom dos textos, temas claro/escuro, requisitos de acessibilidade e uso no celular e no computador, que valem para todas as telas.

### Modified Capabilities

Nenhuma (não há specs existentes).

## Impact

- **Código**: projeto novo na raiz do repositório (Vite + TypeScript + React, CSS simples, vite-plugin-pwa, Vitest, ESLint, Prettier). Nenhum código existente é afetado.
- **APIs do navegador**: Web Crypto (`crypto.getRandomValues`, `crypto.subtle` AES-GCM), Service Worker, Web App Manifest, `localStorage`, `navigator.share`, `navigator.clipboard`. Todas exigem HTTPS (garantido pela Vercel) ou `localhost`.
- **Backend**: uma função serverless na Vercel (`/api/listas/<id>`, leitura e gravação) e um banco Upstash Redis (plano gratuito, via integração da Vercel) guardando só as listas cifradas. Nova dependência de servidor: `@upstash/redis`.
- **Serviços externos**: GitHub (repositório público), Vercel (hospedagem e função, plano gratuito) e Upstash (banco, plano gratuito). O navegador só fala com o próprio endereço do app; o WhatsApp é aberto via link `wa.me`.
- **Custo**: continua zero dentro dos planos gratuitos, com folga enorme para o uso de uma família.
- **Privacidade**: nomes, evento e resultado nunca saem do aparelho, exceto dentro dos links que o próprio organizador envia. Ao servidor vão apenas as listas de desejos já cifradas, sob identificadores aleatórios. Sem analytics, sem cookies, sem terceiros.
- **Contas necessárias**: login no `gh` e na Vercel e criação do banco Upstash pelo dono do projeto durante a implementação (as tasks preveem pausa).
