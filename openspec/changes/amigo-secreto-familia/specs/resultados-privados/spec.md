# Spec Delta

## Purpose

Entrega a cada participante, de forma privada, o nome de quem ele tirou, por meio de um link individual cifrado que o organizador envia sem ficar sabendo o resultado, e que cada pessoa revela no próprio celular.

## ADDED Requirements

### Requirement: Link individual cifrado
Após o sorteio, o app DEVE (SHALL) gerar um link por participante no formato `https://<site>/#/ver/<payload>`, cujo conteúdo (quem tirou, quem foi sorteado, dados do evento, código do sorteio e os acessos às listas de desejos) é cifrado com AES-GCM usando uma chave aleatória exclusiva daquele link.

#### Scenario: Um link por pessoa
- **WHEN** o sorteio termina com 8 participantes
- **THEN** existem 8 links, um para cada participante, todos diferentes

#### Scenario: Conteúdo ilegível no link
- **WHEN** alguém lê o texto de um link
- **THEN** não encontra nomes de participantes nem dados do evento em texto legível

#### Scenario: Tamanho não denuncia o nome
- **WHEN** dois links do mesmo sorteio têm sorteados com nomes de tamanhos diferentes
- **THEN** os dois links têm o mesmo comprimento

### Requirement: Resultado nunca vai ao servidor
O app DEVE (SHALL) manter o conteúdo cifrado do link e a chave somente no fragmento (`#`) da URL e não enviar a nenhum servidor nomes, resultado do sorteio, chaves ou dados do evento. A única informação que sai do aparelho é o conteúdo cifrado das listas de desejos, conforme a capacidade `lista-de-desejos`.

#### Scenario: Abrir um link
- **WHEN** um participante abre o seu link
- **THEN** a requisição que carrega o site não contém o payload nem a chave
- **AND** nenhuma requisição carrega nomes, o resultado ou dados do evento

#### Scenario: Organizar e sortear
- **WHEN** o organizador cria o evento, cadastra participantes, sorteia e envia os links
- **THEN** nenhuma requisição com dados é feita a nenhum servidor

#### Scenario: Sem terceiros
- **WHEN** o app é usado do início ao fim
- **THEN** o navegador só faz requisições ao próprio endereço do app, nunca a serviços de análise, anúncios ou outros domínios

### Requirement: Lista de links do organizador
O app DEVE (SHALL) mostrar ao organizador uma lista com o nome de cada participante e as ações para enviar o link dele, sem mostrar quem cada um tirou. Nenhuma tela do app mostra todos os pares.

#### Scenario: Lista após o sorteio
- **WHEN** o organizador chega à lista de links
- **THEN** vê o nome de cada participante com os botões de envio e o código do sorteio
- **AND** não vê o nome do sorteado de ninguém

#### Scenario: Marcar como enviado
- **WHEN** o organizador envia o link de "Tio Zé" e marca como enviado
- **THEN** "Tio Zé" aparece como enviado e a lista mostra quantos ainda faltam

### Requirement: Compartilhamento do link
Para cada participante, o app DEVE (SHALL) oferecer "Enviar pelo WhatsApp" (abre o WhatsApp com uma mensagem pronta contendo o link), "Copiar link" e, quando o aparelho suportar, "Compartilhar" pelo menu nativo.

#### Scenario: Enviar pelo WhatsApp
- **WHEN** o organizador toca em "Enviar pelo WhatsApp" na linha de "Vó Maria"
- **THEN** o WhatsApp abre para escolher a conversa, com uma mensagem pronta que cita Vó Maria, o nome do evento e o link dela
- **AND** a mensagem não contém o nome do sorteado

#### Scenario: Enviar pelo WhatsApp no computador
- **WHEN** o organizador clica em "Enviar pelo WhatsApp" em um navegador de computador
- **THEN** o WhatsApp Web ou o aplicativo do WhatsApp do computador abre em nova aba ou janela com a mesma mensagem pronta
- **AND** a lista de links continua aberta na aba do app

#### Scenario: Copiar link
- **WHEN** o organizador toca em "Copiar link"
- **THEN** o link vai para a área de transferência e o app confirma "Link copiado"

#### Scenario: Compartilhamento nativo disponível
- **WHEN** o aparelho suporta compartilhamento nativo e o organizador toca em "Compartilhar"
- **THEN** o menu de compartilhamento do sistema abre com a mensagem e o link

