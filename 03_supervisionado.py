"""
03_supervisionado.py  —  ETAPA 3: aprendizado SUPERVISIONADO
==============================================================
Tarefa  : CLASSIFICAÇÃO binária — prever `sucesso` (1 = golpe deu certo, 0 = falhou)
Modelos : Regressão Logística  x  Random Forest

Aprendizado SUPERVISIONADO = aprender com exemplos JÁ RESPONDIDOS.
    Entrada X (habilidades, tipo de golpe, equipe...)  ->  saída y (sucesso).
    O modelo ajusta seus parâmetros no TREINO e é avaliado no TESTE (dados que
    ele nunca viu) para sabermos se GENERALIZA, e não se só "decorou".

PRÉ-REQUISITO : ter rodado 01_gerar_dados.py
SAÍDAS
    graficos/03_matriz_confusao.png        -> acertos e erros de cada modelo
    graficos/03_importancia_variaveis.png  -> o que mais pesa na previsão
    graficos/03_roc.png                    -> curva ROC e AUC dos dois modelos
    dados/metricas_modelos.csv             -> tabela de métricas
    modelos/modelo_regressao_logistica.joblib
    modelos/modelo_random_forest.joblib    -> usados pelo main.py

COMO RODAR
    python 03_supervisionado.py
"""

import sys
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (ConfusionMatrixDisplay, accuracy_score, confusion_matrix,
                             f1_score, precision_score, recall_score, roc_auc_score,
                             roc_curve)
from sklearn.model_selection import StratifiedKFold, cross_val_score

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SEMENTE = 42
ALVO = "sucesso"
RAIZ = Path(__file__).resolve().parent
PASTA_DADOS = RAIZ / "dados"
PASTA_MODELOS = RAIZ / "modelos"
PASTA_GRAFICOS = RAIZ / "graficos"


# ----------------------------------------------------------------------------
# REGRESSÃO LOGÍSTICA "DO ZERO" (só numpy) — para entender o que acontece dentro
# ----------------------------------------------------------------------------
def regressao_logistica_do_zero(X: np.ndarray, y: np.ndarray, taxa=0.1, epocas=2000):
    """Treina uma regressão logística com DESCIDA DO GRADIENTE.

    MATEMÁTICA
      1) Pontuação linear:   z = w1*x1 + w2*x2 + ... + b   =   X.w + b
      2) Probabilidade (sigmoide):   p = 1 / (1 + e^(-z))      -> sempre em (0, 1)
      3) Função de perda (log-loss / entropia cruzada binária):
             L = -(1/n) * soma[ y*ln(p) + (1-y)*ln(1-p) ]
         Pune MUITO quando o modelo está confiante e errado (ex.: p=0,99 mas y=0).
      4) Gradiente (derivada de L em relação aos parâmetros):
             dL/dw = (1/n) * X^T (p - y)        dL/db = (1/n) * soma(p - y)
         Surpresa boa: a conta limpa, é só "erro = p - y" multiplicado pelos dados.
      5) Descida do gradiente: andar um passinho CONTRA o gradiente
             w <- w - taxa * dL/dw
         repetido milhares de vezes até a perda parar de cair.
    """
    n, d = X.shape
    w, b = np.zeros(d), 0.0
    for _ in range(epocas):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        erro = p - y
        w -= taxa * (X.T @ erro) / n
        b -= taxa * erro.mean()
    return w, b


def prever_do_zero(X, w, b):
    return (1 / (1 + np.exp(-(X @ w + b))) >= 0.5).astype(int)


