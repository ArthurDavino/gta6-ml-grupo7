# GTA 6 — Perfis de jogadores e previsão de sucesso de golpes (Machine Learning)

Trabalho em grupo — **Grupo 7: Machine Learning (aprendizado supervisionado e não supervisionado)**.

O projeto simula dados de jogadores de GTA 6 e responde duas perguntas:

| Pergunta | Tipo de aprendizado | Técnica | Arquivo |
|---|---|---|---|
| "Que **tipos** de jogador existem?" | **Não supervisionado** (sem rótulo) | K-Means + PCA | `02_nao_supervisionado.py` |
| "Este golpe vai **dar certo**?" | **Supervisionado** (classificação) | Regressão Logística e Random Forest | `03_supervisionado.py` |

> Os dados são **simulados** (gerados por código). Não há dados reais do jogo.

## Integrantes

| Integrante | Responsabilidade principal |
|---|---|
| Arthur Davino | Geração e pré-processamento dos dados (`01_gerar_dados.py`) |
| Enzo Ura | Aprendizado não supervisionado: K-Means e PCA (`02_nao_supervisionado.py`) |
| Lorenzo Louzada | Aprendizado supervisionado: Regressão Logística e Random Forest (`03_supervisionado.py`) |
| Thiago Vilela | Demonstração (`main.py`), documentação e apresentação |

As contribuições de cada um estão identificadas nos commits do repositório.

## Estrutura

```
gta6-ml/
├── 01_gerar_dados.py          # Etapa 1: gera o CSV e faz o pré-processamento
├── 02_nao_supervisionado.py   # Etapa 2: K-Means e PCA (gráficos dos clusters)
├── 03_supervisionado.py       # Etapa 3: Random Forest x Regressão Logística
├── main.py                    # Etapa 4: menu interativo para a demonstração
├── requirements.txt
├── apresentacao/              # apresentação interativa (abra index.html no navegador)
├── COMO_RODAR.md              # guia: VS Code, PyCharm, terminal, Colab, erros comuns
├── GUIA_GITHUB.md             # passo a passo dos commits de cada integrante
├── ESTUDO_ARGUICAO.md         # roteiro de apresentação + perguntas prováveis
├── dados/                     # gerado: CSVs e tabelas de resultados
├── graficos/                  # gerado: imagens .png
└── modelos/                   # gerado: modelos treinados (.joblib)
```

Os 4 arquivos são independentes: **comunicam-se apenas por arquivos em disco**
(`dados/` e `modelos/`), nunca importando uns aos outros. Por isso cada aluno
pode trabalhar no seu sem conflito de merge.

## Como executar

Requer Python 3.10 ou superior.

```bash
# 1) (opcional) ambiente virtual
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

# 2) dependências
pip install -r requirements.txt

# 3) pipeline, na ordem
python 01_gerar_dados.py
python 02_nao_supervisionado.py
python 03_supervisionado.py

# 4) demonstração ao vivo
python main.py
```

Atalho: rode só `python main.py`. Se os modelos não existirem, ele oferece
gerar tudo sozinho (ou use a opção 5 do menu).

Dúvidas de instalação, IDE (VS Code, PyCharm), Google Colab ou erros comuns: veja o
[COMO_RODAR.md](COMO_RODAR.md). Python não precisa de compilador, só do interpretador.

## Apresentação interativa

A pasta `apresentacao/` tem uma apresentação em HTML com tema GTA VI, em que **o projeto roda
dentro dos slides** (K-Means ao vivo, 300 árvores votando, simulador de golpe com os mesmos
modelos do `main.py`). Abra `apresentacao/index.html` no navegador e aperte **F** para tela
cheia. Detalhes e personalização (nomes do grupo, imagens) em
[apresentacao/LEIAME.md](apresentacao/LEIAME.md).

## O que cada etapa produz

**Etapa 1 — `01_gerar_dados.py`**: 2.000 tentativas de golpe (ou outra quantidade: `python 01_gerar_dados.py 5000 --semente 7`), com valores
faltando, duplicatas e outliers de propósito. Limpa e pré-processa
(mediana para NaN, z-score, one-hot) e separa 80% treino / 20% teste. O
transformador é ajustado **só no treino** para evitar vazamento de dados.

