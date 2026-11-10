# acessibilidade-temas Specification

## Purpose

Garante que qualquer pessoa da família, de crianças a idosos, consiga ler, entender e tocar em tudo no app: textos em português simples e caloroso, temas claro e escuro e cuidados de acessibilidade em todas as telas.

## Requirements

### Requirement: Textos em português simples
Toda a interface DEVE (SHALL) estar em português do Brasil, em tom caloroso e direto, sem termos técnicos nem palavras em inglês, com datas no formato brasileiro e valores em reais.

#### Scenario: Data e valor
- **WHEN** o evento tem data 24/12/2026 e valor 50
- **THEN** as telas mostram a data por extenso em português (por exemplo, "quinta-feira, 24 de dezembro de 2026") e o valor como "R$ 50,00"

#### Scenario: Mensagens de erro
- **WHEN** ocorre qualquer erro de validação ou de link
- **THEN** a mensagem diz o que aconteceu e o que fazer, sem códigos nem termos técnicos

### Requirement: Um passo por vez
O fluxo do organizador DEVE (SHALL) ser dividido em passos curtos (evento, participantes, restrições, sorteio), com indicação de em qual passo a pessoa está, uma ação principal em destaque por tela e possibilidade de voltar sem perder dados.

#### Scenario: Voltar um passo
- **WHEN** o organizador está no passo de restrições e volta para participantes
- **THEN** os participantes e as restrições já cadastrados continuam lá

#### Scenario: Ação principal
- **WHEN** qualquer tela do fluxo é exibida
- **THEN** há um único botão principal em destaque indicando o próximo passo

### Requirement: Tema claro e escuro
O app DEVE (SHALL) oferecer tema claro e tema escuro, seguindo a preferência do aparelho por padrão e permitindo trocar manualmente, lembrando a escolha.

#### Scenario: Seguir o aparelho
- **WHEN** o aparelho está em modo escuro e a pessoa nunca escolheu um tema no app
- **THEN** o app abre no tema escuro

#### Scenario: Escolha manual
- **WHEN** a pessoa escolhe o tema claro no app e o abre de novo depois
- **THEN** o app abre no tema claro, mesmo com o aparelho em modo escuro

### Requirement: Contraste e legibilidade
Nos dois temas, textos e elementos de interface DEVEM (MUST) atender ao contraste mínimo WCAG AA (4,5:1 para texto normal, 3:1 para texto grande e componentes), com texto base de pelo menos 18 px e respeito ao tamanho de fonte configurado no aparelho.

#### Scenario: Contraste nos dois temas
- **WHEN** as telas são auditadas nos temas claro e escuro
- **THEN** nenhum texto ou controle fica abaixo do contraste mínimo

#### Scenario: Fonte ampliada
- **WHEN** a pessoa usa fonte ampliada em 200% no aparelho ou no navegador
- **THEN** todo o conteúdo continua legível e utilizável, sem texto cortado nem rolagem horizontal

### Requirement: Alvos de toque
Todo controle interativo DEVE (MUST) ter área de toque de pelo menos 44 × 44 px, com espaçamento que evite toques por engano em ações vizinhas.

#### Scenario: Botões da lista
- **WHEN** a lista de participantes ou de links é exibida em um celular de 360 px de largura
- **THEN** cada botão tem pelo menos 44 × 44 px de área de toque e não se sobrepõe ao vizinho

### Requirement: Teclado e leitor de tela
Todo o app DEVE (SHALL) ser utilizável por teclado e por leitor de tela: foco sempre visível, ordem de foco lógica, campos com rótulo, botões com nome acessível, erros associados aos campos e avisos dinâmicos anunciados.

#### Scenario: Navegação por teclado
- **WHEN** a pessoa percorre uma tela usando apenas o teclado
- **THEN** o foco é sempre visível e passa por todos os controles em ordem lógica

#### Scenario: Erro anunciado
- **WHEN** um campo é recusado na validação
- **THEN** o leitor de tela anuncia a mensagem de erro associada ao campo

#### Scenario: Revelação anunciada
- **WHEN** o participante toca para revelar usando leitor de tela
- **THEN** o nome do sorteado é anunciado

#### Scenario: Diálogo de confirmação
- **WHEN** um diálogo de confirmação é aberto
- **THEN** o foco vai para o diálogo, fica contido nele e volta ao botão de origem ao fechar

### Requirement: Movimento reduzido
O app DEVE (SHALL) respeitar a preferência de movimento reduzido do aparelho, removendo animações e transições não essenciais.

#### Scenario: Preferência ativada
- **WHEN** o aparelho está com movimento reduzido ativado e o participante revela o sorteado
- **THEN** o nome aparece imediatamente, sem animação

### Requirement: Uso no celular
Todas as telas DEVEM (MUST) funcionar em celulares a partir de 320 px de largura, em retrato, sem rolagem horizontal e respeitando as áreas seguras do aparelho (entalhe e barra inferior).

#### Scenario: Tela pequena
- **WHEN** o app é aberto em uma tela de 320 px de largura
- **THEN** todo o conteúdo cabe na largura e os botões principais ficam acessíveis

#### Scenario: Teclado virtual aberto
- **WHEN** a pessoa digita um nome com o teclado virtual aberto
- **THEN** o campo em edição e o botão de confirmar continuam visíveis

### Requirement: Uso no computador
Todas as telas e funções DEVEM (MUST) funcionar nas versões atuais dos navegadores de computador Chrome, Edge, Firefox e Safari, com mouse e teclado, sem depender de toque nem de instalação. Em telas largas, o conteúdo fica em uma coluna centralizada de largura confortável para leitura.

#### Scenario: Organizar pelo computador
- **WHEN** o organizador usa o app em um navegador de computador, do evento até a lista de links
- **THEN** todos os passos funcionam com mouse e teclado, incluindo o sorteio e a cópia dos links

#### Scenario: Revelar pelo computador
- **WHEN** um participante abre o seu link em um navegador de computador
- **THEN** a tela de revelação funciona e o botão de revelar responde a clique e às teclas Enter e Espaço

#### Scenario: Tela larga
- **WHEN** o app é aberto em uma janela de 1280 px de largura ou mais
- **THEN** o conteúdo aparece em uma coluna centralizada, sem linhas de texto esticadas nem botões da largura da janela

#### Scenario: Janela redimensionada
- **WHEN** a pessoa estreita a janela do navegador até a largura de um celular
- **THEN** o layout se ajusta sem rolagem horizontal e sem perder dados digitados

#### Scenario: Enviar formulário pelo teclado
- **WHEN** a pessoa digita um nome de participante e pressiona Enter
- **THEN** o participante é adicionado, como se tivesse clicado no botão

#### Scenario: Nada depende de passar o mouse
- **WHEN** qualquer tela é usada em um aparelho sem mouse
- **THEN** nenhuma informação ou ação fica acessível apenas ao passar o ponteiro sobre um elemento
