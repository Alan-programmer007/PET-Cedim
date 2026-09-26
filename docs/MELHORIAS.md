# Relação de melhorias

Levantamento do Sistema de Anamneses CEDIM em **23/09/2026**.

Todos os itens marcados como *verificado* foram reproduzidos por execução real contra a aplicação
rodando, não deduzidos por leitura de código. Os demais vêm de análise do código e estão marcados
como tal.

**Nenhum código de aplicação foi alterado neste levantamento.** As únicas mudanças feitas estão na
seção [Alterações de documentação](#alterações-de-documentação-feitas-nesta-passagem), ao final.

## Sumário por prioridade

| | Tema | Itens | Situação |
|---|---|---|---|
| **A** | Segurança | 7 | 🟠 A1–A4 e A7 resolvidos; A5 e A6 em aberto |
| **B** | Defeitos funcionais | 7 | 🟠 afeta o usuário |
| **C** | Desempenho e modelo de dados | 4 | 🟠 impede crescer |
| **D** | Documentação | 7 | 🟡 4 resolvidos aqui |
| **E** | Qualidade e manutenção | 7 | 🟢 dívida técnica |

---

## A. Segurança

> Enquanto A1 não for resolvido, o sistema **não deve receber dado de paciente real**, nem em rede
> interna.

### A1 — Bypass total de autenticação 🔴 *verificado* — ✅ **resolvido em 25/09/2026**

`middleware.js:4-5` verifica apenas se o cookie `token` **existe**; nunca valida a assinatura do
JWT. Nenhuma rota de API refaz a verificação por conta própria — só `/api/auth/me` valida, e ela
não protege nada.

Reproduzido:

```
curl -H 'Cookie: token=isso_nao_e_um_jwt' /api/anamneses     → 200
curl -H 'Cookie: token=qualquer_coisa' -X POST /api/save-anamnese → 200 (gravou no banco)
```

Qualquer pessoa que defina um cookie arbitrário lê e escreve prontuário.

**Correção aplicada:** `lib/auth.js` centraliza a verificação com `jose` (Web Crypto, funciona no Edge
e no Node). O `middleware.js` valida a assinatura e devolve `401` em JSON para `/api/*` — antes
redirecionava, o que fazia o `fetch` receber HTML. Cada rota de anamnese refaz a verificação por
conta própria, porque middleware não é fronteira de segurança suficiente sozinho.

Verificado com um JWT bem formado assinado com chave errada: `401` nas rotas de API e `307` nas
páginas.

### A2 — Exclusão arbitrária de arquivos 🔴 *verificado* — ✅ **resolvido em 25/09/2026**

`app/api/delete-anamnese/route.js:11` monta `path.join(process.cwd(),'public','anamneses', id + '.jpg')`
sem sanitizar `id`. Um `id` com `../` sai do diretório. Confirmado apagando um arquivo-isca fora do
projeto.

Agravante: **a rota é código morto**, resquício da versão que gravava em disco. Nenhuma tela a chama.

**Correção aplicada:** a pasta `app/api/delete-anamnese/` foi removida. Como nenhuma tela a chamava,
a remoção não altera o comportamento do sistema.

### A3 — Vazamento de stack trace 🟠 *verificado* — ✅ **resolvido em 25/09/2026**

`app/api/save-anamnese/route.js:26` devolve `err.message` no campo `details`. Com `id` duplicado, a
resposta expõe caminho absoluto do servidor, estrutura de chunks e o ORM.

**Correção aplicada:** o erro completo vai para `console.error` e o cliente recebe apenas a mensagem.

### A4 — Credenciais de teste em repositório público 🟠 *verificado* — ✅ **resolvido em 25/09/2026**

O `README.md` publica e-mail e senha do usuário criado pelo seed. Quem encontrar o repositório tem a
credencial de qualquer instalação que não a tenha trocado.

O aviso no README, acrescentado na passagem anterior, não bastava: as credenciais publicadas eram o
**padrão do código**, não um exemplo no texto.

```js
// como era, prisma/seed.js
const email = process.env.SEED_EMAIL || 'petsdcedim@gmail.com';
const plainPassword = process.env.SEED_PASSWORD || '1234567cedim';
```

Pior, o `docker-compose.prod.yml` repassa `SEED_EMAIL: ${SEED_EMAIL}` mesmo quando a variável não
existe no host — o Compose entrega **string vazia**, que é falsy em JS e cai direto no `||`. Uma
implantação real sem as variáveis criava o administrador com a senha publicada, sem nada falhar.

**Correção aplicada:** `prisma/seed.js` passou a tratar string vazia como ausente e a distinguir
ambiente:

| Situação | Comportamento |
|---|---|
| `NODE_ENV=production`, sem as variáveis | encerra com erro, sem criar usuário |
| `NODE_ENV=production`, `SEED_PASSWORD` repetindo a senha publicada | encerra com erro |
| `NODE_ENV=production`, variáveis próprias | cria normalmente |
| `NODE_ENV=production`, `SEED_EMAIL` repetindo o e-mail publicado | permitido, com aviso — identificador não é segredo |
| Fora de produção, sem as variáveis | usa a credencial local e **avisa no console** |

A recusa sai com código 1, o que derruba o contêiner pelo `set -e` do entrypoint. O
`cedim-deploy.sh` não recebe resposta na porta 3000, reverte para a versão anterior e avisa por
Telegram — falha fechada, sem site fora do ar.

⚠️ **O que a correção não faz:** o seed continua idempotente e **não troca a senha de quem já
existe**. Uma instalação que já rodou com a credencial publicada segue com ela até alguém apagar o
usuário e rodar de novo. A credencial também permanece no histórico do Git e deve ser considerada
comprometida onde quer que tenha sido usada.

---

### A5 — Guarda permanente sem mecanismo que a sustente 🟠

**Contexto:** em 25/09/2026 a orientação definiu que os registros são conservados
indefinidamente. O prazo legal mínimo é de 20 anos a contar do último registro (Lei 13.787/2018;
Resolução CFM 1.821/2007); o projeto optou por não estipular fim.

O código contradiz a política em três pontos:

1. **`DELETE /api/anamneses` apaga de verdade.** `app/api/anamneses/route.js` chama
   `prisma.anamnese.delete`. Qualquer usuário autenticado destrói uma anamnese em definitivo, com
   uma requisição. Não há exclusão lógica nem cópia.
2. **Não existe `updatedAt`.** `prisma/schema.prisma` guarda só `createdAt`. Como o prazo legal
   conta do último registro, não há como saber quando a ficha foi tocada pela última vez.
3. **Não há autoria** (ver C4). Uma alteração ou exclusão não pode ser atribuída a ninguém.

**Política definida em 25/09/2026: não se apaga anamnese, apenas se edita.** A exclusão deixa de
existir como funcionalidade. Isso é mais forte do que a exclusão lógica cogitada antes: não há
"lixeira", não há marcação de excluída, não há caminho para sumir com um registro.

O sistema hoje faz o oposto exato da política:

| Política | Sistema hoje |
|---|---|
| Apagar: proibido | `app/registros/page.jsx:199` tem botão de excluir funcionando, que chama `DELETE /api/anamneses` e apaga a linha |
| Editar: permitido | não existe edição (item B6, pendente) |

**Correção:** remover `DELETE` de `app/api/anamneses/route.js` e o botão com o
`handleDeleteRegistro` de `app/registros/page.jsx`. A rota e o botão precisam sair **juntos** — só
a rota deixa o botão devolvendo 405 na cara de quem usa.

**Ordem decidida em 25/09/2026: a exclusão só sai depois que a edição (B6) existir.** Até lá o
botão continua vivo, contrariando a política já definida. A alternativa — remover agora — deixaria
o serviço sem nenhuma forma de corrigir um engano, e sob guarda permanente um erro de digitação
ficaria na ficha para sempre. Preferiu-se conviver com a exclusão por mais um tempo a perder a
capacidade de corrigir.

Consequência prática: **enquanto a exclusão existir, a política de guarda permanente não está em
vigor de fato.** Vale para o registro, não para o sistema.

A remoção atravessa duas áreas — a rota é de José Alan, o botão é de Lucas Pedroza. O relatório já
alertava que esses arquivos colidem com facilidade, então convém que saiam na mesma alteração,
combinada entre os dois, e não em duas passagens independentes.

⚠️ **A edição precisa preservar o que havia antes.** Sem isso, "só editar" é apagar com outro nome:
basta sobrescrever o conteúdo de uma ficha para destruí-la, sem passar pela exclusão e sem deixar
rastro. Correção em prontuário não sobrescreve — ela se acrescenta de forma rastreável
(Lei 13.787/2018; Resolução CFM 1.821/2007). Portanto a edição do B6 depende de `updatedAt`,
autoria (C4) e alguma forma de histórico de versões.

---

### A6 — Não há escopo de permissões 🟠

**Princípio definido em 25/09/2026:** o acesso é restrito a profissionais e estudantes da área da
saúde — médicos, enfermeiros, estagiários e demais pessoas autorizadas pelo serviço. Usuário comum
não tem acesso. Não há autocadastro, e não deve haver.

O sistema não consegue expressar essa distinção:

| Onde | Situação |
|---|---|
| `prisma/schema.prisma:10` | `User` tem só `id`, `email`, `password`, `createdAt` — sem papel |
| `app/api/auth/login/route.js:23` | o token carrega apenas `{ id, email }` |
| Todas as rotas | verificam **se** há sessão, nunca **quem** é |

Consequência: todo usuário autenticado é equivalente e pode tudo — inclusive apagar em definitivo
(ver A5). Um estagiário tem exatamente os mesmos poderes de quem coordena o serviço.

**Correção proposta:** coluna `papel` em `User`, o papel dentro do token, e uma verificação de
autorização — não só de autenticação — nas rotas. A matriz de papéis **ainda precisa ser definida**
com a orientação e a coordenação do serviço: quem autoriza uma nova conta, e o que cada papel pode
fazer. Em especial, se estagiário pode excluir, e se alguém pode.

Relacionado a A5 (a guarda permanente só se sustenta se a exclusão for restrita) e a C4 (sem
autoria, o papel não adianta para auditoria).

---

### A7 — `JWT_SECRET` de exemplo assina sessão válida 🔴 — ✅ **resolvido em 25/09/2026**

O `.env.example` publicava um `JWT_SECRET` funcional (`segredo_jwt_padrao_para_testes`), e
`lib/auth.js` apenas conferia se a variável **existia**. Como a assinatura HS256 é a única coisa que
torna um token não forjável, quem conhece o segredo assina o que quiser:

```js
jwt.sign({ id: 1, email: 'qualquer@coisa' }, 'segredo_jwt_padrao_para_testes')
```

Isso devolve um cookie que `lerSessao` aceita como sessão legítima — **sem senha, sem usuário, sem
passar pelo login**. É o A1 de volta, entrando pela configuração em vez do código, e mais grave que
o A4: o A4 exigia usar a tela de login, isto a dispensa.

**Correção aplicada:** `scripts/verificar-ambiente.js`, executado pelo `docker-entrypoint.sh` antes
de subir a aplicação. Em produção recusa a lista de valores de exemplo e qualquer segredo com menos
de 32 caracteres; em qualquer ambiente recusa a ausência da variável. Sai com código 1, o que
derruba o contêiner e faz a implantação reverter. O `.env.example` passou a trazer
`TROQUE_ESTE_VALOR`, que também está na lista de recusados.

⚠️ **Por que a conferência não está em `lib/auth.js`.** A chamada de `segredo()` acontece dentro do
`try` de `lerSessao`, cujo `catch` devolve `null`. Um `throw` ali seria engolido: toda sessão viraria
inválida, `/login` continuaria respondendo `200` — é a única rota liberada sem sessão — e o health
check do `cedim-deploy.sh`, que testa exatamente `/login`, **declararia a implantação bem-sucedida**.
O sintoma seria pior que uma queda: o login funciona, a pessoa é devolvida à tela de login
indefinidamente, sem reversão e sem alerta. A conferência tem de ser na subida, não na requisição.

O valor antigo permanece no histórico do Git e deve ser considerado comprometido em qualquer
ambiente que o tenha usado. Trocar o `JWT_SECRET` invalida todas as sessões emitidas.

---

## B. Defeitos funcionais

### B1 — `/registros/[id]` nunca funciona 🟠 *verificado*

`app/registros/[id]/page.jsx:13` lê `localStorage.getItem("registros")`, mas os dados vivem no MySQL
desde a migração para o Prisma. A página sempre renderiza "Registro não encontrado". Nenhum link do
sistema aponta para ela.

**Correção:** consumir `/api/anamneses`, ou remover a rota.

### B2 — Nenhuma validação ao salvar 🟠 *verificado* — 🟡 **servidor feito em 25/09/2026**

`handleSave` não valida campo algum. `POST /api/save-anamnese` com `{"id":"x"}` responde `200` e
grava. É possível registrar anamnese sem nome de paciente.

**Correção parcial:** o servidor passou a recusar anamnese sem nome de paciente (`400`), com a lista
de campos obrigatórios isolada em `CAMPOS_OBRIGATORIOS`, em `app/api/save-anamnese/route.js`.

⚠️ A lista é **provisória** — só o nome é exigido, porque ficha sem identificação não é aproveitável.
A definitiva depende da orientação (item D4). **Falta ainda a validação no cliente**, para o usuário
ver o erro antes de enviar.

### B3 — Status HTTP incorretos 🟡 *verificado* — ✅ **resolvido em 25/09/2026**

| Situação | Antes | Agora |
|---|---|---|
| `id` duplicado ao salvar | `500` | `409` |
| `DELETE` de `id` inexistente | `500` | `404` |

Tratados pelos códigos do Prisma: `P2002` para restrição única e `P2025` para registro não encontrado.

### B4 — Popup e download individual inalcançáveis 🟡

Em `app/registros/page.jsx`, `handleOpenPopup` (`:39`) e `handleDownload` (`:126`) nunca são
chamados — não há `onClick` para nenhum dos dois. O popup de resumo é código inalcançável, e seus
dois botões internos estão `disabled` de qualquer forma. Não há como ver a anamnese completa nem
baixar a imagem de um registro.

### B5 — Coluna "Sexo" sempre vazia 🟡 *verificado*

`app/metricas/page.jsx` lê `r.sexo` em três pontos, mas o formulário não tem esse campo. O objeto
`sexos` é calculado e não aparece em gráfico nenhum; a coluna "Sexo" do CSV sai sempre em branco.

### B6 — Não há edição de anamnese 🔴 *promovido em 25/09/2026*

Não existe rota `PUT`/`PATCH`. Corrigir um erro de digitação exige apagar o registro e refazer a
anamnese inteira.

**A política de 25/09/2026 elimina essa saída e torna o item bloqueante.** Se não se pode apagar e
não se pode editar, um erro de digitação é permanente e incorrigível. A edição deixou de ser
conveniência e virou o **único** mecanismo de correção do sistema.

Daí uma ordem obrigatória: a exclusão só pode ser removida **depois** que a edição existir, ou
junto com ela. Removê-la antes deixa o serviço sem nenhuma forma de consertar um engano. **Essa foi
a ordem decidida em 25/09/2026** — a exclusão fica no ar até a edição entrar, e as duas mudanças
saem juntas.

Enquanto isso, este item é o que segura a política de guarda: nada do que foi decidido sobre
retenção vale de fato antes de ele existir.

A edição precisa preservar o conteúdo anterior — ver A5. Sem histórico, ela vira a exclusão que a
política acabou de proibir. E a rota nova tem de chamar `lerSessao` por conta própria, como as
demais.

### B7 — Marcações do canvas são write-only 🟡

`BreastMarkingCanvas` expõe apenas `getDataUrl` (`:62-65`). Não há como recarregar as marcações
feitas: elas ficam congeladas dentro do JPEG e não podem mais ser ajustadas.

---

## C. Desempenho e modelo de dados

### C1 — `GET /api/anamneses` devolve tudo, sempre 🟠 *verificado*

Sem paginação e sem seleção de campos; a resposta inclui as três imagens base64 de cada registro.

Medição real: **1 registro com 3 imagens = 781 KB no banco e 800 KB de resposta.** A tela
`/registros` exibe apenas nome, data e cidade — e baixa tudo. Com 500 anamneses isso é da ordem de
**400 MB por carregamento**, e `/metricas` faz o mesmo.

**Correção:** `select` sem as colunas de imagem, mais paginação. Resolve o problema sozinho.

Projeção do impacto em [dimensionamento.md](dimensionamento.md): com 100 atendimentos/dia, a tela
fica inviável em cerca de **uma semana** de uso real. Com paginação, a resposta passa a ser
constante — 5,5 KB por página, independente do tamanho do banco.

### C2 — Nenhum campo clínico é coluna 🟠

A tabela `anamneses` tem seis colunas e todo o conteúdo clínico vive dentro do JSON `data`. Não há
índice, tipo nem restrição sobre nome, cidade ou data. Buscar paciente por nome varre a tabela.

**Correção:** promover `nome`, `cidade`, `dataEmissao` e `dataNascimento` a colunas indexadas,
mantendo o JSON para o restante.

### C3 — A imagem do relatório duplica o JSON 🟠

`imagem` é um JPEG de um relatório HTML cujo conteúdo já está inteiro em `data`. É duplicação cara
de guardar, impossível de indexar e que não pode ser corrigida depois que o registro é salvo.

**Correção:** gerar o relatório sob demanda a partir do JSON e parar de persistir `imagem`.

É **64% de cada registro**: o JSON clínico ocupa 1,7 KB dos 781 KB medidos, e as imagens os outros
779 KB. Ver [dimensionamento.md](dimensionamento.md).

### C4 — Sem registro de autoria 🟠

Não se sabe quem criou ou apagou cada anamnese. Para dado de saúde isso costuma ser exigência.

Vale notar que o schema legado em `db/schema.sql` **tinha** `user_id` com chave estrangeira — o
vínculo existia no desenho original e se perdeu na migração para o Prisma.

---

## D. Documentação

### D1 — O README afirmava uma garantia de segurança falsa 🔴 ✅ **corrigido aqui**

O texto dizia:

> "Sistema Fechado: Todo o acesso (rotas de registros, formulários e métricas) é protegido por
> Middleware. É necessário estar logado."

Isso é falso (ver A1). O problema é mais grave que o bug: quem lê conclui que a proteção está
resolvida e não investiga. Corrigido — o README agora descreve o comportamento real e aponta para A1.

**Reincidiu, ao contrário — corrigido em 25/09/2026.** Quando A1 foi resolvido, o commit
`3b89ed9` atualizou `CLAUDE.md`, `docs/api.md` e este documento, mas **não** o `README.md`. O README
seguiu afirmando que o middleware "verifica apenas se o cookie existe" e mandando não registrar
paciente real — descrevendo uma falha que já não existia. O sentido do erro inverteu; a causa é a
mesma: documentação que não acompanhou o código no mesmo commit. A regra que exige isso
(`94fcec8`) só nasceu três commits depois e não retroagiu.

A seção "Sobre o controle de acesso" do README agora descreve `lerSessao`, lista as camadas que a
chamam e explica por que as rotas repetem a verificação do middleware.

### D2 — `db/` documenta um caminho que quebra o projeto 🟠 ✅ **resolvido em 25/09/2026**

`db/README.md` e `db/schema.sql` são anteriores ao Prisma. Ainda listam como "próximos passos
opcionais" coisas que já existem. Pior: os dois schemas são incompatíveis.

| | `db/schema.sql` | migration do Prisma (a que roda) |
|---|---|---|
| `anamneses.id` | `BIGINT AUTO_INCREMENT` | `VARCHAR(191)` |
| Colunas | `imagem_mama_a`, `created_at` | `imagemMamaA`, `createdAt` |
| Tamanho da imagem | `TEXT` (64 KB) | `LONGTEXT` |
| Vínculo com usuário | `user_id` + FK | não existe |

Quem seguir `db/README.md` monta um banco onde a aplicação não roda: o código grava `id` string em
coluna numérica e os nomes de coluna não batem. `TEXT` também estouraria com as imagens reais,
medidas em ~250 KB.

Feito na passagem de 23/09: aviso de obsolescência no topo de `db/README.md`, apontando o Prisma
como fonte de verdade.

**A pasta `db/` foi apagada em 25/09/2026.** O aviso não bastava: quem chega num arquivo de
instalação tende a seguir os passos que estão abaixo dele, e o caminho descrito quebra a aplicação —
sem contar que `TEXT` truncaria imagens de ~250 KB silenciosamente, o que é perda de dado sem erro
visível. Manter dois esquemas incompatíveis no repositório convida ao erro.

Uma ideia do arquivo apagado merece registro, porque era melhor que o que ficou: `db/schema.sql`
tinha `user_id` com chave estrangeira para `users` — exatamente a autoria que falta hoje (item C4).
A estrutura proposta em [dimensionamento.md](dimensionamento.md) a recupera, e o histórico do Git
preserva o arquivo para quem precisar.

**No servidor a pasta sobreviveu à exclusão**, porque continha `._README.md` e `._schema.sql` —
arquivos AppleDouble do macOS, resíduo do `tar` usado na primeira cópia para o CT. São 81 no total,
não rastreados, e o `git reset --hard` da implantação não os remove. O `.gitignore` e o
`.dockerignore` passaram a cobrir `._*` e `.DS_Store`, para que não entrem no repositório num
`git add -A` feito de um Mac. Limpar os que já estão no servidor é `git clean -fd` em `/opt/cedim`,
que não toca no `.env` porque ele é ignorado.

### D3 — Instalação falha em npm 11+ 🟡 ✅ **documentado aqui**

O README manda `npm install` e `npm run db:setup`. No npm 11, que bloqueia install scripts por
padrão, o Prisma não baixa os engines e o `db:setup` falha. Quem estiver em npm 10 não vê o
problema. Passo acrescentado ao README.

### D4 — O significado clínico dos campos não está documentado 🟠 ⏳ **precisa da equipe**

Criado o [modelo de dados](modelo-de-dados.md) com o **formato** de cada campo. O que ele não diz —
porque exige conhecimento clínico — é o significado de cada campo, quais são obrigatórios e quais
valores são aceitáveis no protocolo do CEDIM.

Para um sistema de saúde que vai passar de mão em mão no PET, esta é a lacuna que mais vai custar.

### D5 — DUM condicionada a "Amamentou" ❓ ⏳ **pergunta clínica**

O campo DUM (Data da Última Menstruação) só aparece quando "Amamentou" está marcado
(`anamnesis-form.jsx:706`). Pode ser intencional, mas a associação não é óbvia. Confirmar com quem
definiu o protocolo se é esse o comportamento desejado.

### D6 — `robots.txt` é inalcançável 🟡 *verificado*

O `matcher` do middleware (`middleware.js:19`) não abre exceção para `robots.txt`, então crawlers
recebem `307` para `/login`. Em ambiente publicado, use o cabeçalho `X-Robots-Tag` — esse funciona.

### D7 — A pasta `dev/` não é explicada 🟡

77 MB e 349 arquivos de build do Next.js commitados por engano. O `.gitignore` cobre `/.next/`, mas
esse build foi parar na raiz como `dev/`. Não é usado em nada. Mencionado agora no README.

**Correção:** `git rm -r --cached dev/` e acrescentar ao `.gitignore`.

---

## E. Qualidade e manutenção

| | Item | Onde |
|---|---|---|
| **E1** | `npm run lint` quebrado — o script existe, o eslint não está nas dependências e não há config | `package.json:8` |
| **E2** | Código morto: `app/registros.jsx` (órfão), `formatFormDataAsHtml` em `registros/page.jsx` (~60 linhas nunca chamadas), `lib/db.js` (pool mysql2 sem uso), `seed.js` na raiz duplicando `prisma/seed.js`, `styles/globals.css` duplicando `app/globals.css`, imports mortos (`domtoimage`, `FileText`, `User`) | vários |
| **E3** | `alert()` em vez do `toast` do sonner, que já é dependência e já é usado no login | `anamnesis-form.jsx` |
| **E4** | `<a href>` em vez de `<Link>`: toda navegação recarrega a página inteira | `header.jsx` |
| **E5** | `middleware.js` está deprecado no Next 16; o framework pede `proxy.js` | `middleware.js` |
| **E6** | `key={idx}` em vez de `key={registro.id}` | `registros/page.jsx:196` |
| **E7** | 2.944 linhas de código próprio e 13 comentários (0,4%); `anamnesis-form.jsx` tem 1.004 linhas e nenhum | — |

Dentro de E2, um detalhe: `registros/page.jsx:106` lê `data.historiaReprodutiva?.aumento`, chave que
não existe (o correto é `amamentou`). Está em código morto, então não afeta nada hoje — mas se
alguém reativar aquela função, "Amamentou" sairá sempre vazio no relatório.

---

## Ordem sugerida

**Antes de qualquer paciente real:** ~~A1~~ · ~~A2~~ · ~~A3~~ · ~~A4~~ · B2 (falta o lado do cliente)

**Em seguida, estrutural:** **B6 (agora bloqueante — sem ele não há como corrigir nada)** · C1 (resolve o desempenho sozinho) · C2 · C3 · B1

**Depois:** D4 com a equipe clínica · **A6 · C4 · A5** (o trio de papéis, autoria e exclusão, que se resolve junto) · ~~B3~~ · B4 · B5 · B7

**Dívida técnica, quando houver folga:** D7 · E1 · E2 · E5 · E3 · E4 · E6 · E7

---

## Alterações de documentação feitas nesta passagem

Nenhum arquivo `.js` ou `.jsx` foi tocado.

| Arquivo | O que mudou | Item |
|---|---|---|
| `README.md` | Removida a afirmação falsa sobre o middleware; acrescentada nota sobre npm 11 e install scripts; acrescentado aviso sobre a pasta `dev/`; nota sobre `SEED_EMAIL`/`SEED_PASSWORD`; índice dos documentos novos | D1 · D3 · D7 · A4 |
| `db/README.md` | Aviso de obsolescência no topo, apontando o Prisma como fonte de verdade e alertando que seguir aquele caminho quebra a aplicação | D2 |
| `docs/MELHORIAS.md` | **Novo** — este documento | — |
| `docs/modelo-de-dados.md` | **Novo** — formato de cada campo, campos gerados no save, inconsistências de valores, exemplo de registro | D4 |
| `docs/api.md` | **Novo** — contrato das seis rotas com o comportamento real verificado | — |
| `CLAUDE.md` | **Novo** — orientação para sessões de IA: arquitetura, comandos, armadilhas conhecidas | — |
| `docs/relatorio-tecnico.pdf` | **Novo** — relatório em formato ABNT (NBR 14724) para circulação entre colegas | — |
| `docs/relatorio-tecnico.html` | **Novo** — fonte do PDF acima, para regeneração | — |

### Mudanças de código anteriores a esta passagem

Feitas durante a publicação no homelab, antes desta instrução, e registradas aqui para que nada
fique escondido:

- `next.config.mjs` — cabeçalho `X-Robots-Tag: noindex` para o ambiente de demonstração.
- `prisma/seed.js` — as credenciais do seed passaram a aceitar `SEED_EMAIL` e `SEED_PASSWORD`,
  mantendo os valores atuais como padrão. Retrocompatível.
- `package.json` — bloco `allowScripts` gravado automaticamente pelo npm 11 ao aprovar os install
  scripts do Prisma, Tailwind e sharp.
- Arquivos de implantação novos: `Dockerfile`, `docker-entrypoint.sh`, `docker-compose.prod.yml`,
  `.dockerignore`, `public/robots.txt`.
