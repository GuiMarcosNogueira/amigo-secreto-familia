# sorteio Specification

## Purpose

Define quem tira quem no Amigo Secreto de forma justa e imprevisível, respeitando as restrições da família, e avisa com clareza quando as regras escolhidas tornam o sorteio impossível.

## Requirements

### Requirement: Sorteio válido
O sorteio DEVE (SHALL) atribuir a cada participante exatamente uma pessoa para presentear, de modo que cada participante seja sorteado exatamente uma vez, ninguém tire a si mesmo e nenhum par restrito se tire.

#### Scenario: Três participantes sem restrições
- **WHEN** o sorteio é feito com Ana, Beto e Caio
- **THEN** cada um tira exatamente uma pessoa diferente de si
- **AND** cada um é tirado por exatamente uma pessoa

#### Scenario: Vinte participantes com casais
- **WHEN** o sorteio é feito com 20 participantes e vários casais restritos
- **THEN** ninguém tira a si mesmo e nenhuma pessoa tira o próprio par restrito

#### Scenario: Muitas execuções
- **WHEN** o sorteio é executado 10.000 vezes com uma configuração possível
- **THEN** nenhuma execução produz alguém tirando a si mesmo, um par restrito ou uma pessoa sorteada duas vezes

### Requirement: Sorteio imparcial
O sorteio DEVE (SHALL) usar aleatoriedade criptográfica do aparelho, sem viés, de forma que todo resultado válido possa acontecer e nenhum participante seja favorecido de forma perceptível.

#### Scenario: Resultados variam
- **WHEN** o sorteio é repetido muitas vezes com os mesmos participantes
- **THEN** resultados diferentes aparecem
- **AND** para cada participante, todas as pessoas que ele pode tirar aparecem com frequências próximas entre si

#### Scenario: Configuração apertada
- **WHEN** as restrições deixam poucas soluções válidas
- **THEN** o sorteio ainda termina com um resultado válido, sem travar o aparelho

### Requirement: Verificação de viabilidade
O app DEVE (SHALL) verificar, antes de sortear, se existe pelo menos um resultado válido para os participantes e restrições atuais, e só sortear quando existir. Um sorteio possível nunca pode ser dado como impossível, nem o contrário.

#### Scenario: Configuração possível
- **WHEN** o organizador pede o sorteio e existe pelo menos um resultado válido
- **THEN** o sorteio é realizado

#### Scenario: Configuração impossível
- **WHEN** há 3 participantes (Ana, Beto e Caio) e Ana e Beto não podem se tirar
- **THEN** o sorteio não é realizado e o app informa que, com essas regras, não dá para sortear

### Requirement: Explicação de impossibilidade
Quando o sorteio é impossível, o app DEVE (SHALL) explicar em linguagem simples quais pessoas ficaram sem opções suficientes, citar as restrições envolvidas e sugerir como corrigir (remover uma dessas restrições ou adicionar participantes).

#### Scenario: Pessoa sem ninguém para tirar
- **WHEN** as restrições de "Vó Maria" a impedem de tirar todos os outros participantes
- **THEN** o app informa que "Vó Maria não pode tirar ninguém"
- **AND** lista as restrições de Vó Maria com atalho para removê-las

#### Scenario: Grupo disputando poucas opções
- **WHEN** Ana e Beto só podem tirar Caio
- **THEN** o app informa que Ana e Beto só têm Caio para tirar, e são 2 pessoas para 1 opção
- **AND** sugere remover uma restrição de Ana ou de Beto, ou adicionar mais participantes

#### Scenario: Correção libera o sorteio
- **WHEN** o organizador remove a restrição indicada e pede o sorteio de novo
- **THEN** o sorteio é realizado

### Requirement: Resultado não exposto ao organizador
O app DEVE (SHALL) usar o resultado do sorteio apenas para gerar os links individuais, sem exibi-lo em nenhuma tela, mensagem ou registro, e descartá-lo em seguida.

#### Scenario: Depois de sortear
- **WHEN** o sorteio termina
- **THEN** o organizador é levado direto à lista de links
- **AND** nenhuma tela mostra quem tirou quem

### Requirement: Sortear de novo
O app DEVE (SHALL) permitir refazer o sorteio, avisando antes que os links já enviados continuam abrindo o resultado antigo e que todos precisarão receber os links novos.

#### Scenario: Novo sorteio confirmado
- **WHEN** o organizador pede para sortear de novo e confirma o aviso
- **THEN** um novo sorteio é feito e a lista de links é substituída pela nova
- **AND** o novo sorteio recebe um código diferente do anterior

#### Scenario: Novo sorteio cancelado
- **WHEN** o organizador cancela o aviso
- **THEN** a lista de links atual é mantida
