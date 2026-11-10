# Spec Delta

## Purpose

Permite que cada participante escreva, pelo próprio link, uma lista de desejos que somente a pessoa que o sorteou consegue ler, ajudando na escolha do presente sem estragar o segredo.

## ADDED Requirements

### Requirement: Escrever a própria lista
Na tela aberta pelo seu link, cada participante DEVE (SHALL) poder escrever a própria lista de desejos, com até 10 itens de até 100 caracteres cada e uma observação opcional de até 200 caracteres (tamanhos, cores, o que não quer ganhar), sem precisar revelar antes quem tirou.

#### Scenario: Primeira lista
- **WHEN** Ana abre o link dela, adiciona "Livro de receitas" e "Meias quentinhas" e toca em "Salvar minha lista"
- **THEN** o app confirma "Lista salva" e mostra os dois itens

#### Scenario: Limite de itens
- **WHEN** Ana já tem 10 itens na lista
- **THEN** o app não permite adicionar o 11º e explica que o limite é de 10 itens

#### Scenario: Item vazio
- **WHEN** Ana tenta adicionar um item vazio ou só com espaços
- **THEN** nada é adicionado

#### Scenario: Lista sem revelar
- **WHEN** Ana ainda não tocou para revelar quem tirou
- **THEN** ela já consegue escrever e salvar a própria lista

### Requirement: Editar a lista depois
O participante DEVE (SHALL) poder voltar ao seu link a qualquer momento para ver a lista que salvou, alterar, remover itens ou apagar tudo, valendo sempre a última versão salva.

#### Scenario: Voltar outro dia
- **WHEN** Ana abre o link dela dias depois, em qualquer aparelho
- **THEN** vê a lista que salvou e a data da última alteração

#### Scenario: Alterar
- **WHEN** Ana remove "Meias quentinhas", adiciona "Caneca" e salva
- **THEN** a lista passa a ter "Livro de receitas" e "Caneca"

#### Scenario: Apagar tudo
- **WHEN** Ana remove todos os itens e a observação e salva
- **THEN** a lista dela volta a ficar vazia para quem a sorteou

### Requirement: Só quem sorteou vê a lista
A lista de desejos de um participante DEVE (MUST) poder ser lida apenas pelo próprio participante e pela pessoa que o sorteou. Nenhum outro link, nenhuma tela do organizador e nenhum endereço público permitem ler a lista.

#### Scenario: Quem sorteou vê
- **WHEN** Beto, que tirou Ana, abre o link dele e toca para revelar
- **THEN** vê, abaixo do nome de Ana, a lista de desejos que ela salvou

#### Scenario: Antes de revelar
- **WHEN** Beto abre o link dele e ainda não tocou para revelar
- **THEN** a lista de desejos de Ana não aparece na tela

#### Scenario: Outro participante não vê
- **WHEN** Caio, que não tirou Ana, usa o link dele
- **THEN** não existe nenhum caminho no app para ver a lista de Ana

#### Scenario: Organizador não vê
- **WHEN** o organizador está na lista de links
- **THEN** nenhuma lista de desejos é mostrada, nem se alguém já preencheu a sua

#### Scenario: Dado guardado sem a chave
- **WHEN** alguém obtém o conteúdo guardado no servidor sem ter o link de Ana nem o de Beto
- **THEN** não consegue ler os itens nem descobrir de quem é a lista

### Requirement: Lista do sorteado sempre atual
Quem sorteou DEVE (SHALL) ver a versão mais recente da lista ao revelar, e poder atualizá-la com um toque, com a indicação de quando a lista foi alterada pela última vez.

#### Scenario: Lista alterada depois
- **WHEN** Ana altera a lista depois de Beto já ter visto, e Beto toca em "Atualizar"
- **THEN** Beto vê a lista nova e a data da alteração

#### Scenario: Lista ainda não escrita
- **WHEN** Beto revela e Ana ainda não salvou nenhuma lista
- **THEN** o app mostra "Ana ainda não escreveu a lista de desejos. Volte mais tarde!" em vez de um erro

### Requirement: Só o dono altera a lista
A lista de um participante DEVE (MUST) poder ser alterada somente a partir do link do próprio participante. Quem sorteou consegue ler, mas não alterar.

#### Scenario: Quem sorteou não edita
- **WHEN** Beto vê a lista de Ana
- **THEN** não há nenhuma ação para alterar ou apagar a lista dela

#### Scenario: Tentativa direta de gravação
- **WHEN** alguém que conhece apenas o endereço de leitura da lista de Ana tenta gravar nele
- **THEN** o servidor recusa e a lista de Ana não muda

### Requirement: Conteúdo cifrado no servidor
O conteúdo da lista DEVE (MUST) ser cifrado no aparelho antes de ser enviado, e o servidor guardar apenas esse conteúdo cifrado, sem nomes, sem dados do evento e sem as chaves.

#### Scenario: O que trafega
- **WHEN** Ana salva a lista
- **THEN** a requisição enviada contém apenas um identificador aleatório e o conteúdo cifrado
- **AND** não contém o nome de Ana, o nome do evento nem a chave que abre a lista

### Requirement: Lista sem conexão ou com falha
Quando não há internet ou o servidor falha, o app DEVE (SHALL) avisar com uma mensagem amigável, manter na tela o que a pessoa escreveu e permitir tentar de novo, sem impedir a revelação do sorteado.

#### Scenario: Salvar sem internet
- **WHEN** Ana toca em "Salvar minha lista" sem conexão
- **THEN** o app avisa que não conseguiu salvar e que é preciso internet
- **AND** os itens digitados continuam na tela, com um botão para tentar de novo

#### Scenario: Revelar sem internet
- **WHEN** Beto revela o sorteado sem conexão
- **THEN** o nome de Ana, a data e o valor aparecem normalmente
- **AND** no lugar da lista aparece um aviso de que ela precisa de internet, com um botão "Tentar de novo"

### Requirement: Limites e validade das listas
O servidor DEVE (SHALL) recusar conteúdo acima do tamanho máximo de uma lista e gravações em excesso vindas do mesmo endereço, e apagar automaticamente as listas que ficarem 400 dias sem alteração.

#### Scenario: Conteúdo grande demais
- **WHEN** alguém envia ao servidor um conteúdo maior que o limite de uma lista
- **THEN** o servidor recusa e nada é guardado

#### Scenario: Gravações em excesso
- **WHEN** o mesmo endereço de rede faz gravações muito acima do uso normal em pouco tempo
- **THEN** o servidor passa a recusar temporariamente e o app pede para tentar mais tarde

#### Scenario: Lista antiga
- **WHEN** uma lista fica 400 dias sem ser alterada
- **THEN** ela é apagada do servidor

### Requirement: Listas e novo sorteio
Cada sorteio DEVE (SHALL) começar com listas de desejos vazias, e o aviso de "Sortear de novo" informar que as listas já escritas precisarão ser preenchidas outra vez pelos links novos.

#### Scenario: Sortear de novo com listas preenchidas
- **WHEN** o organizador pede para sortear de novo
- **THEN** o aviso de confirmação informa que os links antigos e as listas de desejos escritas por eles deixam de valer para o novo sorteio

#### Scenario: Link novo
- **WHEN** Ana abre o link novo depois de um novo sorteio
- **THEN** a lista dela aparece vazia, pronta para ser preenchida
