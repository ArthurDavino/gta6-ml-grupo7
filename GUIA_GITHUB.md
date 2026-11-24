# Guia do GitHub: no mínimo 3 commits por integrante

O professor confere os commits **de cada conta do GitHub**. Por isso cada integrante precisa fazer os
seus commits **no próprio computador e com a própria conta**. Não faça commits no nome de outra pessoa.

> **Os commits são de trabalho de verdade.** Em cada parte, o **commit 1** envia a **versão inicial** do arquivo e o **commit 2** troca pela **versão com uma melhoria nova**. Entenda e teste a sua melhoria antes de commitar: o professor pergunta sobre o seu código na arguição.
>
> Versões iniciais: `Documentos\gta6-ml-grupo7\versoes_iniciais\`. Versões atuais e o resto: `Documentos\gta6-ml-grupo7\gta6-ml\`. Sem terminal? Use o `GUIA_GITHUB_DESKTOP.md` (mesmo plano, com botões).

| Quem | Commit 1 | Commit 2 | Commit 3 |
|---|---|---|---|
| **Arthur** (já fez 5; este é o 6º) | `01_gerar_dados.py` com argumentos (N de jogadores e semente) | — | — |
| **Enzo** | `02_nao_supervisionado.py` (versão inicial) | `02` atual (silhouette por cluster) + `graficos/02_silhouette_por_cluster.png` | os 4 `graficos/02_*.png` antigos + `perfis_clusters.csv` + `dados_com_clusters.csv` |
| **Lorenzo** | `03_supervisionado.py` (versão inicial) | `03` atual (ROC e AUC) + `graficos/03_roc.png` | `03_matriz_confusao.png`, `03_importancia_variaveis.png`, `metricas_modelos.csv`, `ESTUDO_ARGUICAO.md` |
| **Thiago** | `main.py` (versão inicial) | `main.py` atual (opção 6 e AUC) | `README.md`, `COMO_RODAR.md`, `GUIA_GITHUB.md`, `GUIA_GITHUB_DESKTOP.md` + (extra) a pasta `apresentacao/` |

## 0. Todos: configurar a identidade (uma vez)

Use o **mesmo e-mail da conta do GitHub**, senão o commit não conta como seu.

```bash
git config --global user.name "Seu Nome"
git config --global user.email "email-da-sua-conta-github@exemplo.com"
```

## 1. Clonar (Enzo, Lorenzo e Thiago)

```bash
git clone https://github.com/ArthurDavino/gta6-ml-grupo7.git
cd gta6-ml-grupo7
```

Para cada commit, **copie os arquivos indicados para dentro da pasta clonada** (substituindo, quando for o caso), rode os comandos do seu bloco **um de cada vez** e, no fim, `git pull --rebase` e `git push`.

### Arthur (na pasta `gta6-ml`)

```bash
git add 01_gerar_dados.py
git commit -m "Permite escolher N de jogadores e semente por argumento no 01"
git push
```

### Enzo

```bash
# commit 1: copie 02_nao_supervisionado.py de versoes_iniciais
git add 02_nao_supervisionado.py
git commit -m "Adiciona K-Means (do zero e sklearn) e PCA (02)"
```

```bash
# commit 2: copie (substituindo) o 02 de gta6-ml e graficos/02_silhouette_por_cluster.png
git add 02_nao_supervisionado.py graficos/02_silhouette_por_cluster.png
git commit -m "Adiciona grafico de silhouette por cluster no 02"
```

```bash
# commit 3: copie os 4 graficos 02 antigos e os 2 CSVs de perfis
git add graficos/02_cotovelo_silhouette.png graficos/02_pca_variancia.png graficos/02_clusters_pca.png graficos/02_perfis_heatmap.png dados/perfis_clusters.csv dados/dados_com_clusters.csv
git commit -m "Adiciona graficos e tabelas dos 4 perfis de jogador"
```

```bash
git pull --rebase
git push
```

### Lorenzo

```bash
# commit 1: copie 03_supervisionado.py de versoes_iniciais
git add 03_supervisionado.py
git commit -m "Adiciona Regressao Logistica e Random Forest (03)"
```

```bash
# commit 2: copie (substituindo) o 03 de gta6-ml e graficos/03_roc.png
git add 03_supervisionado.py graficos/03_roc.png
git commit -m "Adiciona curva ROC e AUC ao 03"
```

```bash
# commit 3
git add graficos/03_matriz_confusao.png graficos/03_importancia_variaveis.png dados/metricas_modelos.csv ESTUDO_ARGUICAO.md
git commit -m "Adiciona graficos, metricas (com AUC) e guia de estudo"
```

```bash
git pull --rebase
git push
```

### Thiago

```bash
# commit 1: copie main.py de versoes_iniciais
git add main.py
git commit -m "Adiciona menu interativo para demonstracao (main.py)"
```

```bash
# commit 2: copie (substituindo) o main.py de gta6-ml
git add main.py
git commit -m "Adiciona opcao 6 (tabela-resumo dos cenarios) e AUC nas metricas"
```

```bash
# commit 3
git add README.md COMO_RODAR.md GUIA_GITHUB.md GUIA_GITHUB_DESKTOP.md
git commit -m "Adiciona README e guias de execucao e de GitHub"
```

```bash
# commit 4 (extra)
git add apresentacao/
git commit -m "Adiciona apresentacao interativa em HTML"
```

```bash
git pull --rebase
git push
```

> O commit 3 do Thiago coloca o **README.md** no repositório, que o professor exige.

## 2. Conferir

- No GitHub, aba **Commits**: devem aparecer os commits de cada um, com nome e foto.
- Sem foto ou com nome diferente: o e-mail do `git config` não é o da conta do GitHub.
- Qualquer um pode testar clonando em outra pasta e seguindo o README.

## Dicas rápidas

- `git status` mostra o que mudou; `git log --oneline` lista os commits.
- Push recusado: `git pull --rebase` e tente de novo.
- Mensagens curtas, com verbo no começo ("Adiciona…", "Corrige…").
