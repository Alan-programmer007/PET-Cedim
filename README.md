# Sistema de Anamneses - CEDIM

Plataforma desenvolvida para o registro e gerenciamento de anamneses mamárias do CEDIM.

## Tecnologias Utilizadas
- **Frontend / Backend:** Next.js (React)
- **Banco de Dados:** MySQL
- **ORM / Migrations:** Prisma
- **Estilização:** Tailwind CSS e Shadcn UI

---

## 🚀 Como testar localmente

Para que a equipe consiga testar rapidamente na própria máquina, siga os passos:

1. **Configurar as Variáveis de Ambiente:**
   - Faça uma cópia do arquivo `.env.example` e renomeie para `.env`.
   - As credenciais padrão do arquivo já estão preparadas para funcionar com o Docker.

2. **Subir o Banco de Dados (Docker):**
   - Certifique-se de que o Docker Desktop está rodando.
   - No terminal, inicie o banco de dados:
     ```bash
     docker compose up -d
     ```

3. **Instalar Dependências e Preparar o Banco:**
   - Instale as bibliotecas do projeto:
     ```bash
     npm install
     ```
   - Crie as tabelas e o usuário de teste automaticamente rodando:
     ```bash
     npm run db:setup
     ```
   > **Nota:** Este comando executa as _migrations_ do Prisma e o _seed_, que insere o usuário padrão de teste no banco.

4. **Rodar o Servidor:**
   ```bash
   npm run dev
   ```
   Acesse a plataforma em `http://localhost:3000`.

### 🔑 Acesso Padrão (Ambiente de Testes)
Como a plataforma é restrita e fechada (não permite auto-cadastro por segurança), o comando `db:setup` cria o seguinte usuário automaticamente:
- **Email:** `petsdcedim@gmail.com`
- **Senha:** `1234567cedim`

---

## ⚙️ Dinâmica da Plataforma

- **Sistema Fechado:** Todo o acesso (rotas de registros, formulários e métricas) é protegido por Middleware. É necessário estar logado.
- **Exportação de Dados:** As áreas de "Registros" e "Métricas" possuem um botão de `Download` que gera planilhas em `.csv` prontas para abrir no Microsoft Excel com formatação correta.
- **Banco de Dados (Prisma):** A estrutura do banco de dados e as alterações de colunas são mantidas na pasta `prisma/migrations`. 

---

## 🔒 Considerações de Segurança (Ambiente Real)

Antes da aplicação entrar em uso oficial no contexto real, as seguintes informações de acesso devem ser estritamente alteradas para garantir a segurança da plataforma e dos dados:

1. **Credenciais do Banco de Dados (`.env`):** Substitua a `DATABASE_URL` para apontar para o banco de dados MySQL oficial, garantindo o uso de um usuário e senha seguros.
2. **Segredo de Autenticação (`.env`):** Modifique a variável `JWT_SECRET` para uma chave complexa, longa e segura. Ela garante a integridade do login e das sessões da aplicação.
3. **Acesso do Administrador (`prisma/seed.js`):** Antes de estruturar o banco de dados real pela primeira vez, modifique o e-mail e a senha injetados via arquivo de seed para as credenciais oficiais exigidas pelo administrador ou coordenação do projeto.
