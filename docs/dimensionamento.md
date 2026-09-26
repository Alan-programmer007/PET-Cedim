# Dimensionamento e decisão de arquitetura

Documento de apoio à decisão de **corrigir o sistema atual** em vez de reescrevê-lo, escrito em
25/09/2026 para circular com a orientação e a coordenação do serviço.

**Resposta curta:** a tecnologia atual (Next.js, Prisma, MySQL) atende o CEDIM por décadas. O
problema não é o volume de atendimentos nem o banco de dados — é **o que está guardado dentro de
cada linha**. O conteúdo clínico de uma anamnese ocupa 1,7 KB; as imagens ocupam os outros 779 KB,
99,8% do registro. Corrigir isso reduz o armazenamento em **156 vezes** e faz o sistema parar de
piorar a cada dia. Reescrever do zero resolveria o mesmo problema e custaria o projeto inteiro.

---

## 1. A pergunta

O sistema entrará em uso real no CEDIM da UNCISAL, em uma máquina virtual do servidor da
instituição. O serviço realiza **80 atendimentos por dia de segunda a sexta, podendo chegar a 100**.
Cabe decidir, antes de receber dado de paciente:

1. O banco de dados suporta esse crescimento com a tecnologia atual?
2. Vale reescrever o sistema com outra tecnologia, mais adequada ao volume?
3. Se o modelo for relacional, como estruturá-lo?

---

## 2. O volume, em números

| | |
|---|---|
| Atendimentos por dia | 80 a 100 |
| Dias úteis por ano | ~250 |
| **Registros por ano** | **20.000 a 25.000** |
| Registros em 20 anos (prazo de referência da Lei 13.787/2018) | 400.000 a 500.000 |

As projeções deste documento usam **25.000 por ano**, o limite superior, para que o dimensionamento
seja conservador.

> **O crescimento é linear, não exponencial.** Cada dia acrescenta um número aproximadamente
> constante de registros. Meio milhão de linhas em vinte anos é volume confortável para um banco
> relacional em hardware modesto — não é um problema de escala.

---

## 3. O que foi medido

A verificação técnica de 23/09/2026, feita com a aplicação em execução, mediu:

> **1 registro com 3 imagens = 781 KB no banco e 800 KB de resposta.**

A composição desses 781 KB é o dado central deste documento:

| Conteúdo | Tamanho | Fração do registro | Origem |
|---|---|---|---|
| JSON clínico (todos os campos da anamnese) | 1,7 KB | **0,2%** | calculado |
| Imagem do relatório (`imagem`) | ~500 KB | ~64% | *estimado* |
| Marcações das mamas (`imagemMamaA`, `imagemMamaB`) | ~280 KB | ~36% | *estimado* |

A medição de 23/09 registrou o **total** das três imagens (779 KB), não cada uma. A divisão entre
relatório e marcações é estimativa — o relatório é um HTML inteiro rasterizado, as marcações são dois
desenhos simples — e não afeta nenhuma conclusão: as duas saem do registro.

**As imagens são 99,8% do registro.** Toda a informação clínica — identificação, histórico mamário,
história reprodutiva, história familiar, hábitos e exame físico — cabe em menos de dois kilobytes.

As três imagens são gravadas como *data URL* base64 nas colunas `LONGTEXT` da própria tabela
`anamneses`, o que significa que acompanham a linha em qualquer consulta que não as exclua
explicitamente.

---

## 4. O cenário corrigido

Quatro mudanças, todas já catalogadas em [MELHORIAS.md](MELHORIAS.md):

| Item | Mudança |
|---|---|
| **C3** | Parar de gravar `imagem`. É um JPEG de um relatório HTML cujo conteúdo já está inteiro no JSON — gera-se sob demanda. |
| **B7** | Guardar as marcações como **coordenadas** (traços vetoriais), não como JPEG rasterizado. |
| **C1** | `select` sem as colunas de imagem, mais paginação. |
| **C2** | Promover `nome`, `cidade`, `dataEmissao` e `dataNascimento` a colunas indexadas. |