# ----------------------------------------------------------------------------
# AVALIAÇÃO
# ----------------------------------------------------------------------------
def metricas(nome, modelo, X_tr, y_tr, X_te, y_te, cv) -> dict:
    """Calcula as métricas.

    MATEMÁTICA (VP/VN = acertos; FP/FN = erros)
      Matriz de confusão:           previsto 0 | previsto 1
                         real 0  :     VN      |    FP
                         real 1  :     FN      |    VP
      Acurácia  = (VP + VN) / total          -> % de acertos gerais
      Precisão  = VP / (VP + FP)             -> quando o modelo diz "vai dar
                                                certo", quantas vezes acerta?
      Recall    = VP / (VP + FN)             -> dos golpes que DERAM certo, quantos
                                                o modelo encontrou?
      F1        = 2 * precisão * recall / (precisão + recall)  (média harmônica)

      Validação cruzada (k-fold, k=5): divide o TREINO em 5 pedaços; treina em 4
      e testa em 1, rodando 5 vezes. A média diz quanto confiar na acurácia e o
      desvio padrão mostra a estabilidade.
    """
    pred_te = modelo.predict(X_te)
    cv_scores = cross_val_score(modelo, X_tr, y_tr, cv=cv, scoring="accuracy")
    return {
        "modelo": nome,
        "acuracia_treino": accuracy_score(y_tr, modelo.predict(X_tr)),
        "acuracia_teste": accuracy_score(y_te, pred_te),
        "precisao": precision_score(y_te, pred_te),
        "recall": recall_score(y_te, pred_te),
        "f1": f1_score(y_te, pred_te),
        "auc": roc_auc_score(y_te, modelo.predict_proba(X_te)[:, 1]),   # veja grafico_roc
        "cv_media": cv_scores.mean(),
        "cv_desvio": cv_scores.std(),
    }


def grafico_matrizes(modelos: dict, X_te, y_te) -> None:
    fig, eixos = plt.subplots(1, len(modelos), figsize=(5.5 * len(modelos), 4.8))
    for ax, (nome, modelo) in zip(np.atleast_1d(eixos), modelos.items()):
        pred = modelo.predict(X_te)
        acc = accuracy_score(y_te, pred)
        ConfusionMatrixDisplay(confusion_matrix(y_te, pred),
                               display_labels=["Falhou", "Sucesso"]).plot(
            ax=ax, cmap="Blues", colorbar=False, values_format="d")
        ax.set_title(f"{nome}\nAcurácia no teste: {acc:.1%}")
        ax.set_xlabel("Previsto pelo modelo")
        ax.set_ylabel("Resultado real")
    fig.tight_layout()
    fig.savefig(PASTA_GRAFICOS / "03_matriz_confusao.png", dpi=130)
    plt.close(fig)


def grafico_roc(modelos: dict, X_te, y_te) -> None:
    """Curva ROC e AUC: avalia o modelo em TODOS os limiares de decisão de uma vez.

    MATEMÁTICA: até agora decidimos "sucesso" quando p >= 0,5. Mas esse limiar é
    uma escolha. Para cada limiar possível calculamos dois números:
        TPR (taxa de verdadeiros positivos = recall) = VP / (VP + FN)
        FPR (taxa de falsos positivos)               = FP / (FP + VN)
    A curva ROC liga os pontos (FPR, TPR) de todos os limiares. A AUC é a ÁREA
    sob a curva:
        AUC = 0,5 -> o modelo "chuta" (a diagonal tracejada)
        AUC = 1,0 -> modelo perfeito
    Interpretação da AUC: é a probabilidade de o modelo dar uma nota MAIOR para um
    golpe que deu certo do que para um que falhou, sorteados ao acaso.
    O ponto grande em cada curva é onde o modelo fica com o limiar 0,5 do projeto.
    """
    cores = {"Regressão Logística": "#0072B2", "Random Forest": "#D55E00"}
    fig, ax = plt.subplots(figsize=(6.2, 5.6))
    for nome, modelo in modelos.items():
        p = modelo.predict_proba(X_te)[:, 1]
        fpr, tpr, _ = roc_curve(y_te, p)
        auc = roc_auc_score(y_te, p)
        ax.plot(fpr, tpr, lw=2.2, color=cores.get(nome), label=f"{nome} (AUC = {auc:.3f})")
        vn, fp, fn, vp = confusion_matrix(y_te, (p >= 0.5).astype(int)).ravel()
        ax.scatter(fp / (fp + vn), vp / (vp + fn), s=70, color=cores.get(nome), zorder=5,
                   edgecolor="white")
    ax.plot([0, 1], [0, 1], "k--", lw=1, label="chute (AUC = 0.500)")
    ax.set(title="Curva ROC (conjunto de teste)",
           xlabel="Taxa de falsos positivos (FPR)", ylabel="Taxa de verdadeiros positivos (recall)",
           xlim=(0, 1), ylim=(0, 1.02))
    ax.grid(alpha=0.3)
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(PASTA_GRAFICOS / "03_roc.png", dpi=130)
    plt.close(fig)