**Etapa 2 — `02_nao_supervisionado.py`**: escolhe K por cotovelo + silhouette
(resultado: **K = 4**, silhouette ≈ 0,55), roda o K-Means (inclui uma versão
escrita do zero em numpy que dá o mesmo resultado) e projeta em 2D com PCA
(≈ 78% da variância nos 2 primeiros componentes). Perfis encontrados:
*Estrategista Furtivo*, *Pistoleiro Agressivo*, *Piloto de Fuga* e *Novato Casual*.
Mostra também o **silhouette de cada grupo** (quais perfis são mais coesos) e salva o gráfico
`graficos/02_silhouette_por_cluster.png`. Demais gráficos: `graficos/02_*.png`.

**Etapa 3 — `03_supervisionado.py`**: treina e compara os dois modelos
(valores aproximados, semente 42):

| Modelo | Acurácia (teste) | Validação cruzada |
|---|---|---|
| Linha de base (chutar a classe comum) | ≈ 54% | — |
| Regressão Logística | ≈ 71,5% | ≈ 73,4% |
| Random Forest | ≈ 75,0% | ≈ 77,5% |

AUC (área sob a curva ROC, todos os limiares): **0,787** na Regressão Logística e **0,832** na Random Forest.

A Random Forest vence porque o simulador cria **interações** (cada golpe valoriza
habilidades diferentes) que um modelo linear não captura bem. Salva a matriz de
confusão em `graficos/03_matriz_confusao.png` e a importância das variáveis em
`graficos/03_importancia_variaveis.png`; a curva ROC e a AUC dos dois modelos ficam em
`graficos/03_roc.png`. Inclui também uma regressão logística
escrita do zero (descida do gradiente), que chega a ≈ o mesmo resultado do scikit-learn.

**Etapa 4 — `main.py`**: menu no terminal com simulação de golpe digitando
os dados, 4 cenários prontos, descoberta de perfil, métricas (com AUC), re-treino e uma
**tabela-resumo** (opção 6) com o perfil e as chances de cada cenário pronto.
Mostra o perfil (K-Means), a probabilidade de sucesso nos dois modelos e uma
explicação do porquê (contribuição de cada variável na regressão logística).

## Divisão sugerida entre os 4 integrantes

| Integrante | Arquivo | Conteúdo teórico para dominar |
|---|---|---|
| Arthur | `01_gerar_dados.py` | Pré-processamento, z-score, one-hot, treino/teste, vazamento de dados |
| Enzo | `02_nao_supervisionado.py` | K-Means, cotovelo, silhouette, PCA |
| Lorenzo | `03_supervisionado.py` | Regressão logística, Random Forest, métricas, matriz de confusão, overfitting |
| Thiago | `main.py` + README | Fluxo completo, como o dado novo passa pelo pipeline, demonstração |

**Falas na apresentação (14 minutos no total, dentro dos 15 permitidos):** Arthur (slides 1 a 4, 3 min 35 s),
Enzo (5 a 7, 3 min 50 s), Lorenzo (8 a 10, primeira metade da demo, 3 min 25 s) e Thiago (segunda metade da
demo, 11 a 14, 3 min 10 s). Detalhes no
`ESTUDO_ARGUICAO.md`. A divisão de arquivos acima é para os commits e o estudo; a arguição cobre o
projeto inteiro de qualquer forma.

Requisito do trabalho: **no mínimo 3 commits por integrante**. Sugestão: cada um
faz commits pequenos e descritivos no seu arquivo (ex.: "adiciona limpeza de
duplicatas", "implementa silhouette", "adiciona gráfico de matriz de confusão").
Mas **todos precisam entender o projeto inteiro** — a arguição é individual
(7 pontos). Use o `ESTUDO_ARGUICAO.md`.

## Limitações (também vale mencionar na apresentação)

- Dados sintéticos: os modelos "descobrem" regras que nós mesmos escrevemos no gerador.
- A acurácia máxima é limitada pelo ruído sorteado de propósito (o acaso do jogo).
- Os dois modelos usam limiar fixo de 0,5 para decidir sucesso/fracasso.
- Melhorias possíveis: ajustar hiperparâmetros (`GridSearchCV`), testar Gradient
  Boosting, curva ROC/AUC, dados reais de partidas.