Resultado por registro:

| | Atual | Corrigido |
|---|---|---|
| JSON clínico | 1,7 KB | 1,7 KB |
| Imagem do relatório | ~500 KB | **removida** |
| Marcações das mamas | ~280 KB | 3,0 KB (vetorial) |
| Colunas promovidas e índices | — | 0,3 KB |
| **Total** | **781 KB** | **5,0 KB** |

**156 vezes menor.** E nenhuma informação clínica se perde: o relatório é reconstruível a partir do
JSON, e as marcações em vetor guardam **mais** do que o JPEG, porque continuam editáveis.

---

## 5. Armazenamento ao longo do tempo

A orientação definiu em 25/09/2026 que os registros são conservados **indefinidamente** (ver
[modelo-de-dados.md](modelo-de-dados.md), seção "Retenção dos registros"). Isso torna a projeção de
longo prazo um requisito de infraestrutura, não um exercício.

| Período | Registros | Atual | Corrigido |
|---|---|---|---|
| 1 ano | 25.000 | 18,6 GB | **0,12 GB** |
| 5 anos | 125.000 | 93,1 GB | **0,60 GB** |
| 20 anos | 500.000 | 372,4 GB | **2,38 GB** |
| 30 anos | 750.000 | 558,6 GB | **3,58 GB** |

Trinta anos de operação do CEDIM ocupariam **menos de 4 GB** — menos do que o sistema atual acumula
em três meses.

---

## 6. A resposta da tela de registros

Esta é a diferença mais importante, e não é de tamanho.

A tela `/registros` exibe apenas **nome, data e cidade**. Hoje ela baixa as três imagens de todos os
registros, sem paginação:

| Uso real | Registros | Atual | Corrigido |
|---|---|---|---|
| 1 semana | 500 | 400 MB | 5,5 KB |
| 1 mês | 2.000 | 1,5 GB | 5,5 KB |
| 1 ano | 25.000 | 19,1 GB | 5,5 KB |
| 20 anos | 500.000 | 381,5 GB | 5,5 KB |

**A coluna da direita não cresce.** É sempre uma página de 50 registros, com 113 bytes por linha.

A coluna da esquerda é proporcional ao banco inteiro, o que significa que o sistema **piora todos os
dias por construção**. Na prática, com 100 atendimentos diários a tela fica inviável em cerca de
**uma semana** de operação real.

---

## 7. O que isso muda na prática

**O backup deixa de ser um projeto.** Copiar 372 GB com retenção permanente é infraestrutura séria:
volume, janela de execução, custo e teste de restauração. Copiar 2,4 GB é rotina. A decisão de
guardar indefinidamente só é sustentável do lado corrigido da tabela.

Sobre o ambiente de demonstração: ele **está** no backup noturno do Proxmox — snapshot do CT inteiro,
2,1 GB por dia, retenção de dois dias, restauração nunca testada. Isso protege contra falha do host;
não é backup de banco com retenção compatível com guarda permanente, e não protege contra uma
exclusão descoberta três dias depois. Para dado real, o backup precisa ser do banco, com histórico
longo e restauração ensaiada. (Uma versão anterior deste parágrafo dizia que o ambiente estava fora do
backup — estava errada, copiada de um registro que a configuração do Proxmox não confirmava.)

**O dimensionamento da VM deixa de ser questão.** Qualquer máquina virtual modesta atende décadas.
Não há capacidade a negociar com a instituição.

**O gargalo sai do banco.** Com 5 KB por linha e índices em nome, paciente e data, meio milhão de
registros é volume tranquilo para o MySQL. A partir daí, o que limita o sistema é o que ele faz, não
o que ele guarda.

---

## 8. Por que não reescrever

Reescrever trocaria um problema de **modelagem**, que é localizado e já está catalogado, por um
projeto novo inteiro. O que se perderia:

| Ativo | Por que é caro |
|---|---|
| Definição clínica dos campos | Depende do tempo da orientação, não da equipe — é o ativo mais custoso do projeto |
| Esteira de implantação com reversão automática | Em produção desde 25/09; a reversão automática ainda não foi exercitada por falha real |
| Correções de segurança A1 a A4 | Concluídas em 25/09/2026 |
| Divisão de tarefas entre três pessoas | Acordada e em execução |

E há um argumento de **momento** que pesa mais que todos: o item **D4 continua sem resposta** — a
orientação ainda não definiu quais campos são obrigatórios nem o significado clínico de cada um.
Reescrever agora significa escolher um esquema definitivo para campos que ainda não foram definidos.
É o pior momento possível para congelar estrutura.

---

## 9. A estrutura relacional proposta

Modelo **híbrido**: colunas para o que se consulta, JSON para o que ainda não está definido.

```
paciente         id, nome, data_nascimento, documento, cidade, criado_em
                 └─ índice em (nome) e (documento)

anamnese         id, paciente_id, autor_id, criada_em, atualizada_em, dados JSON
                 └─ índice em (paciente_id, criada_em)

anamnese_versao  id, anamnese_id, autor_id, criada_em, dados JSON
                 └─ histórico: edição não sobrescreve

marcacao         id, anamnese_id, lado, tracos JSON
                 └─ vetorial, editável

usuario          id, email, senha, papel, ativo
                 └─ papel sustenta o escopo de permissões (A6)
```

**Por que não normalizar tudo.** Os campos clínicos ainda não têm definição (D4). Transformá-los em
colunas agora é apostar num esquema que vai mudar. Promova apenas o que se consulta, o que a lei
exige e o que precisa de integridade referencial; o restante permanece em JSON até o dicionário de
dados existir.

**Por que a tabela `paciente` é a mudança mais valiosa.** Com 80 a 100 atendimentos diários no mesmo
serviço, **a mesma paciente retorna**. Hoje cada anamnese é um registro isolado, com o nome digitado
à mão: não há histórico por paciente, e um erro de digitação cria uma segunda pessoa. Para um
serviço de rastreamento mamário, perder a continuidade entre exames da mesma mulher é perda
clínica, não inconveniência técnica. Esta é a única recomendação deste documento que **não** consta
do levantamento de 23/09.

**Sobre trocar de banco.** Começando de zero, o PostgreSQL seria a escolha melhor — `JSONB` e
índices parciais e de expressão favorecem exatamente esse modelo híbrido. Mas não é motivo para
migrar: o MySQL 8 tem tipo `JSON` e índices funcionais, e atende esse volume com folga. A troca
custaria semanas e entregaria pouco.

---

## 10. Ordem de execução

Por impacto real, não por gravidade nominal:

1. **C3** — parar de persistir a imagem do relatório. Elimina 64% de cada registro.
2. **C1** — `select` enxuto e paginação. Devolve a usabilidade da tela.
3. **B7** — marcações vetoriais. Virou requisito, não melhoria: a orientação definiu que anamnese
   **não se apaga, apenas se edita**, e uma marcação congelada em JPEG é incorrigível.
4. **C2** e tabela de pacientes — consulta e continuidade clínica.
5. **A6** e **C4** — papéis e autoria, exigências legais quando houver dado real.

Os três primeiros são dias de trabalho e resolvem por completo o colapso de desempenho.

---

## 11. Metodologia: o que é medido, calculado e estimado

Este documento distingue os três, para que ninguém leia projeção como medição.

**Medido**, com a aplicação em execução (23/09/2026): os 781 KB de um registro com três imagens e os
800 KB da resposta correspondente.

**Extrapolado** a partir dessa única medição: os 400 MB para 500 registros e todas as tabelas das
seções 5 e 6 — supõem que o registro medido é representativo.

**Calculado**: os 1,7 KB do JSON clínico. Foi montado um registro realista com **todos** os campos
do formulário preenchidos, incluindo textos livres de história da doença, parentesco e exame físico.
Um caso com descrições longas chega a 3 ou 4 KB, o que não altera nenhuma conclusão.

