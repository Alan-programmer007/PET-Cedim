> # ⚠️ DOCUMENTO OBSOLETO — NÃO SIGA ESTAS INSTRUÇÕES
>
> Este arquivo é anterior à adoção do **Prisma** e descreve um caminho de instalação que
> **quebra a aplicação**.
>
> O schema em `db/schema.sql` é **incompatível** com o que o sistema realmente usa:
>
> | | `db/schema.sql` (este diretório) | migration do Prisma (a que roda) |
> |---|---|---|
> | `anamneses.id` | `BIGINT AUTO_INCREMENT` | `VARCHAR(191)` |
> | Colunas das imagens | `imagem_mama_a`, `imagem_mama_b` | `imagemMamaA`, `imagemMamaB` |
> | Carimbo de tempo | `created_at` | `createdAt` |
> | Tamanho da imagem | `TEXT` (limite de 64 KB) | `LONGTEXT` |
> | Vínculo com usuário | `user_id` + chave estrangeira | não existe |
>
> Quem criar o banco por aqui terá uma aplicação que não funciona: o código grava `id` como string
> em coluna numérica, e os nomes das colunas não batem. `TEXT` também estouraria com as imagens
> reais, medidas em torno de 250 KB.
>
> ## O caminho correto
>
> A fonte de verdade do banco é **`prisma/schema.prisma`** e as migrations em
> `prisma/migrations/`. Para preparar o banco:
>
> ```bash
> npm run db:setup
> ```
>
> Veja o [README principal](../README.md) e o [modelo de dados](../docs/modelo-de-dados.md).
>
> ---
>
> O conteúdo abaixo é mantido apenas como registro histórico. A remoção desta pasta está
> registrada como item D2 em [docs/MELHORIAS.md](../docs/MELHORIAS.md).

---

Banco de dados - instruções rápidas

1) Criar banco (exemplo MySQL local):

   mysql -u root -p
   CREATE DATABASE anamneses_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   exit

2) Executar o script para criar tabelas:

   mysql -u user -p -h host -D anamneses_db < db/schema.sql

3) Variáveis de ambiente (ex.: `.env.local`):

   DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/anamneses_db
   JWT_SECRET=uma_string_secreta_long

4) Provedores grátis recomendados:
   - PlanetScale (MySQL compatível) — ideal para deploy em Vercel (atenção a limitações de DDL em branchless)
   - Railway (tem plano gratuito)

5) Observações de segurança:
   - Nunca comite `.env.local` em repositório público.
   - Use `JWT_SECRET` forte (ex: `openssl rand -hex 32`).
   - Em produção, garanta TLS/HTTPS e cookies `secure`.

6) Próximos passos (opcional):
   - Criar migrations com ferramenta (prisma, knex, sequelize) para gerenciar alterações de schema.
   - Implementar endpoints para CRUD de `anamneses` quando desejar salvar registros no servidor.
