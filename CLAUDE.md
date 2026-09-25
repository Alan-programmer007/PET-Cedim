# CLAUDE.md

Orientação para sessões de IA neste repositório.

## O que é

Sistema de registro de anamneses mamárias do CEDIM, feito para o PET-Saúde da UNCISAL.
Next.js 16 (App Router, JSX puro — **não é TypeScript**), Prisma + MySQL, Tailwind 4 e Shadcn UI.

## Comandos

```bash
docker compose up -d     # sobe só o MySQL (porta 3307)
npm install              # em npm 11+, rode antes: npm install-scripts approve @prisma/client @prisma/engines prisma @tailwindcss/oxide sharp fsevents
npm run db:setup         # migrations + seed
npm run dev              # servidor em :3000
npm run build            # build de produção (funciona)
npm run lint             # QUEBRADO: eslint não está instalado e não há config
```

## Arquitetura

- `app/` — rotas. `page.jsx` é o formulário; `registros/`, `metricas/`, `login/`, `api/`.
- `components/anamnesis-form.jsx` — 1.004 linhas, o coração do sistema. Todo o formulário e o
  gerador do relatório HTML que vira JPEG.
- `components/breast-marking-canvas.jsx` — canvas de marcação. Expõe só `getDataUrl`.
- `lib/prisma.js` — cliente Prisma (singleton). **`lib/db.js` é código morto**, pool mysql2 sem uso.
- `middleware.js` — redireciona para `/login` quando não há cookie `token`.

Todo o conteúdo clínico é gravado como **um único blob JSON** na coluna `data`. Formato em
[docs/modelo-de-dados.md](docs/modelo-de-dados.md).

## Armadilhas conhecidas

Leia [docs/MELHORIAS.md](docs/MELHORIAS.md) antes de propor mudanças. Os pontos que mais confundem:

- **A verificação de sessão fica em `lib/auth.js`** e usa `jose`, não `jsonwebtoken` — o middleware
  roda no Edge Runtime, onde o `crypto` do Node não existe. Toda rota nova que leia ou grave dados
  deve chamar `lerSessao` por conta própria: o middleware não basta como fronteira de segurança.
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
- O projeto tem `zod` como dependência, mas **não valida nada** hoje.
- Não há testes.

## Ao mexer no banco

`prisma/schema.prisma` é a fonte de verdade. **Ignore `db/schema.sql`** — é de antes do Prisma e
incompatível.
