# Spec Delta

## Purpose

Permite que o organizador prepare o Amigo Secreto no próprio celular: descreve o evento, cadastra quem participa e marca quem não pode tirar quem, com tudo guardado como rascunho no aparelho.

## ADDED Requirements

### Requirement: Cadastro do evento
O app DEVE (SHALL) permitir informar o nome do evento (obrigatório, até 60 caracteres), a data da troca (obrigatória), o valor sugerido do presente em reais (opcional) e uma mensagem para os participantes (opcional, até 280 caracteres).

#### Scenario: Evento completo
- **WHEN** o organizador informa o nome "Natal 2026", a data 24/12/2026, o valor R$ 50,00 e uma mensagem
- **THEN** o app aceita os dados e libera o passo de participantes

#### Scenario: Só o obrigatório
- **WHEN** o organizador informa apenas o nome e a data
- **THEN** o app aceita os dados sem exigir valor nem mensagem

#### Scenario: Nome em branco
- **WHEN** o organizador tenta avançar sem nome do evento
- **THEN** o app não avança e mostra, junto ao campo, a mensagem "Dê um nome para o evento"

#### Scenario: Data ausente ou no passado
- **WHEN** o organizador tenta avançar sem data ou com uma data anterior a hoje
- **THEN** o app não avança e explica, junto ao campo, que é preciso escolher uma data de hoje em diante

#### Scenario: Valor inválido
- **WHEN** o organizador digita um valor negativo, zero ou que não é número
- **THEN** o app não avança e pede um valor válido ou que o campo fique vazio

### Requirement: Gestão de participantes
O app DEVE (SHALL) permitir adicionar, editar e remover participantes pelo nome (até 40 caracteres), mostrando a lista e a contagem atual, com limite de 50 participantes.

#### Scenario: Adicionar participante
- **WHEN** o organizador digita "Vó Maria" e confirma
- **THEN** "Vó Maria" aparece na lista e o campo fica pronto para o próximo nome

#### Scenario: Editar participante
- **WHEN** o organizador altera "Vó Maria" para "Vovó Maria"
- **THEN** a lista mostra o novo nome
- **AND** as restrições que envolviam essa pessoa continuam valendo com o novo nome

#### Scenario: Remover participante
- **WHEN** o organizador remove um participante e confirma
- **THEN** a pessoa sai da lista
- **AND** as restrições que a envolviam são removidas

#### Scenario: Nome vazio
- **WHEN** o organizador confirma um nome vazio ou só com espaços
- **THEN** nada é adicionado e o app pede para digitar um nome

### Requirement: Nomes únicos
O app DEVE (SHALL) impedir dois participantes com o mesmo nome, comparando sem diferenciar maiúsculas, acentos e espaços nas pontas.

#### Scenario: Nome repetido
- **WHEN** já existe "José" e o organizador tenta adicionar " jose "
- **THEN** o app não adiciona e sugere diferenciar, por exemplo "José (tio)"

#### Scenario: Edição que cria duplicata
- **WHEN** o organizador edita "Ana Paula" para "Ana" e já existe "Ana"
- **THEN** a edição não é aceita e o nome anterior é mantido

### Requirement: Mínimo de participantes
O app DEVE (SHALL) exigir pelo menos 3 participantes para liberar o sorteio.

#### Scenario: Menos de três
- **WHEN** há 2 participantes cadastrados
- **THEN** o sorteio fica indisponível e o app informa que falta 1 pessoa para poder sortear

#### Scenario: Três ou mais
- **WHEN** há 3 ou mais participantes cadastrados
- **THEN** o app permite seguir para as restrições e para o sorteio

### Requirement: Restrições entre pares
O app DEVE (SHALL) permitir marcar pares de participantes que não podem se tirar. Cada restrição vale nos dois sentidos, e a lista de restrições pode ser consultada e desfeita a qualquer momento antes do sorteio. As restrições são opcionais.

#### Scenario: Marcar um casal
- **WHEN** o organizador marca que "Ana" e "Beto" não podem se tirar
- **THEN** a restrição aparece na lista como "Ana e Beto não se tiram"
- **AND** vale tanto para Ana tirar Beto quanto para Beto tirar Ana

#### Scenario: Restrição repetida
- **WHEN** o organizador tenta marcar "Beto" e "Ana" e essa restrição já existe
- **THEN** nenhuma restrição duplicada é criada

#### Scenario: Remover restrição
- **WHEN** o organizador remove a restrição entre "Ana" e "Beto"
- **THEN** ela some da lista e os dois voltam a poder se tirar

#### Scenario: Sem restrições
- **WHEN** o organizador não marca nenhuma restrição
- **THEN** o app permite seguir para o sorteio normalmente

### Requirement: Rascunho salvo no aparelho
O app DEVE (SHALL) guardar automaticamente no aparelho os dados do evento, os participantes e as restrições, e restaurá-los quando o app for aberto de novo.

#### Scenario: Fechar e reabrir
- **WHEN** o organizador cadastra evento e participantes, fecha o app e abre de novo
- **THEN** os dados aparecem como estavam

#### Scenario: Armazenamento indisponível
- **WHEN** o navegador não permite guardar dados (por exemplo, navegação privada)
- **THEN** o app continua funcionando e avisa que os dados serão perdidos ao fechar

#### Scenario: Rascunho corrompido
- **WHEN** os dados guardados não podem ser lidos
- **THEN** o app abre com um evento em branco, sem mostrar erro técnico

### Requirement: Recomeçar
O app DEVE (SHALL) oferecer um botão "Recomeçar" que, após confirmação, apaga do aparelho o rascunho e a lista de links gerados.

#### Scenario: Recomeçar confirmado
- **WHEN** o organizador toca em "Recomeçar" e confirma
- **THEN** evento, participantes, restrições e links guardados são apagados
- **AND** o app volta ao primeiro passo em branco

#### Scenario: Recomeçar cancelado
- **WHEN** o organizador toca em "Recomeçar" e cancela
- **THEN** nada é apagado
