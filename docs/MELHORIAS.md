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
| **A** | Segurança | 4 | 🔴 bloqueia uso real |
| **B** | Defeitos funcionais | 7 | 🟠 afeta o usuário |
| **C** | Desempenho e modelo de dados | 4 | 🟠 impede crescer |
| **D** | Documentação | 7 | 🟡 4 resolvidos aqui |
| **E** | Qualidade e manutenção | 7 | 🟢 dívida técnica |

---

## A. Segurança

> Enquanto A1 não for resolvido, o sistema **não deve receber dado de paciente real**, nem em rede
> interna.

### A1 — Bypass total de autenticação 🔴 *verificado*

`middleware.js:4-5` verifica apenas se o cookie `token` **existe**; nunca valida a assinatura do
JWT. Nenhuma rota de API refaz a verificação por conta própria — só `/api/auth/me` valida, e ela
não protege nada.

Reproduzido:

```
curl -H 'Cookie: token=isso_nao_e_um_jwt' /api/anamneses     → 200
curl -H 'Cookie: token=qualquer_coisa' -X POST /api/save-anamnese → 200 (gravou no banco)
```

Qualquer pessoa que defina um cookie arbitrário lê e escreve prontuário.

**Correção:** validar a assinatura no middleware — com `jose`, porque `jsonwebtoken` não roda no
Edge Runtime — **e** revalidar dentro de cada route handler. Middleware sozinho não é fronteira de
segurança.

### A2 — Exclusão arbitrária de arquivos 🔴 *verificado*

`app/api/delete-anamnese/route.js:11` monta `path.join(process.cwd(),'public','anamneses', id + '.jpg')`
sem sanitizar `id`. Um `id` com `../` sai do diretório. Confirmado apagando um arquivo-isca fora do
projeto.

Agravante: **a rota é código morto**, resquício da versão que gravava em disco. Nenhuma tela a chama.

**Correção:** apagar `app/api/delete-anamnese/`.

### A3 — Vazamento de stack trace 🟠 *verificado*

`app/api/save-anamnese/route.js:26` devolve `err.message` no campo `details`. Com `id` duplicado, a
resposta expõe caminho absoluto do servidor, estrutura de chunks e o ORM.

**Correção:** registrar o erro no servidor e devolver mensagem genérica ao cliente.

### A4 — Credenciais de teste em repositório público 🟠

O `README.md` publica e-mail e senha do usuário criado pelo seed. Quem encontrar o repositório tem a
credencial de qualquer instalação que não a tenha trocado.

**Correção:** já é possível sobrepor via `SEED_EMAIL` / `SEED_PASSWORD` (ver `prisma/seed.js`).
Documentar isso como o caminho padrão e tratar a senha do README como válida só para o local.

---

## B. Defeitos funcionais

### B1 — `/registros/[id]` nunca funciona 🟠 *verificado*

`app/registros/[id]/page.jsx:13` lê `localStorage.getItem("registros")`, mas os dados vivem no MySQL
desde a migração para o Prisma. A página sempre renderiza "Registro não encontrado". Nenhum link do
sistema aponta para ela.

**Correção:** consumir `/api/anamneses`, ou remover a rota.

### B2 — Nenhuma validação ao salvar 🟠 *verificado*

`handleSave` não valida campo algum. `POST /api/save-anamnese` com `{"id":"x"}` responde `200` e
grava. É possível registrar anamnese sem nome de paciente.

**Correção:** validar no cliente e no servidor. `zod` já é dependência do projeto.

### B3 — Status HTTP incorretos 🟡 *verificado*

| Situação | Hoje | Deveria |
|---|---|---|
| `id` duplicado ao salvar | `500` | `409` |
| `DELETE` de `id` inexistente | `500` | `404` |

### B4 — Popup e download individual inalcançáveis 🟡

Em `app/registros/page.jsx`, `handleOpenPopup` (`:39`) e `handleDownload` (`:126`) nunca são
chamados — não há `onClick` para nenhum dos dois. O popup de resumo é código inalcançável, e seus
dois botões internos estão `disabled` de qualquer forma. Não há como ver a anamnese completa nem
baixar a imagem de um registro.

### B5 — Coluna "Sexo" sempre vazia 🟡 *verificado*

`app/metricas/page.jsx` lê `r.sexo` em três pontos, mas o formulário não tem esse campo. O objeto
`sexos` é calculado e não aparece em gráfico nenhum; a coluna "Sexo" do CSV sai sempre em branco.

### B6 — Não há edição de anamnese 🟠

Não existe rota `PUT`/`PATCH`. Corrigir um erro de digitação exige apagar o registro e refazer a
anamnese inteira.

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

### C2 — Nenhum campo clínico é coluna 🟠

A tabela `anamneses` tem seis colunas e todo o conteúdo clínico vive dentro do JSON `data`. Não há
índice, tipo nem restrição sobre nome, cidade ou data. Buscar paciente por nome varre a tabela.

**Correção:** promover `nome`, `cidade`, `dataEmissao` e `dataNascimento` a colunas indexadas,
mantendo o JSON para o restante.

### C3 — A imagem do relatório duplica o JSON 🟠

`imagem` é um JPEG de um relatório HTML cujo conteúdo já está inteiro em `data`. É duplicação cara
de guardar, impossível de indexar e que não pode ser corrigida depois que o registro é salvo.

**Correção:** gerar o relatório sob demanda a partir do JSON e parar de persistir `imagem`.

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

### D2 — `db/` documenta um caminho que quebra o projeto 🟠 ✅ **sinalizado aqui**

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

Feito aqui: aviso de obsolescência no topo de `db/README.md`, apontando o Prisma como fonte de
verdade. **Decisão pendente sua:** apagar a pasta `db/` de vez. Documentação obsoleta que quebra o
projeto é pior que documentação nenhuma, mas apagar arquivos foge do escopo desta passagem.

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

**Antes de qualquer paciente real:** A1 · A2 · A3 · A4 · B2

**Em seguida, estrutural:** C1 (resolve o desempenho sozinho) · C2 · C3 · B1 · B6

**Depois:** D4 com a equipe clínica · C4 · B3 · B4 · B5 · B7

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
