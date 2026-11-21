"""
02_nao_supervisionado.py  —  ETAPA 2: aprendizado NÃO supervisionado
======================================================================
Técnicas : K-Means (agrupamento) + PCA (redução de dimensionalidade)
Pergunta : "Existem TIPOS de jogadores de GTA 6 escondidos nos dados?"

DIFERENÇA-CHAVE (cai na arguição!)
    - Supervisionado   : tem a "resposta certa" (rótulo `sucesso`) e aprende a
                         prevê-la.  -> arquivo 03
    - NÃO supervisionado: NÃO usa rótulo nenhum. Procura estrutura sozinho.
                         Aqui o K-Means nunca vê a coluna `sucesso`.

PRÉ-REQUISITO : ter rodado 01_gerar_dados.py
SAÍDAS
    graficos/02_cotovelo_silhouette.png   -> como escolher o K
    graficos/02_pca_variancia.png         -> quanta informação cada componente guarda
    graficos/02_clusters_pca.png          -> os grupos desenhados em 2D
    graficos/02_perfis_heatmap.png        -> "personalidade" de cada grupo
    dados/perfis_clusters.csv             -> média de cada grupo (unidades originais)
    dados/dados_com_clusters.csv          -> cada jogador com seu grupo
    modelos/modelo_kmeans.joblib          -> usado pelo main.py

COMO RODAR
    python 02_nao_supervisionado.py
"""

import sys
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")  # só salva imagens, não abre janelas
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.optimize import linear_sum_assignment
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import adjusted_rand_score, silhouette_score

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SEMENTE = 42
RAIZ = Path(__file__).resolve().parent
PASTA_DADOS = RAIZ / "dados"
PASTA_MODELOS = RAIZ / "modelos"
PASTA_GRAFICOS = RAIZ / "graficos"

# Paleta amigável a daltônicos (Okabe-Ito)
CORES = ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00", "#56B4E9", "#F0E442", "#000000"]


# ----------------------------------------------------------------------------
# K-MEANS "DO ZERO" (só numpy) — para entender o que o sklearn faz por dentro
# ----------------------------------------------------------------------------
def kmeans_do_zero(X: np.ndarray, k: int, n_iter: int = 100, seed: int = 0):
    """Algoritmo de Lloyd, o K-Means clássico.

    MATEMÁTICA
        Objetivo: minimizar a INÉRCIA (soma das distâncias² até o centróide):
            J = sum_{j=1..k}  sum_{x em C_j}  || x - mu_j ||^2
        onde mu_j é o centróide (ponto médio) do grupo C_j.

        Repetimos 2 passos até nada mudar:
          1) ATRIBUIÇÃO : cada ponto vai para o centróide MAIS PRÓXIMO
                          (distância euclidiana ||x - mu||).
          2) ATUALIZAÇÃO: cada centróide vira a MÉDIA dos pontos do seu grupo
                          (a média é o ponto que minimiza a soma das dist.²).
        Cada passo nunca aumenta J, então o algoritmo sempre converge — mas
        pode parar num mínimo LOCAL. Por isso rodamos várias vezes (n_init)
        com centróides iniciais diferentes e ficamos com o menor J.
    """
    rng = np.random.default_rng(seed)
    melhor = None
    for _ in range(10):  # 10 reinicializações aleatórias
        centroides = X[rng.choice(len(X), size=k, replace=False)]
        for _ in range(n_iter):
            # distâncias de todos os pontos a todos os centróides: matriz (n x k)
            dist = np.linalg.norm(X[:, None, :] - centroides[None, :, :], axis=2)
            rotulos = dist.argmin(axis=1)                         # passo 1
            novos = np.array([
                X[rotulos == j].mean(axis=0) if np.any(rotulos == j) else centroides[j]
                for j in range(k)
            ])                                                    # passo 2
            if np.allclose(novos, centroides):
                break
            centroides = novos
        inercia = float(((X - centroides[rotulos]) ** 2).sum())
        if melhor is None or inercia < melhor[2]:
            melhor = (rotulos, centroides, inercia)
    return melhor


