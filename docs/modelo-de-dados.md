# Modelo de dados

Este documento descreve **o formato** dos dados gravados pelo sistema. Ele foi extraído da fonte
de verdade atual — o estado inicial do formulário em `components/anamnesis-form.jsx` e o gerador de
relatório do mesmo arquivo, que mapeia cada campo ao seu rótulo em tela.

> ⚠️ **O significado clínico dos campos não está documentado.** Este documento diz o formato de
> cada campo; ele não diz o que cada um representa clinicamente, quais são obrigatórios nem quais
> valores são aceitáveis do ponto de vista médico. Isso precisa ser preenchido por quem conduz o
> protocolo no CEDIM. Ver [MELHORIAS.md](MELHORIAS.md), item D4.

## Como os dados são guardados

A tabela `anamneses` tem apenas seis colunas (`prisma/schema.prisma`):

| Coluna | Tipo | Conteúdo |
|---|---|---|
| `id` | `VARCHAR(191)` | identificador gerado no cliente |
| `data` | `JSON` | **todos** os campos clínicos, como um único blob |
| `imagem` | `LONGTEXT` | data URL JPEG do relatório renderizado |
| `imagemMamaA` | `LONGTEXT` | data URL JPEG do canvas A |
| `imagemMamaB` | `LONGTEXT` | data URL JPEG do canvas B |
| `createdAt` | `DATETIME(3)` | carimbo de tempo do servidor |

Consequência prática: **nenhum campo clínico é coluna**. Não há índice, tipo nem restrição sobre
nome, cidade ou data — tudo vive dentro de `data`. Buscar uma paciente pelo nome exige varrer a
tabela inteira. Ver [MELHORIAS.md](MELHORIAS.md), item C2.

## Campos gerados no momento de salvar

Estes não vêm do formulário; são criados em `handleSave`:

| Campo | Formato | Observação |
|---|---|---|
| `id` | `Date.now() + random(0..999)` | string; sem zero à esquerda no sufixo |
| `dataEmissao` | `dd/mm/aaaa` | `toLocaleDateString('pt-BR')` — **formato diferente** dos demais campos de data |
| `resumo` | texto livre | concatenação de motivo, sintomas, cirurgias e câncer |
| `imagem` | data URL JPEG | relatório HTML rasterizado |
| `imagemMamaA` / `imagemMamaB` | data URL JPEG | capturados dos canvas |

## 1. Dados de identificação

| Campo | Tipo | Rótulo em tela |
|---|---|---|
| `nome` | string | Nome |
| `telefone` | string | Telefone |
| `cidade` | string | Cidade |
| `dataNascimento` | string `aaaa-mm-dd` | Data de Nascimento |
| `motivo` | string | Motivo do Exame |
| `exame` | string `aaaa-mm-dd` | Data do Exame |
| `idExamesAnteriores` | string | ID do Paciente |

## 2. Histórico mamário

| Campo | Tipo | Valores | Rótulo em tela |
|---|---|---|---|
| `aproveitarExames` | string | `sim` · `nao` | Realizou Exames anteriores |
| `jaFezMamo` | string | `sim` · `nao` | Já fez Mamografia ou US antes |
| `sintomas` | objeto de booleanos | `dor` · `massa` · `secrecao` | Sintomas Apresentados |
| `corSecrecao` | string | livre | Cor da Secreção |
| `especifiqueSintomas` | string | livre | Secreção Sai Espontânea? |
| `jaFezCirurgia` | objeto de booleanos | `mamoplastia` · `protese` · `nodulos` · `cancer` | Já fez Cirurgia das Mamas |
| `tempoCirurgia` | objeto de strings | mesmas chaves de `jaFezCirurgia` | tempo de cada cirurgia |
| `cancer` | string | `sim` · `nao` | Diagnóstico de Câncer Pessoal |
| `especificarCancer` | string | livre | Localização do Câncer |
| `historiaDoenca` | string | livre (textarea) | História da Doença Mamária |

## 3. História reprodutiva

| Campo | Tipo | Valores | Rótulo em tela |
|---|---|---|---|
| `numeroGestacoes` | string numérica | — | Número de Gestações |
| `numeroPartos` | string numérica | — | Número de Partos |
| `numeroAbortos` | string numérica | — | Número de Abortos |
| `historiaReprodutiva` | objeto de booleanos | `amamentou` · `menopausa` · `hormonio` | — |
| `dum` | string `aaaa-mm-dd` | — | DUM |
| `tempoMenopausa` | string | livre | Tempo de Menopausa |
| `tempoHormonio` | string | livre | Tempo com Hormônio |

