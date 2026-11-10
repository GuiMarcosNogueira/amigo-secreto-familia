# instalacao-pwa Specification

## Purpose

Permite que a família use o Amigo Secreto como um app na tela inicial do celular, sem loja de aplicativos, e que ele continue abrindo mesmo sem internet depois do primeiro acesso.

## Requirements

### Requirement: App instalável
O app DEVE (SHALL) ser reconhecido como instalável pelo Chrome no Android e poder ser adicionado à tela inicial pelo Safari no iOS, com nome, cor de tema e ícones próprios (192 px, 512 px e versão maskable), abrindo em tela cheia sem a barra do navegador.

#### Scenario: Instalação no Android
- **WHEN** a pessoa abre o site no Chrome do Android e escolhe instalar
- **THEN** o app aparece na tela inicial com o nome "Amigo Secreto" e o ícone do app
- **AND** ao abrir pelo ícone, ele ocupa a tela inteira, sem barra de endereço

#### Scenario: Ícone no iPhone
- **WHEN** a pessoa usa "Adicionar à Tela de Início" no Safari do iPhone
- **THEN** o atalho criado usa o ícone e o nome do app
- **AND** ao abrir pelo atalho, o app ocupa a tela inteira

#### Scenario: Ícone adaptável
- **WHEN** o Android aplica uma máscara circular ou arredondada ao ícone
- **THEN** o desenho do ícone continua inteiro, sem cortes

### Requirement: Instruções de instalação
O app DEVE (SHALL) oferecer uma tela "Instalar no celular" com o passo a passo ilustrado para Android (Chrome) e para iOS (Safari), mostrando primeiro as instruções do aparelho em uso e permitindo ver as do outro.

#### Scenario: Pessoa no iPhone
- **WHEN** a pessoa abre a tela de instalação em um iPhone
- **THEN** vê primeiro os passos do Safari: tocar em Compartilhar e depois em "Adicionar à Tela de Início"
- **AND** pode alternar para ver os passos do Android

#### Scenario: Pessoa no Android com instalação direta
- **WHEN** a pessoa abre a tela de instalação no Chrome do Android e o navegador permite instalar
- **THEN** vê um botão "Instalar agora" que abre a confirmação de instalação do navegador
- **AND** vê também o passo a passo pelo menu do Chrome, caso o botão não apareça

#### Scenario: App já instalado
- **WHEN** a pessoa abre o app pelo ícone da tela inicial
- **THEN** o convite para instalar não é mostrado na tela inicial do app

#### Scenario: Pessoa no computador
- **WHEN** a pessoa abre a tela de instalação em um navegador de computador
- **THEN** o app explica que no computador ele funciona direto no navegador, sem instalar
- **AND** mostra os passos de Android e de iOS para quem quiser instalar no celular
- **AND** oferece o botão "Instalar agora" quando o navegador do computador permitir instalar

### Requirement: Uso sem instalação
O app DEVE (SHALL) funcionar por completo direto no navegador, no celular ou no computador, sem exigir instalação, inclusive em navegadores que não oferecem instalação de apps web.

#### Scenario: Navegador sem instalação
- **WHEN** a pessoa usa o app em um navegador de computador que não permite instalar apps web
- **THEN** todas as funções estão disponíveis e nenhum erro ou convite de instalação quebrado é exibido

#### Scenario: Offline no computador
- **WHEN** a pessoa já abriu o app em um navegador de computador e o abre de novo sem conexão
- **THEN** o app carrega normalmente

### Requirement: Funcionamento offline
O app DEVE (SHALL) abrir e funcionar sem conexão depois do primeiro acesso com internet, incluindo criar evento, sortear, gerar links e abrir um link de revelação. Apenas ler e salvar listas de desejos exige internet.

#### Scenario: Abrir sem internet
- **WHEN** a pessoa já abriu o app uma vez e o abre de novo sem conexão
- **THEN** o app carrega normalmente e o rascunho salvo aparece

#### Scenario: Sortear sem internet
- **WHEN** o organizador faz o sorteio sem conexão
- **THEN** o sorteio acontece e os links são gerados normalmente

#### Scenario: Revelar sem internet
- **WHEN** um participante que já abriu o app antes abre o seu link de revelação sem conexão
- **THEN** a tela de revelação funciona normalmente

### Requirement: Atualização do app
O app DEVE (SHALL) buscar versões novas quando houver conexão e passar a usá-las sem exigir nenhuma ação da pessoa e sem apagar os dados salvos no aparelho.

#### Scenario: Nova versão publicada
- **WHEN** uma nova versão foi publicada e a pessoa abre o app com internet
- **THEN** a nova versão passa a ser usada, no máximo, na abertura seguinte
- **AND** o rascunho e a lista de links salvos continuam disponíveis