# ----------------------------------------------------------------------------
# ESCOLHA DO NÚMERO DE GRUPOS (K)
# ----------------------------------------------------------------------------
def avaliar_ks(X: np.ndarray, ks=range(2, 9)) -> pd.DataFrame:
    """Para cada K testado calcula inércia (cotovelo) e silhouette.

    MATEMÁTICA
      * Método do COTOVELO: a inércia J sempre cai quando K aumenta (no limite,
        K = n pontos dá J = 0). Procuramos o "cotovelo": o K a partir do qual
        a queda deixa de compensar.

      * SILHOUETTE: para cada ponto i
            a(i) = distância média até os outros pontos do MEU grupo
            b(i) = distância média até os pontos do grupo VIZINHO mais próximo
            s(i) = (b(i) - a(i)) / max(a(i), b(i))          em [-1, +1]
        s perto de +1 -> bem encaixado; ~0 -> na fronteira; negativo -> grupo
        errado. Usamos a média de s(i) como nota do agrupamento: maior = melhor.
    """
    linhas = []
    for k in ks:
        km = KMeans(n_clusters=k, n_init=10, random_state=SEMENTE).fit(X)
        linhas.append({"k": k, "inercia": km.inertia_,
                       "silhouette": silhouette_score(X, km.labels_)})
    return pd.DataFrame(linhas)


# ----------------------------------------------------------------------------
# NOMEAR OS GRUPOS (interpretação)
# ----------------------------------------------------------------------------
def nomear_clusters(centros_z: pd.DataFrame) -> dict:
    """Dá um nome legível a cada cluster olhando o centróide (em z-score).

    Cada nome tem uma "assinatura" (quais habilidades devem estar altas/baixas).
    O algoritmo húngaro (linear_sum_assignment) casa clusters e nomes de forma
    que NENHUM nome seja repetido, maximizando a pontuação total.
    """
    k = len(centros_z)
    if k != 4:
        return {i: f"Perfil {i + 1}" for i in range(k)}

    z = centros_z
    assinaturas = {
        "Estrategista Furtivo": z["furtividade"] + z["hackeamento"] - z["agressividade"],
        "Pistoleiro Agressivo": z["agressividade"] + z["precisao_tiro"] - z["furtividade"],
        "Piloto de Fuga": 2 * z["habilidade_direcao"],
        "Novato Casual": -(z["nivel"] + z["horas_semana"] + z["heists_anteriores"]),
    }
    nomes = list(assinaturas)
    pontos = np.array([[assinaturas[n].iloc[c] for n in nomes] for c in range(k)])
    linhas, colunas = linear_sum_assignment(pontos, maximize=True)
    return {int(c): nomes[n] for c, n in zip(linhas, colunas)}


# ----------------------------------------------------------------------------
# GRÁFICOS
# ----------------------------------------------------------------------------
def grafico_escolha_k(tab: pd.DataFrame, k_escolhido: int) -> None:
    fig, eixos = plt.subplots(1, 2, figsize=(11, 4))
    eixos[0].plot(tab["k"], tab["inercia"], "o-", color=CORES[0])
    eixos[0].set(title="Método do cotovelo", xlabel="Número de grupos (K)",
                 ylabel="Inércia (soma das distâncias²)")
    eixos[1].plot(tab["k"], tab["silhouette"], "o-", color=CORES[1])
    eixos[1].set(title="Coeficiente de silhouette (maior = melhor)",
                 xlabel="Número de grupos (K)", ylabel="Silhouette médio")
    for ax in eixos:
        ax.axvline(k_escolhido, ls="--", color="gray", label=f"K escolhido = {k_escolhido}")
        ax.grid(alpha=0.3)
        ax.legend()
    fig.tight_layout()
    fig.savefig(PASTA_GRAFICOS / "02_cotovelo_silhouette.png", dpi=130)
    plt.close(fig)


def grafico_variancia_pca(pca_total: PCA) -> None:
    var = pca_total.explained_variance_ratio_ * 100
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.bar(range(1, len(var) + 1), var, color=CORES[0], label="Por componente")
    ax.plot(range(1, len(var) + 1), np.cumsum(var), "o-", color=CORES[1], label="Acumulada")
    ax.set(title="PCA — variância explicada", xlabel="Componente principal",
           ylabel="% da variância total")
    ax.grid(alpha=0.3)
    ax.legend()
    fig.tight_layout()
    fig.savefig(PASTA_GRAFICOS / "02_pca_variancia.png", dpi=130)
    plt.close(fig)