Campos condicionais: `dum` só aparece quando `amamentou` está marcado; `tempoMenopausa` quando
`menopausa`; `tempoHormonio` quando `hormonio`.

> ❓ **A confirmar com a equipe clínica:** DUM (Data da Última Menstruação) aparece condicionada a
> "Amamentou". Pode ser intencional, mas a associação não é óbvia. Ver [MELHORIAS.md](MELHORIAS.md), item D5.

## 4. Histórico familiar e hábitos

| Campo | Tipo | Valores | Rótulo em tela |
|---|---|---|---|
| `alguemComCancer` | string | `sim` · `nao` | Alguém com câncer de mama na família |
| `parentescoCancer` | string | livre | Parentesco |
| `habitos` | objeto de booleanos | `fuma` · `bebe` · `atividadeEsportiva` · `alimentacaoSaudavel` · `autoExame` | Hábitos / Fatores de risco |

`habitos` é renderizado **duas vezes** no relatório: como "Hábitos" na seção 4 e como "Fatores de
risco" na seção 5. São os mesmos dados.

## 5. Exame físico

| Campo | Tipo | Valores | Rótulo em tela |
|---|---|---|---|
| `indicada` | string | `paciente` · `medico` · `tecnico` | Indicada |
| `exameFisicoA.massa` | string | `sim` · `nao` | Massa na mama? (Canvas A) |
| `exameFisicoB.alteracaoPele` | string | `coracao` · `verruga` · `outros` | Alteração na pele? (Canvas B) |
| `exameFisicoB.alteracaoPeleDetalhe` | string | livre | preenchido quando o valor é `outros` |
| `exameFisicoB.alteracaoMamilo` | string | `retração` · `espessamento` · `erosao` · `coloracao` · `outros` | Alteração do mamilo (Canvas B) |
| `exameFisicoB.alteracaoMamiloDetalhe` | string | livre | preenchido quando o valor é `outros` |

### Inconsistências conhecidas nos valores

Documentadas aqui porque afetam quem for consumir os dados exportados:

- `alteracaoPele` usa o valor **`coracao`** para o rótulo "Coloração vermelha". Pelo contexto é
  erro de digitação de `coloracao` — que, por sua vez, é um valor válido em `alteracaoMamilo`.
  Os dois campos usam palavras diferentes para a mesma condição.
- `alteracaoMamilo` aceita **`retração`** com acento, enquanto os demais valores do sistema são
  todos sem acento (`erosao`, `nao`, `protese`). Comparações de string podem falhar.
- Os objetos `exameFisicoA` e `exameFisicoB` são declarados com as mesmas quatro chaves, mas a
  interface só usa `massa` no A e `alteracaoPele` / `alteracaoMamilo` no B. As demais chaves são
  gravadas sempre vazias.

## Exemplo de registro

```json
{
  "id": "1790216075123457",
  "nome": "Maria da Silva",
  "telefone": "82999990000",
  "cidade": "Maceió",
  "dataNascimento": "1980-05-10",
  "motivo": "Rastreamento",
  "exame": "2026-09-23",
  "idExamesAnteriores": "ID-1234",
  "aproveitarExames": "sim",
  "jaFezMamo": "sim",
  "sintomas":     { "dor": true,  "massa": false, "secrecao": false },
  "jaFezCirurgia":{ "mamoplastia": false, "protese": false, "nodulos": false, "cancer": false },
  "tempoCirurgia":{ "mamoplastia": "", "protese": "", "nodulos": "", "cancer": "" },
  "cancer": "nao",
  "numeroGestacoes": "2",
  "numeroPartos": "2",
  "numeroAbortos": "0",
  "historiaReprodutiva": { "amamentou": true, "menopausa": false, "hormonio": false },
  "dum": "2026-08-01",
  "alguemComCancer": "nao",
  "habitos": { "fuma": false, "bebe": false, "atividadeEsportiva": true,
               "alimentacaoSaudavel": true, "autoExame": true },
  "indicada": "medico",
  "exameFisicoA": { "massa": "nao", "alteracaoPele": "", "alteracaoMamilo": "", "alteracaoMamiloDetalhe": "" },
  "exameFisicoB": { "massa": "", "alteracaoPele": "verruga", "alteracaoMamilo": "", "alteracaoMamiloDetalhe": "" },
  "dataEmissao": "23/09/2026",
  "resumo": "Motivo: Rastreamento\nSintomas: dor\nCirurgias: Não\nCâncer: Não"
}
```
