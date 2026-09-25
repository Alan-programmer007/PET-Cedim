# CLAUDE.md

Orientação para qualquer assistente de IA que trabalhe neste repositório.

---

## Documentação: atualize junto com o código

**Toda alteração de código deve vir com a documentação correspondente, no mesmo commit.** Não há
verificação automática — a conferência é feita **na revisão do pull request**, pela equipe. A
responsabilidade é sua: ninguém vai te lembrar.

O motivo é concreto e já aconteceu neste projeto: o `README.md` afirmava que todo o acesso era
protegido por middleware. Era falso — o middleware só conferia se o cookie existia. Quem lia a
frase concluía que a proteção estava resolvida e parava de investigar. **A documentação errada
atrasou a descoberta de uma falha crítica.** Documentação desatualizada é pior que documentação
nenhuma, porque é lida como prova.

### O que atualizar, conforme o que você mexeu

| Se você mexeu em… | Atualize |
|---|---|
| Qualquer rota em `app/api/` | [`docs/api.md`](docs/api.md) — contrato, códigos de resposta, exemplos |
| `middleware.js` ou `lib/auth.js` | [`docs/api.md`](docs/api.md) — seção de autenticação |
| `prisma/schema.prisma` ou migrations | [`docs/modelo-de-dados.md`](docs/modelo-de-dados.md) |
| Campos do formulário de anamnese | [`docs/modelo-de-dados.md`](docs/modelo-de-dados.md) |
| Instalação, execução, `Dockerfile`, compose | `README.md` |
| Arquitetura, armadilhas, convenções | este arquivo |

Sempre que resolver um item de [`docs/MELHORIAS.md`](docs/MELHORIAS.md), marque-o como resolvido
com a data e substitua a seção "Correção" pela correção que foi de fato aplicada — o documento é o
histórico do projeto, não uma lista de afazeres. Quando mudar comportamento descrito no
[relatório técnico](docs/relatorio-tecnico.html), atualize-o e regere o PDF.

Descreva o comportamento novo, não o commit: quem lê a documentação não vê o diff.

### Se você acha que sua mudança não precisa de documentação

Pode ser que não precise mesmo — comentar código ou renomear algo interno costuma não mudar nada
do que está escrito. Mas confira a tabela acima antes de concluir isso, e **diga ao usuário** o
que você avaliou, para que ele possa discordar na revisão.

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