#### Scenario: Compartilhamento nativo indisponível
- **WHEN** o aparelho não suporta compartilhamento nativo
- **THEN** o botão "Compartilhar" não é exibido e as outras opções continuam disponíveis

#### Scenario: Cópia bloqueada pelo navegador
- **WHEN** o navegador não permite copiar automaticamente
- **THEN** o app mostra o link selecionado para a pessoa copiar manualmente

### Requirement: Tela de revelação
Ao abrir um link válido, o app DEVE (SHALL) cumprimentar o participante pelo nome e mostrar o evento, mantendo o sorteado oculto até a pessoa tocar para revelar. Depois de revelado, mostra o sorteado em destaque, a data da troca, o valor sugerido e a mensagem (quando existirem), e permite ocultar de novo.

#### Scenario: Antes de revelar
- **WHEN** Ana abre o link dela
- **THEN** vê "Olá, Ana!", o nome do evento e um botão grande para revelar
- **AND** o nome do sorteado não aparece na tela

#### Scenario: Revelar
- **WHEN** Ana toca no botão de revelar
- **THEN** vê o nome de quem tirou em destaque, a data da troca e o valor sugerido

#### Scenario: Ocultar de novo
- **WHEN** Ana toca em "Ocultar" depois de revelar
- **THEN** o nome do sorteado some e o botão de revelar volta

#### Scenario: Evento sem valor nem mensagem
- **WHEN** o evento não tem valor sugerido nem mensagem
- **THEN** a tela não mostra esses campos nem espaços vazios no lugar

#### Scenario: Link aberto direto em aba nova
- **WHEN** o link é aberto em um navegador que nunca abriu o app
- **THEN** a tela de revelação carrega diretamente, sem passar pela tela do organizador

### Requirement: Link inválido
Quando o link está adulterado, incompleto, com chave errada ou em formato desconhecido, o app DEVE (SHALL) mostrar uma mensagem amigável, sem termos técnicos, orientando a pedir o link de novo a quem organizou, e não mostrar nenhum dado parcial.

#### Scenario: Link adulterado
- **WHEN** alguém altera um caractere do payload e abre o link
- **THEN** o app mostra "Este link não está funcionando" e sugere pedir um novo ao organizador
- **AND** nenhum nome é exibido

#### Scenario: Link cortado
- **WHEN** o link foi copiado pela metade
- **THEN** o app mostra a mesma mensagem amigável

#### Scenario: Chave errada
- **WHEN** o link é aberto com a chave de outro link
- **THEN** o app mostra a mesma mensagem amigável

### Requirement: Dados guardados após o sorteio
Do resultado do sorteio, o app DEVE (SHALL) guardar no aparelho do organizador apenas a lista de links gerados (participante, link, código do sorteio e marcação de enviado), para permitir o reenvio, e nada em formato que mostre os pares em texto legível.

#### Scenario: Reenviar depois
- **WHEN** o organizador fecha o app e o abre no dia seguinte
- **THEN** a lista de links do último sorteio está disponível para reenviar a quem perdeu o link

#### Scenario: Conteúdo guardado
- **WHEN** os dados guardados pelo app no aparelho são inspecionados
- **THEN** não há nenhuma tabela ou texto legível de quem tirou quem

### Requirement: Código do sorteio
Cada sorteio DEVE (SHALL) receber um código curto, mostrado na lista de links e na tela de revelação, para a família conferir se todos estão com links do mesmo sorteio.

#### Scenario: Conferência
- **WHEN** o organizador vê o código "K7P2" na lista de links e um participante abre o link dele
- **THEN** a tela de revelação desse participante mostra o mesmo código "K7P2"

### Requirement: Organizador também participa
O app DEVE (SHALL) permitir que o organizador abra o próprio link no mesmo aparelho, após confirmar que é aquela pessoa, sem revelar o resultado dos demais.

#### Scenario: Abrir o meu
- **WHEN** o organizador toca em "Sou eu" na própria linha e confirma "Você é a Ana?"
- **THEN** a tela de revelação de Ana é aberta

#### Scenario: Toque por engano
- **WHEN** o organizador toca em "Sou eu" na linha de outra pessoa e cancela a confirmação
- **THEN** nada é revelado e a lista continua na tela
