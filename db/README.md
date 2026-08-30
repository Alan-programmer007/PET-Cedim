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