def grafico_clusters(pca: PCA, X: np.ndarray, rotulos, nomes: dict, kmeans: KMeans) -> None:
    pontos = pca.transform(X)
    centros = pca.transform(kmeans.cluster_centers_)
    fig, ax = plt.subplots(figsize=(8, 6))
    for c in sorted(nomes):
        m = rotulos == c
        ax.scatter(pontos[m, 0], pontos[m, 1], s=14, alpha=0.55,
                   color=CORES[c % len(CORES)], label=f"{nomes[c]} (n={m.sum()})")
    ax.scatter(centros[:, 0], centros[:, 1], marker="X", s=220, c="white",
               edgecolors="black", linewidths=1.5, label="Centróides", zorder=5)
    v = pca.explained_variance_ratio_ * 100
    ax.set(title="Perfis de jogadores de GTA 6 (K-Means + PCA)",
           xlabel=f"Componente 1 ({v[0]:.1f}% da variância)",
           ylabel=f"Componente 2 ({v[1]:.1f}% da variância)")
    ax.grid(alpha=0.3)
    ax.legend(loc="best", fontsize=8)
    fig.tight_layout()
    fig.savefig(PASTA_GRAFICOS / "02_clusters_pca.png", dpi=130)
    plt.close(fig)


def grafico_heatmap(centros_z: pd.DataFrame, nomes: dict) -> None:
    dados = centros_z.rename(index=nomes)
    fig, ax = plt.subplots(figsize=(9, 4.5))
    im = ax.imshow(dados.values, cmap="RdBu_r", vmin=-2, vmax=2, aspect="auto")
    ax.set_xticks(range(dados.shape[1]), dados.columns, rotation=40, ha="right")
    ax.set_yticks(range(dados.shape[0]), dados.index)
    for i in range(dados.shape[0]):
        for j in range(dados.shape[1]):
            ax.text(j, i, f"{dados.values[i, j]:.1f}", ha="center", va="center", fontsize=8)
    ax.set_title("Centróide de cada grupo (em desvios-padrão da média geral)")
    fig.colorbar(im, ax=ax, label="z-score")
    fig.tight_layout()
    fig.savefig(PASTA_GRAFICOS / "02_perfis_heatmap.png", dpi=130)
    plt.close(fig)