**Estimado**: a divisão dos 779 KB de imagem entre relatório (~500 KB) e marcações (~280 KB) — a
medição registrou só o total. E os 3,0 KB das marcações vetoriais, que supõem, por mama, um contorno de nódulo com 90
pontos e duas hachuras curtas de 30 pontos, em coordenadas inteiras. Uma marcação muito detalhada
pode chegar a 15 ou 20 KB somando as duas mamas — ainda assim cerca de **quinze vezes** menor que
os ~280 KB dos dois JPEG.

**Não medido**: o banco de demonstração está vazio, então não há como medir registros reais. Quando
houver, a conferência é uma consulta só, na seção seguinte.

---

## 12. Como reproduzir as contas

Medir os registros reais, quando existirem:

```sql
SELECT COUNT(*) AS registros,
       ROUND(AVG(LENGTH(data))/1024, 1)                          AS json_kb,
       ROUND(AVG(LENGTH(IFNULL(imagem, '')))/1024, 1)            AS relatorio_kb,
       ROUND(AVG(LENGTH(IFNULL(imagemMamaA, '')) +
                 LENGTH(IFNULL(imagemMamaB, '')))/1024, 1)       AS canvas_kb,
       ROUND(SUM(LENGTH(data) + LENGTH(IFNULL(imagem, '')) +
                 LENGTH(IFNULL(imagemMamaA, '')) +
                 LENGTH(IFNULL(imagemMamaB, '')))/1024/1024, 1)  AS total_mb
FROM anamneses;
```

Refazer as projeções deste documento:

```python
# python3 - < este bloco
MEDIDO_ATUAL_KB = 781      # medição de 23/09/2026
JSON_KB         = 1.7      # registro realista, todos os campos preenchidos
MARCACOES_KB    = 3.0      # traços vetoriais, 2 canvas
COLUNAS_KB      = 0.3      # colunas promovidas e índices
LINHA_LISTAGEM  = 113      # bytes por linha em /registros (id, nome, cidade, data)
POR_ANO         = 25_000   # 100 atendimentos/dia x 250 dias úteis

corrigido = JSON_KB + MARCACOES_KB + COLUNAS_KB
print(f"por registro: {MEDIDO_ATUAL_KB} KB -> {corrigido} KB "
      f"({MEDIDO_ATUAL_KB/corrigido:.0f}x menor)\n")

print(f"{'período':<10}{'registros':>10}{'atual':>12}{'corrigido':>12}")
for anos in (1, 5, 20, 30):
    n = POR_ANO * anos
    print(f"{str(anos)+' ano(s)':<10}{n:>10}"
          f"{n*MEDIDO_ATUAL_KB/1024/1024:>9.1f} GB"
          f"{n*corrigido/1024/1024:>9.2f} GB")

print(f"\nresposta de /registros (página de 50): "
      f"{50*LINHA_LISTAGEM/1024:.1f} KB, constante")
for n, rot in ((500, '1 semana'), (2_000, '1 mês'), (POR_ANO, '1 ano'), (POR_ANO*20, '20 anos')):
    print(f"  hoje, com {n} registros: {n*800/1024/1024:.1f} GB")
```

---

## 13. Conclusão

O sistema não precisa nascer de novo. Precisa **parar de guardar imagem dentro da linha** e ganhar
uma tabela de pacientes.

Dois números resumem a decisão: **156 vezes menos espaço**, e uma resposta que **para de crescer**.
Nenhum dos dois exige tecnologia diferente — ambos exigem modelagem correta, e a lista do que
corrigir já está escrita.

O que a mudança de contexto realmente traz de novo não é escala, é **obrigação**: dado de paciente
real em servidor da instituição significa backup testado, rastreabilidade de autoria, escopo de
permissões e conformidade com a LGPD, que trata dado de saúde como pessoal sensível. São requisitos
a acrescentar, não motivos para recomeçar.
