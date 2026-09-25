# API

Seis rotas, todas em `app/api/`. Este documento descreve o **comportamento atual verificado por
execução**, não o comportamento desejado. Onde os dois divergem, há uma nota e uma referência ao
item correspondente em [MELHORIAS.md](MELHORIAS.md).

## Autenticação

O login devolve um JWT (HS256, validade de 7 dias) num cookie `token` com `httpOnly`, `path=/`,
`sameSite=lax` e `secure` quando `NODE_ENV=production`.

A assinatura é verificada em `lib/auth.js`, com `jose` — escolhido porque o middleware roda no Edge
Runtime, onde o `crypto` do Node não existe. A verificação acontece em **duas camadas**: no
`middleware.js` e novamente dentro de cada rota que lê ou grava anamneses.

Sem sessão válida, `/api/*` responde **`401`** em JSON e as páginas respondem `307` para `/login`.

---

## `POST /api/auth/login`

Única rota isenta do middleware.

**Corpo**
```json
{ "email": "...", "password": "..." }
```

| Situação | Status | Resposta |
|---|---|---|
| Credenciais corretas | `200` | `{"ok":true}` + `Set-Cookie: token=...` |
| Campo faltando | `400` | `{"error":"Invalid"}` |
| E-mail inexistente ou senha errada | `401` | `{"error":"Invalid credentials"}` |
| `JWT_SECRET` ausente | `500` | `{"error":"Server error"}` |

Os campos se chamam `email` e `password` (em inglês), diferente do restante do sistema, que usa
português.

---

## `GET /api/auth/me`

Lê o cookie e valida a assinatura do JWT. É a **única** rota que faz essa verificação.

| Situação | Status | Resposta |
|---|---|---|
| Token válido | `200` | `{"authenticated":true,"user":{"id":1,"email":"...","iat":...,"exp":...}}` |
| Token ausente ou inválido | `401` | `{"authenticated":false}` |

---

## `POST /api/auth/logout`

Sem corpo. Sempre `200`, com `Set-Cookie` expirando o token (`maxAge=0`).

---

## `GET /api/anamneses`

Lista **todos** os registros, ordenados por `createdAt` decrescente. Cada item é o conteúdo de
`data` achatado, acrescido de `id`, `imagem`, `imagemMamaA`, `imagemMamaB` e `createdAt`.

> ⚠️ **Sem paginação e sem seleção de campos.** A resposta inclui as três imagens base64 de cada
> registro. Medição real: um registro com as três imagens gera **~800 KB** de resposta. A tela
> `/registros`, que mostra apenas nome, data e cidade, baixa tudo isso.
> Ver [MELHORIAS.md](MELHORIAS.md), item C1.

| Situação | Status |
|---|---|
| Sucesso | `200` — array (`[]` quando vazio) |
| Erro no banco | `500` — `{"error":"Erro ao buscar anamneses"}` |

---

## `DELETE /api/anamneses?id=<id>`

Remove um registro pelo `id` na query string.

| Situação | Status | Resposta |
|---|---|---|
| Removido | `200` | `{"success":true}` |
| `id` ausente | `400` | `{"error":"ID não fornecido"}` |
| `id` inexistente | `404` | `{"error":"Anamnese não encontrada"}` |

---

## `POST /api/save-anamnese`

Grava uma anamnese. O corpo é o objeto completo do formulário; `id`, `imagem`, `imagemMamaA` e
`imagemMamaB` viram colunas e **todo o resto vai para a coluna `data`**.

| Situação | Status | Resposta |
|---|---|---|
| Gravado | `200` | `{"success":true,"message":"Anamnese salva com sucesso"}` |
| Sem `id` no corpo | `400` | `{"error":"Dados insuficientes"}` |
| `id` duplicado | `409` | `{"error":"Já existe uma anamnese com este identificador"}` |
| Falta campo obrigatório | `400` | `{"error":"Preencha os campos obrigatórios: Nome"}` |

A lista de campos obrigatórios está em `CAMPOS_OBRIGATORIOS`, no topo do arquivo da rota. Hoje exige
apenas o nome; é **provisória** até a orientação definir o protocolo (item D4 de
[MELHORIAS.md](MELHORIAS.md)).

---

## `POST /api/delete-anamnese` — **removida**

Rota eliminada em 25/09/2026. Era resquício da versão que guardava as imagens em disco: nenhuma tela
do sistema a chamava, e ela montava o caminho do arquivo concatenando o `id` recebido sem
sanitização, o que permitia apagar qualquer arquivo `.jpg` do servidor com `../`.

Item A2 de [MELHORIAS.md](MELHORIAS.md) — **resolvido**.

---

## Rotas de página protegidas pelo middleware

O `matcher` em `middleware.js:19` cobre tudo, exceto `_next`, `api/auth/login`, `cedim.png`,
`CEDIM_LOGO.jpg` e `favicon.ico`. Sem cookie, qualquer outro caminho recebe `307` para `/login`.

Isso inclui `robots.txt`, que por isso **nunca é entregue a um crawler**.
Ver [MELHORIAS.md](MELHORIAS.md), item D6.
