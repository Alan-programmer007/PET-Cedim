# CLAUDE.md

Orientação para qualquer assistente de IA que trabalhe neste repositório.

---

## ⛔ REGRA INEGOCIÁVEL: código sem documentação não entra

**Toda alteração de código exige a atualização da documentação correspondente, no mesmo
commit.** Isto não é uma recomendação, não depende do tamanho da mudança e não é dispensável
por pressa. Um pull request que altere código sem tocar a documentação **é barrado
automaticamente** pela verificação `Documentação acompanha o código`, no GitHub Actions.

O motivo é concreto e já aconteceu neste projeto: o `README.md` afirmava que todo o acesso era
protegido por middleware. Era falso — o middleware só conferia se o cookie existia. Quem lia a
frase concluía que a proteção estava resolvida e parava de investigar. **A documentação errada
atrasou a descoberta de uma falha crítica.** Documentação desatualizada é pior que documentação
nenhuma, porque é lida como prova.

### O que atualizar, conforme o que você mexeu

A verificação é **por área**: não adianta tocar qualquer documento. Se você alterou uma rota, é
`docs/api.md` que precisa mudar, e nenhum outro arquivo substitui isso.

| Se você mexeu em… | Atualize — obrigatoriamente |
|---|---|
| Qualquer rota em `app/api/` | [`docs/api.md`](docs/api.md) — contrato, códigos de resposta, exemplos |
| `middleware.js` ou `lib/auth.js` | [`docs/api.md`](docs/api.md) — seção de autenticação |
| `prisma/schema.prisma` ou migrations | [`docs/modelo-de-dados.md`](docs/modelo-de-dados.md) |
| `anamnesis-form.jsx` ou `breast-marking-canvas.jsx` | [`docs/modelo-de-dados.md`](docs/modelo-de-dados.md) |
| `next.config.mjs`, `Dockerfile`, compose | `README.md` |
| Qualquer outro código | pelo menos um documento |

Além destas, sempre que resolver um item de [`docs/MELHORIAS.md`](docs/MELHORIAS.md), marque-o como
resolvido com a data, e atualize [`docs/relatorio-tecnico.html`](docs/relatorio-tecnico.html) quando
mudar comportamento que ele descreve (regerando o PDF).

### Como a regra é aplicada

Não é honra. São duas camadas, que rodam o **mesmo** script,
[`scripts/verificar-documentacao.sh`](scripts/verificar-documentacao.sh):

1. **No seu commit.** O hook `.githooks/pre-commit` roda antes de cada commit e o **recusa** se a
   documentação exigida não estiver junto. Ele é instalado sozinho pelo `npm install`. Na prática,
   você não consegue concluir a tarefa sem escrever a documentação.
2. **No pull request.** O job `Documentação acompanha o código` repete a conferência no GitHub
   Actions e reprova o PR.

A verificação também recusa alterações **rasas**: acrescentar uma linha em branco ou um caractere
solto no documento certo não passa. É preciso descrever o que mudou — no mínimo duas linhas de
conteúdo real.

Para conferir antes de commitar: `npm run docs:check`
Para rodar o autoteste da própria verificação: `npm run docs:test`

A verificação é testada automaticamente em **macOS, Linux e Windows** pelo job `portabilidade`,
que roda o autoteste e confirma que o hook recusa um commit sem documentação e aceita um commit
com ela — nos três sistemas. Se você alterar `scripts/verificar-documentacao.sh`, o autoteste
precisa continuar passando nos três.

### Ao resolver um item de MELHORIAS.md

Não basta apagar o item. Marque-o como resolvido, com a data, e **substitua a seção "Correção"
pela correção que foi de fato aplicada**. O documento é o histórico do projeto, não uma lista de
afazeres.

### Se você acha que sua mudança não precisa de documentação

Você provavelmente está enganado. Renomear uma variável muda o que está escrito em `docs/api.md`
se ela aparece num exemplo. Mudar um código de resposta muda o contrato. Se após reler a tabela
acima ainda achar que não há o que atualizar, **diga isso ao usuário e deixe que ele decida**.

