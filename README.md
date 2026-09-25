# Sistema de Anamneses - CEDIM

Plataforma desenvolvida para o registro e gerenciamento de anamneses mamárias do CEDIM.

## Tecnologias Utilizadas
- **Frontend / Backend:** Next.js (React)
- **Banco de Dados:** MySQL
- **ORM / Migrations:** Prisma
- **Estilização:** Tailwind CSS e Shadcn UI

## Documentação

> ⛔ **Código sem documentação não entra.** Toda alteração de código exige a atualização do
> documento **correspondente àquela área**, no mesmo commit. A regra vale para pessoas e para
> assistentes de IA, e é aplicada em duas camadas: o hook de `pre-commit` **recusa o commit**, e o
> GitHub Actions **reprova o pull request**. Tocar um documento qualquer, ou acrescentar uma linha
> em branco, não satisfaz a verificação. O que atualizar em cada caso está em
> [`CLAUDE.md`](CLAUDE.md); para conferir antes de commitar, rode `npm run docs:check`.
>
> O hook é instalado automaticamente pelo `npm install`. Para instalar à mão:
> `git config core.hooksPath .githooks`
>
> Funciona em **macOS, Linux e Windows** — o job `portabilidade` do GitHub Actions roda o
> autoteste (`npm run docs:test`) e confirma o bloqueio do hook nos três sistemas a cada
> alteração. No Windows, o hook roda pelo Git Bash que acompanha o Git for Windows.
>
> O motivo já se materializou neste projeto: este README afirmava que o acesso era protegido por
> middleware quando não era, e a frase atrasou a descoberta de uma falha crítica. Documentação
> desatualizada é pior que documentação nenhuma, porque é lida como prova.

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

O `middleware.js` redireciona para `/login` qualquer requisição que chegue **sem** o cookie `token`.

> 🔴 **Atenção:** o middleware verifica apenas se o cookie existe — ele **não valida a assinatura do
> JWT**, e as rotas de API não refazem essa verificação. Na prática, um cookie `token` com qualquer
> conteúdo dá acesso de leitura e escrita a todas as anamneses. Isso foi confirmado por teste.
>
> **Enquanto isso não for corrigido, não registre dados de paciente real nesta plataforma**, nem em
> rede interna. Detalhes e correção em [docs/MELHORIAS.md](docs/MELHORIAS.md), item A1.

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
4. **Validação do token:** corrigir o item A1 de [docs/MELHORIAS.md](docs/MELHORIAS.md). Os três
   pontos acima não têm efeito enquanto o token não for validado.
