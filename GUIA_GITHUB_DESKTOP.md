# Passo a passo no GitHub Desktop (sem terminal)

Para Enzo, Lorenzo e Thiago fazerem os commits. O Arthur também tem o dele (veja a última seção).

> **Os commits são de trabalho de verdade.** Em cada parte, o **commit 1** envia a **versão inicial** do arquivo e o **commit 2** troca pela **versão com uma melhoria nova** (aparece uma diferença real no histórico). Entenda e teste a sua melhoria antes de commitar: o professor pergunta sobre o seu código na arguição.

## Onde estão os arquivos

- **Versões iniciais** (para o commit 1): `Documentos\gta6-ml-grupo7\versoes_iniciais\` (tem `02_nao_supervisionado.py`, `03_supervisionado.py` e `main.py`).
- **Versões atuais, com a melhoria** (para o commit 2), e todo o resto: `Documentos\gta6-ml-grupo7\gta6-ml\`.

## 1. Preparar (uma vez)

1. Instale o **GitHub Desktop**: https://desktop.github.com
2. Entre na sua conta: **File → Options → Accounts → Sign in**.
3. Em **File → Options → Git** confira o **Name** e o **Email**. O e-mail precisa ser **o mesmo da conta do GitHub**, senão o commit não aparece como seu.
4. **Aceite o convite** do repositório (e-mail, ou https://github.com/ArthurDavino/gta6-ml-grupo7/invitations).

## 2. Clonar

**File → Clone repository… → aba URL**, cole `https://github.com/ArthurDavino/gta6-ml-grupo7`, escolha a pasta e clique em **Clone**. Depois abra a pasta clonada com **Repository → Show in Explorer** (Ctrl+Shift+F).

## 3. Como fazer cada commit

Para cada commit: (a) copie os arquivos para a pasta clonada (aceite **substituir** quando perguntar); (b) volte ao GitHub Desktop, aba **Changes**; (c) deixe marcados **só** os arquivos daquele commit (a caixa no topo da lista desmarca tudo); (d) escreva a mensagem em **Summary**; (e) clique em **Commit to main**. Só depois siga para o próximo commit.

### Enzo

| Commit | Copiar para a pasta clonada | Summary |
|---|---|---|
| 1 | `02_nao_supervisionado.py` de **versoes_iniciais** | Adiciona K-Means (do zero e sklearn) e PCA (02) |
| 2 | `02_nao_supervisionado.py` de **gta6-ml** (substitui) e `graficos/02_silhouette_por_cluster.png` | Adiciona grafico de silhouette por cluster no 02 |
| 3 | os 4 `graficos/02_*.png` antigos (cotovelo, pca_variancia, clusters_pca, perfis_heatmap), `dados/perfis_clusters.csv` e `dados/dados_com_clusters.csv` | Adiciona graficos e tabelas dos 4 perfis de jogador |

### Lorenzo

| Commit | Copiar para a pasta clonada | Summary |
|---|---|---|
| 1 | `03_supervisionado.py` de **versoes_iniciais** | Adiciona Regressao Logistica e Random Forest (03) |
| 2 | `03_supervisionado.py` de **gta6-ml** (substitui) e `graficos/03_roc.png` | Adiciona curva ROC e AUC ao 03 |
| 3 | `graficos/03_matriz_confusao.png`, `graficos/03_importancia_variaveis.png`, `dados/metricas_modelos.csv` e `ESTUDO_ARGUICAO.md` | Adiciona graficos, metricas (com AUC) e guia de estudo |

### Thiago

| Commit | Copiar para a pasta clonada | Summary |
|---|---|---|
| 1 | `main.py` de **versoes_iniciais** | Adiciona menu interativo para demonstracao (main.py) |
| 2 | `main.py` de **gta6-ml** (substitui) | Adiciona opcao 6 (tabela-resumo dos cenarios) e AUC nas metricas |
| 3 | `README.md`, `COMO_RODAR.md`, `GUIA_GITHUB.md`, `GUIA_GITHUB_DESKTOP.md` | Adiciona README e guias de execucao e de GitHub |
| 4 (extra) | a pasta `apresentacao/` inteira (8 arquivos) | Adiciona apresentacao interativa em HTML |

> O **commit 3 do Thiago coloca o README.md no repositório**, que o professor exige. Sem ele o repositório fica incompleto.

> Quem for fazer o **commit 2 do Thiago** deve fazê-lo depois do commit 2 do Lorenzo estar enviado, porque a opção 4 do `main.py` lê a coluna `auc` do `metricas_modelos.csv`. (Se a ordem for outra, nada quebra: o arquivo aceita CSV com ou sem AUC.)

## 4. Enviar (push) e conferir

1. Depois dos commits, clique em **Push origin** (topo). Se aparecer **Pull origin**, clique nele primeiro e depois em **Push origin**.
2. Confira em https://github.com/ArthurDavino/gta6-ml-grupo7/commits/main: devem aparecer os seus commits **com o seu nome e a sua foto**. Sem a foto ou com nome diferente, o e-mail do passo 1.3 não é o da conta do GitHub.

## 5. Arthur (já fez 5 commits; este é o 6º)

Na pasta do projeto (`gta6-ml`, já ligada ao GitHub) o `01_gerar_dados.py` aparece como alterado: a melhoria é poder escolher a quantidade de jogadores e a semente por linha de comando (`python 01_gerar_dados.py 5000 --semente 7`). No GitHub Desktop, adicione essa pasta com **File → Add local repository…**, marque só o `01_gerar_dados.py` e use o Summary:

> Permite escolher N de jogadores e semente por argumento no 01

## Problemas comuns

| Problema | O que fazer |
|---|---|
| "Repository not found" ao clonar | Você ainda não aceitou o convite (passo 1.4). |
| A lista Changes não mostra meu arquivo | Ele não foi copiado para a pasta clonada. Confira em **Show in Explorer**. |
| Commitei arquivo errado | Use **Edit → Undo** (Ctrl+Z) para desfazer o último commit. |
| Push recusado | **Pull origin** e depois **Push origin**. |
| Avisos de "LF will be replaced by CRLF" | Pode ignorar. |
