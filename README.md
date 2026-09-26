# Sistema de Anamneses - CEDIM

Plataforma desenvolvida para o registro e gerenciamento de anamneses mamárias do CEDIM.

## Tecnologias Utilizadas
- **Frontend / Backend:** Next.js (React)
- **Banco de Dados:** MySQL
- **ORM / Migrations:** Prisma
- **Estilização:** Tailwind CSS e Shadcn UI

## Documentação

> **Código deve vir com documentação.** Toda alteração de código deve atualizar o documento
> correspondente, no mesmo commit. A conferência é feita **na revisão do pull request** — o que
> atualizar em cada caso está em [`CLAUDE.md`](CLAUDE.md).
>
> O motivo já se materializou aqui: este README afirmava que o acesso era protegido por middleware
> quando não era, e a frase atrasou a descoberta de uma falha crítica. Documentação desatualizada
> é pior que documentação nenhuma, porque é lida como prova.

| Documento | Conteúdo |
|---|---|
| [Relação de melhorias](docs/MELHORIAS.md) | Levantamento do que precisa ser corrigido, por prioridade |
| [Modelo de dados](docs/modelo-de-dados.md) | Formato de cada campo da anamnese e como são gravados |
| [API](docs/api.md) | Contrato das seis rotas, com o comportamento real verificado |
| [Relatório técnico (PDF)](docs/relatorio-tecnico.pdf) | Versão em formato ABNT, para circulação e leitura fora do repositório |
| [CLAUDE.md](CLAUDE.md) | Orientação para assistentes de IA e regra de documentação |

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
   - **Se você usa npm 11 ou superior**, aprove os install scripts antes de seguir. O npm 11 passou
     a bloqueá-los por padrão, e sem eles o Prisma não baixa seus engines e o passo seguinte falha:
     ```bash
     npm install-scripts approve @prisma/client @prisma/engines prisma @tailwindcss/oxide sharp fsevents
     ```
     Confira sua versão com `npm -v`. Em npm 10 este passo não é necessário.
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

> ⚠️ Esta credencial está publicada neste repositório e serve **apenas para o ambiente local**. Em
> qualquer ambiente acessível por terceiros, defina `SEED_EMAIL` e `SEED_PASSWORD` no `.env` antes
> de rodar o seed — ele usa essas variáveis quando existirem.
>
> O seed é idempotente: ele **não** altera a senha de um usuário que já existe. Para trocar a senha,
> apague o usuário antes de rodar novamente.

---

## ⚙️ Dinâmica da Plataforma

- **Exportação de Dados:** As áreas de "Registros" e "Métricas" possuem um botão de `Download` que gera planilhas em `.csv` prontas para abrir no Microsoft Excel com formatação correta.
- **Banco de Dados (Prisma):** A estrutura do banco de dados e as alterações de colunas são mantidas na pasta `prisma/migrations`.
- **Modelo de dados:** Todo o conteúdo clínico é gravado como um único blob JSON na coluna `data`.
  O formato está descrito em [docs/modelo-de-dados.md](docs/modelo-de-dados.md).

### Sobre o controle de acesso

A sessão é um JWT assinado em HS256, guardado no cookie `token`. A verificação está isolada em
[`lib/auth.js`](lib/auth.js), na função `lerSessao`: ela confere a **assinatura** e a validade do
token, e devolve `null` para cookie ausente, assinatura inválida ou token expirado. Presença de
cookie não é autenticação.

Quem chama `lerSessao`:

| Camada | Comportamento sem sessão válida |
|---|---|
| `middleware.js` | `401` em JSON para `/api/*`; redirecionamento para `/login` nas páginas |
| `GET`/`DELETE` `/api/anamneses` | `401` |
| `POST` `/api/save-anamnese` | `401` |
| `GET` `/api/auth/me` | `401` |

> **Por que as rotas repetem a verificação do middleware:** o middleware não é uma fronteira de
> segurança suficiente sozinho — a matriz do `matcher` pode ser alterada, e rotas novas podem nascer
> fora dela. **Toda rota que leia ou grave dados deve chamar `lerSessao` por conta própria.**

`lib/auth.js` usa `jose`, e não `jsonwebtoken`, porque o middleware roda no Edge Runtime, onde o
módulo `crypto` do Node não existe. Contrato completo das rotas em [docs/api.md](docs/api.md).

---

## 🗂️ Sobre a pasta `dev/`

A pasta `dev/` na raiz (77 MB, 349 arquivos) é saída de build do Next.js commitada por engano. Ela
**não é usada pela aplicação** e pode ser removida com segurança:

```bash
git rm -r --cached dev/ && echo "dev/" >> .gitignore
```

---

## 🔒 Considerações de Segurança (Ambiente Real)

Antes da aplicação entrar em uso oficial no contexto real, as seguintes informações de acesso devem ser estritamente alteradas para garantir a segurança da plataforma e dos dados:

1. **Credenciais do Banco de Dados (`.env`):** Substitua a `DATABASE_URL` para apontar para o banco de dados MySQL oficial, garantindo o uso de um usuário e senha seguros.
2. **Segredo de Autenticação (`.env`):** Modifique a variável `JWT_SECRET` para uma chave complexa, longa e segura. Ela garante a integridade do login e das sessões da aplicação.
3. **Acesso do Administrador:** Defina `SEED_EMAIL` e `SEED_PASSWORD` no `.env` antes de estruturar o banco pela primeira vez, com as credenciais oficiais exigidas pelo administrador ou coordenação do projeto.

Os três pontos acima só têm efeito porque a assinatura do token passou a ser validada (item A1 de
[docs/MELHORIAS.md](docs/MELHORIAS.md), resolvido em 25/09/2026). Trocar o `JWT_SECRET` invalida
todas as sessões já emitidas — os usuários precisarão entrar de novo.

Continua em aberto, antes do uso com paciente real: a validação no cliente (item B2 — o servidor já
recusa anamnese sem nome do paciente, mas o formulário só mostra o erro depois de enviar).