def grafico_importancias(lr, rf, colunas) -> None:
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))

    # Regressão logística: o COEFICIENTE w de cada variável (já padronizada).
    # w > 0 aumenta a chance de sucesso; w < 0 diminui. Como as variáveis estão
    # na mesma escala, |w| maior = variável mais influente.
    coef = pd.Series(lr.coef_[0], index=colunas).sort_values()
    ax1.barh(coef.index, coef.values,
             color=["#D55E00" if v < 0 else "#0072B2" for v in coef.values])
    ax1.set(title="Regressão Logística — coeficientes", xlabel="Peso (log-odds por 1 desvio-padrão)")
    ax1.axvline(0, color="black", lw=0.8)

    # Random Forest: importância = quanto cada variável reduziu a impureza de
    # Gini (média sobre todas as árvores). Soma 1; nunca é negativa.
    imp = pd.Series(rf.feature_importances_, index=colunas).sort_values()
    ax2.barh(imp.index, imp.values, color="#009E73")
    ax2.set(title="Random Forest — importância (Gini)", xlabel="Importância relativa")
    for ax in (ax1, ax2):
        ax.grid(axis="x", alpha=0.3)
    fig.tight_layout()
    fig.savefig(PASTA_GRAFICOS / "03_importancia_variaveis.png", dpi=130)
    plt.close(fig)