Não contorne a regra: não use `git commit --no-verify`, não desative o hook, não altere
`scripts/verificar-documentacao.sh` para afrouxar a conferência e não remova o job do workflow.
Fazer qualquer uma dessas coisas sem o usuário ter pedido é desobedecer a instrução, não resolvê-la.

---

## O que é o projeto

Sistema de registro de anamneses mamárias do CEDIM, feito para o PET-Saúde da UNCISAL.
Next.js 16 (App Router, JSX puro — **não é TypeScript**), Prisma + MySQL, Tailwind 4 e Shadcn UI.

Equipe: José Alan (segurança), Alan da Silva (dados e desempenho), Lucas Pedroza (interface),
sob orientação do Professor Gustavo Figueiredo (definição clínica). A divisão de tarefas está na
seção 8 do relatório técnico.

## Comandos

```bash
docker compose up -d     # sobe só o MySQL (porta 3307)
npm install              # em npm 11+, rode antes: npm install-scripts approve @prisma/client @prisma/engines prisma @tailwindcss/oxide sharp fsevents
npm run db:setup         # migrations + seed
npm run dev              # servidor em :3000
npm run build            # build de produção
npm run lint             # QUEBRADO: eslint não está instalado e não há config
```

## Arquitetura

- `app/` — rotas. `page.jsx` é o formulário; `registros/`, `metricas/`, `login/`, `api/`.
- `components/anamnesis-form.jsx` — 1.004 linhas, o coração do sistema. Todo o formulário e o
  gerador do relatório HTML que vira JPEG.
- `components/breast-marking-canvas.jsx` — canvas de marcação. Expõe só `getDataUrl`.
- `lib/auth.js` — verificação de sessão. **Toda rota nova que leia ou grave dados deve chamar
  `lerSessao` por conta própria**; o middleware não basta como fronteira de segurança.
- `lib/prisma.js` — cliente Prisma (singleton). **`lib/db.js` é código morto**, pool mysql2 sem uso.
- `middleware.js` — valida a assinatura do token e devolve 401 em JSON para `/api/*`.

Todo o conteúdo clínico é gravado como **um único blob JSON** na coluna `data`. Formato em
[docs/modelo-de-dados.md](docs/modelo-de-dados.md).

## Armadilhas conhecidas

Leia [docs/MELHORIAS.md](docs/MELHORIAS.md) antes de propor mudanças. Os pontos que mais confundem:

- **`lib/auth.js` usa `jose`, não `jsonwebtoken`.** O middleware roda no Edge Runtime, onde o
  `crypto` do Node não existe. Não troque de biblioteca sem entender isso.
- **`app/registros.jsx` e `app/registros/[id]/page.jsx` leem `localStorage`** — são de antes do
  banco. O primeiro é órfão; o segundo é uma rota viva que sempre falha.
- **`formatFormDataAsHtml` existe em dois arquivos.** A de `anamnesis-form.jsx` é usada; a de
  `registros/page.jsx` é código morto (e tem um bug de chave: lê `aumento` em vez de `amamentou`).
- **`handleOpenPopup` e `handleDownload` em `registros/page.jsx` nunca são chamados.** O popup é
  inalcançável.
- **A pasta `dev/`** (77 MB) é build commitado por engano. Ignore-a.
- **`seed.js` na raiz** não é o seed usado; o real é `prisma/seed.js`.
- **`styles/globals.css`** duplica `app/globals.css`; o usado é o de `app/`.

## Convenções

- Comentários e documentação em **português**.
- Nomes de campo em português (`nome`, `dataNascimento`), exceto a rota de login, que usa
  `email`/`password`.
- O projeto tem `zod` como dependência, mas a validação atual é manual.
- Não há testes. Valide as mudanças executando a aplicação, não só compilando.

## Implantação

A `main` vai a produção **automaticamente**, em cerca de 2 minutos, sem revisão humana.
Trabalhe em branch e abra PR — o Actions valida antes. Um commit quebrado tira o site do ar até
a reversão automática agir.

## Ao mexer no banco

`prisma/schema.prisma` é a fonte de verdade. **Ignore `db/schema.sql`** — é de antes do Prisma e
incompatível.