# ----------------------------------------------------------------------------
# EXECUÇÃO
# ----------------------------------------------------------------------------
def main() -> None:
    caminho_prep = PASTA_MODELOS / "preprocessador.joblib"
    caminho_dados = PASTA_DADOS / "dados_gta6.csv"
    if not caminho_prep.exists() or not caminho_dados.exists():
        sys.exit("Arquivos da etapa 1 não encontrados. Rode antes: python 01_gerar_dados.py")
    PASTA_GRAFICOS.mkdir(exist_ok=True)

    print("=" * 60)
    print(" ETAPA 2 — Aprendizado NÃO supervisionado (K-Means + PCA)")
    print("=" * 60)

    # --- Carrega dados e aplica o MESMO pré-processamento da etapa 1 --------
    pacote = joblib.load(caminho_prep)
    prep, perfil = pacote["preprocessador"], pacote["colunas_perfil"]
    df = pd.read_csv(caminho_dados)
    Z = pd.DataFrame(prep.transform(df[pacote["colunas_numericas"] + pacote["colunas_categoricas"]]),
                     columns=pacote["colunas_saida"])
    # Só as características do JOGADOR (9 colunas). Tipo de golpe, dificuldade e
    # o resultado (`sucesso`) ficam de fora: queremos agrupar PESSOAS.
    X = Z[perfil].to_numpy()
    print(f"[1] {X.shape[0]} jogadores x {X.shape[1]} características de perfil (padronizadas)")

    # --- Escolha de K -------------------------------------------------------
    tab = avaliar_ks(X)
    print("\n[2] Escolha do número de grupos K")
    print(tab.to_string(index=False, float_format=lambda v: f"{v:,.3f}"))
    k = int(tab.loc[tab["silhouette"].idxmax(), "k"])
    print(f"    -> K = {k} (maior silhouette)")
    grafico_escolha_k(tab, k)

    # --- K-Means final (sklearn) e conferência com a versão "do zero" -------
    km = KMeans(n_clusters=k, n_init=10, random_state=SEMENTE).fit(X)
    rotulos = km.labels_
    rot0, _, inercia0 = kmeans_do_zero(X, k, seed=SEMENTE)
    ari = adjusted_rand_score(rotulos, rot0)
    print(f"\n[3] K-Means (sklearn): inércia = {km.inertia_:,.1f}")
    print(f"    K-Means do zero  : inércia = {inercia0:,.1f}")
    print(f"    Concordância entre as duas versões (Adjusted Rand Index) = {ari:.3f}  "
          f"(1.0 = grupos idênticos)")

    # --- PCA ----------------------------------------------------------------
    # MATEMÁTICA: PCA encontra novos eixos (componentes principais) que são
    # as direções de MAIOR VARIÂNCIA dos dados.
    #   1) matriz de covariância  C = (X^T X) / (n - 1)   (X já tem média 0)
    #   2) autovetores de C = direções dos eixos; autovalor lambda_i = variância
    #      ao longo do eixo i
    #   3) variância explicada do eixo i = lambda_i / soma(lambda)
    #   4) projeção: Z = X . W  (W = matriz com os autovetores escolhidos)
    # Usamos 2 componentes só para PODER DESENHAR 9 dimensões num plano 2D.
    # O K-Means foi feito nas 9 dimensões; o PCA é apenas a "foto" para mostrar.
    pca_total = PCA().fit(X)
    pca = PCA(n_components=2).fit(X)
    var = pca.explained_variance_ratio_ * 100
    print(f"\n[4] PCA: componente 1 = {var[0]:.1f}% | componente 2 = {var[1]:.1f}% "
          f"| juntas = {var.sum():.1f}% da variância")
    cargas = pd.DataFrame(pca.components_.T, index=perfil, columns=["PC1", "PC2"])
    for pc in ["PC1", "PC2"]:
        top = cargas[pc].abs().sort_values(ascending=False).head(3).index
        print(f"    {pc} é dominada por: " + ", ".join(f"{t} ({cargas.loc[t, pc]:+.2f})" for t in top))
    grafico_variancia_pca(pca_total)

    # --- Interpretação dos grupos ------------------------------------------
    centros_z = pd.DataFrame(km.cluster_centers_, columns=perfil)
    nomes = nomear_clusters(centros_z)
    df["cluster"] = rotulos
    df["perfil"] = df["cluster"].map(nomes)

    resumo = df.groupby("perfil")[perfil].mean().round(1)
    resumo.insert(0, "jogadores", df["perfil"].value_counts())
    resumo["taxa_sucesso"] = (df.groupby("perfil")["sucesso"].mean() * 100).round(1)
    print("\n[5] Perfil médio de cada grupo (unidades originais; taxa_sucesso em %):")
    print(resumo.T.to_string())
    print("\n    Repare: o K-Means NUNCA viu a coluna `sucesso`, mas os grupos têm taxas")
    print("    de sucesso diferentes -> os perfis descobertos têm significado real.")

    grafico_clusters(pca, X, rotulos, nomes, km)
    grafico_heatmap(centros_z, nomes)

    # --- Salva resultados ---------------------------------------------------
    resumo.to_csv(PASTA_DADOS / "perfis_clusters.csv")
    df.to_csv(PASTA_DADOS / "dados_com_clusters.csv", index=False)
    joblib.dump({"kmeans": km, "pca": pca, "nomes_clusters": nomes, "colunas_perfil": perfil},
                PASTA_MODELOS / "modelo_kmeans.joblib")
    print("\n[6] Gráficos salvos na pasta graficos/ (02_*.png)")
    print("Pronto! Próximo passo: python 03_supervisionado.py")


if __name__ == "__main__":
    main()