# ----------------------------------------------------------------------------
# EXECUÇÃO
# ----------------------------------------------------------------------------
def main() -> None:
    f_tr, f_te = PASTA_DADOS / "treino_processado.csv", PASTA_DADOS / "teste_processado.csv"
    if not f_tr.exists() or not f_te.exists():
        sys.exit("Arquivos da etapa 1 não encontrados. Rode antes: python 01_gerar_dados.py")
    PASTA_GRAFICOS.mkdir(exist_ok=True)
    PASTA_MODELOS.mkdir(exist_ok=True)

    print("=" * 60)
    print(" ETAPA 3 — Aprendizado SUPERVISIONADO (classificação)")
    print("=" * 60)

    treino, teste = pd.read_csv(f_tr), pd.read_csv(f_te)
    colunas = [c for c in treino.columns if c != ALVO]
    X_tr, y_tr = treino[colunas], treino[ALVO]
    X_te, y_te = teste[colunas], teste[ALVO]
    print(f"[1] Treino: {len(X_tr)} linhas | Teste: {len(X_te)} linhas | "
          f"{len(colunas)} variáveis de entrada")

    # Linha de base: sempre chutar a classe mais comum. Qualquer modelo útil
    # precisa vencer isso.
    base = max(y_te.mean(), 1 - y_te.mean())
    print(f"    Linha de base (chutar sempre a classe mais comum): {base:.1%}")

    # --- Modelo 1: Regressão Logística --------------------------------------
    lr = LogisticRegression(max_iter=1000, random_state=SEMENTE).fit(X_tr, y_tr)

    # --- Modelo 2: Random Forest --------------------------------------------
    # MATEMÁTICA
    #  * Árvore de decisão: faz perguntas do tipo "furtividade > 0,3?" e escolhe
    #    a pergunta que melhor SEPARA sucesso de fracasso. O critério é a
    #    impureza de Gini de um nó:   G = 1 - soma_k (p_k)^2
    #    (G = 0: nó puro; G = 0,5: mistura 50/50). Ganho = G(pai) - média ponderada
    #    de G(filhos).
    #  * Uma árvore sozinha DECORA o treino (overfitting). A Random Forest
    #    treina N árvores, cada uma com:
    #       - uma amostra aleatória com reposição dos dados (bagging/bootstrap);
    #       - só um subconjunto aleatório de variáveis a cada divisão
    #         (max_features = raiz de d).
    #    As árvores ficam diferentes entre si; a previsão final é a VOTAÇÃO
    #    da maioria. Os erros individuais se cancelam -> menor variância.
    #  * oob_score: cada árvore não viu ~37% dos dados (fora da amostra
    #    bootstrap); testar nesses dados dá uma acurácia "de graça".
    rf = RandomForestClassifier(
        n_estimators=300, max_depth=8, min_samples_leaf=5, max_features="sqrt",
        oob_score=True, random_state=SEMENTE, n_jobs=-1,
    ).fit(X_tr, y_tr)

    # --- Conferência: regressão logística escrita à mão ---------------------
    w, b = regressao_logistica_do_zero(X_tr.to_numpy(), y_tr.to_numpy())
    acc_zero = accuracy_score(y_te, prever_do_zero(X_te.to_numpy(), w, b))
    acc_lr = accuracy_score(y_te, lr.predict(X_te))
    print(f"\n[2] Regressão logística escrita do zero (descida do gradiente): "
          f"{acc_zero:.1%} no teste")
    print(f"    Regressão logística do sklearn:                              "
          f"{acc_lr:.1%} no teste (devem ser quase iguais)")

    # --- Comparação ---------------------------------------------------------
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEMENTE)
    modelos = {"Regressão Logística": lr, "Random Forest": rf}
    tabela = pd.DataFrame([metricas(n, m, X_tr, y_tr, X_te, y_te, cv) for n, m in modelos.items()])
    print("\n[3] Comparação dos modelos (métricas no TESTE, exceto onde indicado):")
    exibir = tabela.set_index("modelo").T
    exibir.index = ["acurácia (treino)", "acurácia (teste)", "precisão", "recall", "F1", "AUC",
                    "validação cruzada (média)", "validação cruzada (desvio)"]
    print(exibir.to_string(float_format=lambda v: f"{v:.3f}"))
    print(f"    Random Forest — acurácia OOB: {rf.oob_score_:.3f}")
    print("    AUC: 0,5 = chute e 1,0 = perfeito (área sob a curva ROC, todos os limiares).")

    for nome, m in modelos.items():
        vn, fp, fn, vp = confusion_matrix(y_te, m.predict(X_te)).ravel()
        print(f"\n    Matriz de confusão — {nome}: VN={vn} FP={fp} FN={fn} VP={vp}")

    melhor = tabela.loc[tabela["acuracia_teste"].idxmax(), "modelo"]
    dif = abs(tabela["acuracia_teste"].diff().iloc[-1])
    print(f"\n    >>> Melhor acurácia no teste: {melhor} (+{dif * 100:.1f} pontos percentuais sobre o outro)")
    gap = tabela.set_index("modelo")["acuracia_treino"] - tabela.set_index("modelo")["acuracia_teste"]
    print(f"    Gap treino-teste (sinal de overfitting): " +
          " | ".join(f"{n}: {g:+.1%}" for n, g in gap.items()))

    # --- Gráficos e arquivos -----------------------------------------------
    grafico_matrizes(modelos, X_te, y_te)
    grafico_roc(modelos, X_te, y_te)
    grafico_importancias(lr, rf, colunas)
    tabela.to_csv(PASTA_DADOS / "metricas_modelos.csv", index=False)
    joblib.dump({"modelo": lr, "colunas": colunas}, PASTA_MODELOS / "modelo_regressao_logistica.joblib")
    joblib.dump({"modelo": rf, "colunas": colunas}, PASTA_MODELOS / "modelo_random_forest.joblib")

    top = pd.Series(rf.feature_importances_, index=colunas).nlargest(5)
    print("\n[4] 5 variáveis mais importantes (Random Forest):")
    for nome, v in top.items():
        print(f"      {nome:<24s} {v:.3f}")
    print("\nGráficos salvos em graficos/ (03_*.png). Modelos salvos em modelos/.")
    print("Pronto! Para a demonstração ao vivo: python main.py")


if __name__ == "__main__":
    main()
