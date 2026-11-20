"""
01_gerar_dados.py  —  ETAPA 1: dados simulados + pré-processamento
====================================================================
Projeto : GTA 6 — Perfis de jogadores e previsão de sucesso de golpes (heists)
Grupo 7 : Machine Learning (aprendizado supervisionado e não supervisionado)

O QUE ESTE ARQUIVO FAZ
    1. Simula 2.000 tentativas de golpe de jogadores de GTA 6 (dados sintéticos).
    2. "Suja" um pouco os dados (valores faltando, duplicatas, outliers), como
       acontece no mundo real.
    3. Limpa os dados e aplica o PRÉ-PROCESSAMENTO:
         - imputação da mediana (preenche valores faltantes);
         - padronização z-score (média 0, desvio 1);
         - one-hot encoding (transforma texto em colunas 0/1).
    4. Separa treino (80%) e teste (20%) e salva tudo em disco.

ARQUIVOS GERADOS (pasta dados/ e modelos/)
    dados/dados_gta6_bruto.csv       -> dados "sujos", como foram gerados
    dados/dados_gta6.csv             -> dados limpos (ainda em unidades originais)
    dados/treino_processado.csv      -> 80% dos dados, já padronizados
    dados/teste_processado.csv       -> 20% dos dados, já padronizados
    modelos/preprocessador.joblib    -> o "transformador" treinado (usado pelo
                                        02, pelo 03 e pelo main.py)

COMO RODAR
    python 01_gerar_dados.py
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Garante acentos corretos no terminal do Windows.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ----------------------------------------------------------------------------
# CONFIGURAÇÕES
# ----------------------------------------------------------------------------
SEMENTE = 42            # semente aleatória -> resultados reproduzíveis
N_JOGADORES = 2000      # quantidade de linhas (1 linha = 1 jogador + 1 golpe)
TAMANHO_TESTE = 0.20    # 20% para teste

RAIZ = Path(__file__).resolve().parent
PASTA_DADOS = RAIZ / "dados"
PASTA_MODELOS = RAIZ / "modelos"

# Colunas que descrevem o JOGADOR (usadas também no K-Means do arquivo 02)
COLUNAS_PERFIL = [
    "horas_semana", "nivel", "agressividade", "furtividade", "precisao_tiro",
    "habilidade_direcao", "hackeamento", "trabalho_equipe", "heists_anteriores",
]
# Colunas que descrevem o GOLPE
COLUNAS_GOLPE_NUM = ["tamanho_equipe", "planejamento_min", "dificuldade"]
COLUNAS_NUMERICAS = COLUNAS_PERFIL + COLUNAS_GOLPE_NUM
COLUNAS_CATEGORICAS = ["tipo_golpe"]
ALVO = "sucesso"        # 1 = golpe deu certo, 0 = deu errado

TIPOS_GOLPE = ["Banco", "Joalheria", "Carro-forte", "Cassino"]
DIFICULDADE_BASE = {"Banco": 6, "Joalheria": 4, "Carro-forte": 5, "Cassino": 8}

# Os 4 "arquétipos" (tipos de jogador) escondidos nos dados. O K-Means do
# arquivo 02 NÃO sabe disso: ele precisa DESCOBRIR esses grupos sozinho.
# Cada valor é a média (0–100) da habilidade naquele grupo.
ARQUETIPOS = {
    #                       agress furt  prec  dir  hack equipe horas nivel heists
    "Estrategista Furtivo": (25,   85,   55,   50,  85,  75,   18,   60,   12),
    "Pistoleiro Agressivo": (85,   25,   85,   50,  30,  55,   20,   55,   10),
    "Piloto de Fuga":       (50,   45,   50,   90,  40,  65,   16,   50,    8),
    "Novato Casual":        (45,   35,   30,   30,  25,  35,    4,   15,    1),
}


# ----------------------------------------------------------------------------
# PASSO 1 — GERAR DADOS SIMULADOS
# ----------------------------------------------------------------------------
def gerar_dados(rng: np.random.Generator) -> pd.DataFrame:
    """Cria o DataFrame com jogadores simulados."""
    nomes = list(ARQUETIPOS)
    n = N_JOGADORES

    # Cada jogador pertence a um arquétipo sorteado.
    escolhido = rng.integers(0, len(nomes), size=n)
    medias = np.array([ARQUETIPOS[nomes[i]] for i in escolhido], dtype=float)

    # -------------------------------------------------------------------
    # MATEMÁTICA: distribuição Normal (Gaussiana)
    #   x ~ N(mu, sigma^2). Sorteamos cada habilidade ao redor da média do
    #   arquétipo (mu) com um desvio padrão (sigma). Isso forma "nuvens" de
    #   pontos no espaço — é exatamente o que o K-Means tenta encontrar.
    # -------------------------------------------------------------------
    sigma = np.array([8, 8, 8, 8, 8, 8, 3, 8, 0], dtype=float)
    ruido = rng.normal(0, 1, size=medias.shape) * sigma
    valores = medias + ruido

    df = pd.DataFrame({
        "agressividade": valores[:, 0],
        "furtividade": valores[:, 1],
        "precisao_tiro": valores[:, 2],
        "habilidade_direcao": valores[:, 3],
        "hackeamento": valores[:, 4],
        "trabalho_equipe": valores[:, 5],
        "horas_semana": np.clip(valores[:, 6], 1, None),
        "nivel": np.clip(valores[:, 7], 1, 100),
        # Contagem de golpes passados: distribuição de Poisson (média = lambda)
        "heists_anteriores": rng.poisson(medias[:, 8]),
    })
    # As habilidades vão de 0 a 100.
    for col in ["agressividade", "furtividade", "precisao_tiro",
                "habilidade_direcao", "hackeamento", "trabalho_equipe"]:
        df[col] = df[col].clip(0, 100)

    # Características do golpe em si
    df["tipo_golpe"] = rng.choice(TIPOS_GOLPE, size=n)
    df["tamanho_equipe"] = rng.integers(1, 5, size=n)  # 1 a 4 jogadores
    df["planejamento_min"] = np.clip(rng.normal(40, 15, size=n), 5, 120)
    df["dificuldade"] = np.clip(
        df["tipo_golpe"].map(DIFICULDADE_BASE) + rng.integers(-1, 2, size=n), 1, 10
    )

    df[ALVO] = _simular_sucesso(df, rng)

    df.insert(0, "id_jogador", np.arange(1, n + 1))
    df = df.round(1)
    df["heists_anteriores"] = df["heists_anteriores"].astype(int)
    return df


def _simular_sucesso(df: pd.DataFrame, rng: np.random.Generator) -> np.ndarray:
    """Decide (com aleatoriedade) se cada golpe deu certo.

    MATEMÁTICA: probabilidade via função sigmoide (logística)
        p = 1 / (1 + e^(-z))      onde z é uma "pontuação" linear.
    z grande e positivo -> p perto de 1 (sucesso quase certo);
    z grande e negativo -> p perto de 0; z = 0 -> p = 0,5.

    Depois sorteamos sucesso ~ Bernoulli(p). Assim o resultado NÃO é
    determinístico: mesmo um jogador excelente pode falhar (ruído do jogo).

    Cada tipo de golpe valoriza habilidades diferentes. Isso cria INTERAÇÕES
    entre variáveis (ex.: hackear só importa no Cassino). Modelos lineares
    (Regressão Logística) têm dificuldade com isso; árvores (Random Forest)
    capturam melhor — por isso a comparação no arquivo 03 é interessante.
    """
    # Habilidades reescaladas para algo em torno de -2 .. +2
    f = lambda c: (df[c] - 50) / 25
    agr, fur, pre = f("agressividade"), f("furtividade"), f("precisao_tiro")
    dire, hack, eq = f("habilidade_direcao"), f("hackeamento"), f("trabalho_equipe")

    z = pd.Series(0.0, index=df.index)
    banco = df["tipo_golpe"] == "Banco"
    joia = df["tipo_golpe"] == "Joalheria"
    carro = df["tipo_golpe"] == "Carro-forte"
    cass = df["tipo_golpe"] == "Cassino"

    z[banco] = 0.9 * pre + 0.7 * dire + 0.2 * fur
    z[joia] = 1.1 * fur + 0.4 * hack - 0.6 * agr + 0.2 * pre
    z[carro] = 0.7 * pre + 0.7 * agr + 0.7 * dire
    z[cass] = 1.1 * hack + 0.6 * fur + 0.4 * eq - 0.4 * agr

    # Fatores que valem para qualquer golpe
    z += 0.35 * (df["tamanho_equipe"] - 2.5)                     # mais gente ajuda
    z += 1.0 * np.tanh((df["planejamento_min"] - 40) / 30)       # planejar ajuda (satura)
    z += 0.5 * np.clip((df["heists_anteriores"] - 6) / 6, -1, 2)  # experiência
    z += 0.4 * (df["nivel"] - 40) / 25
    z -= 0.55 * (df["dificuldade"] - 5)                          # difícil atrapalha
    z += rng.normal(0, 0.8, size=len(df))                        # ruído do acaso

    z -= z.median()                      # centraliza: ~50% de sucesso
    p = 1 / (1 + np.exp(-z))             # sigmoide
    return (rng.random(len(df)) < p).astype(int)


# ----------------------------------------------------------------------------
# PASSO 2 — "SUJAR" OS DADOS (para praticar a limpeza)
# ----------------------------------------------------------------------------
def sujar_dados(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    sujo = df.copy()
    n = len(sujo)

    # ~3% de valores faltando em 3 colunas (NaN = "Not a Number" = vazio)
    for col in ["planejamento_min", "precisao_tiro", "horas_semana"]:
        sujo.loc[rng.random(n) < 0.03, col] = np.nan

    # Alguns valores impossíveis (outliers/erros de digitação): habilidade > 100
    idx = rng.choice(n, size=10, replace=False)
    sujo.loc[idx, "hackeamento"] = 100 + rng.integers(10, 60, size=10)

    # 15 linhas duplicadas
    duplicadas = sujo.sample(15, random_state=SEMENTE)
    return pd.concat([sujo, duplicadas], ignore_index=True)


# ----------------------------------------------------------------------------
# PASSO 3 — LIMPEZA
# ----------------------------------------------------------------------------
def limpar_dados(df: pd.DataFrame) -> pd.DataFrame:
    limpo = df.drop_duplicates().reset_index(drop=True)
    # Habilidades só existem de 0 a 100: valores acima são erros -> limitamos.
    habilidades = ["agressividade", "furtividade", "precisao_tiro",
                   "habilidade_direcao", "hackeamento", "trabalho_equipe"]
    limpo[habilidades] = limpo[habilidades].clip(0, 100)
    return limpo


# ----------------------------------------------------------------------------
# PASSO 4 — PRÉ-PROCESSAMENTO (o coração deste arquivo)
# ----------------------------------------------------------------------------
def criar_preprocessador() -> ColumnTransformer:
    """Monta o transformador que será reaproveitado em todos os arquivos.

    MATEMÁTICA:
    (a) Imputação pela MEDIANA — substitui NaN pelo valor do meio da coluna.
        A mediana é preferida à média porque não é distorcida por outliers.

    (b) Padronização Z-SCORE — para cada coluna:
            z = (x - media) / desvio_padrao
        Resultado: média 0 e desvio 1. POR QUE? O K-Means e a Regressão
        Logística usam distâncias/pesos; sem padronizar, "horas_semana"
        (0–40) teria influência bem diferente de "furtividade" (0–100)
        só por causa da ESCALA, não da importância real.

    (c) One-hot encoding — "tipo_golpe" é texto. Transformamos em 4 colunas
        0/1 (tipo_golpe_Banco, tipo_golpe_Cassino, ...). Não usamos 1,2,3,4
        porque isso criaria uma ordem falsa (Cassino > Banco?).
    """
    numerico = Pipeline([
        ("imputar", SimpleImputer(strategy="median")),
        ("padronizar", StandardScaler()),
    ])
    return ColumnTransformer(
        transformers=[
            ("num", numerico, COLUNAS_NUMERICAS),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False),
             COLUNAS_CATEGORICAS),
        ],
        verbose_feature_names_out=False,   # nomes de coluna limpos
    )


def processar(df_limpo: pd.DataFrame):
    X = df_limpo[COLUNAS_NUMERICAS + COLUNAS_CATEGORICAS]
    y = df_limpo[ALVO]

    # Divisão treino/teste ESTRATIFICADA: mantém a mesma proporção de
    # sucesso/fracasso nos dois conjuntos.
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=TAMANHO_TESTE, random_state=SEMENTE, stratify=y
    )

    # IMPORTANTE (evitar "vazamento de dados" / data leakage):
    # média e desvio são calculados SÓ com o treino (fit). O teste apenas
    # recebe a transformação (transform). O teste simula dados "novos" que
    # o modelo nunca viu — não podemos deixar ele influenciar nada.
    prep = criar_preprocessador()
    A_tr = prep.fit_transform(X_tr)
    A_te = prep.transform(X_te)

    colunas = list(prep.get_feature_names_out())
    treino = pd.DataFrame(A_tr, columns=colunas, index=X_tr.index).assign(**{ALVO: y_tr})
    teste = pd.DataFrame(A_te, columns=colunas, index=X_te.index).assign(**{ALVO: y_te})
    return prep, treino, teste


# ----------------------------------------------------------------------------
# EXECUÇÃO
# ----------------------------------------------------------------------------
def main() -> None:
    PASTA_DADOS.mkdir(exist_ok=True)
    PASTA_MODELOS.mkdir(exist_ok=True)
    rng = np.random.default_rng(SEMENTE)

    print("=" * 60)
    print(" ETAPA 1 — Geração e pré-processamento dos dados")
    print("=" * 60)

    limpo_original = gerar_dados(rng)
    bruto = sujar_dados(limpo_original, rng)
    bruto.to_csv(PASTA_DADOS / "dados_gta6_bruto.csv", index=False)
    print(f"[1] Dados brutos gerados: {len(bruto)} linhas x {bruto.shape[1]} colunas")
    print(f"    Valores faltando por coluna (só as que têm):")
    faltando = bruto.isna().sum()
    for col, qtd in faltando[faltando > 0].items():
        print(f"      - {col}: {qtd}")
    print(f"    Linhas duplicadas: {bruto.duplicated().sum()}")
    print(f"    Habilidades acima de 100 (erro): {(bruto['hackeamento'] > 100).sum()}")

    limpo = limpar_dados(bruto)
    limpo.to_csv(PASTA_DADOS / "dados_gta6.csv", index=False)
    print(f"[2] Após limpeza: {len(limpo)} linhas (duplicatas removidas, "
          f"habilidades limitadas a 0–100)")

    prep, treino, teste = processar(limpo)
    treino.to_csv(PASTA_DADOS / "treino_processado.csv", index=False)
    teste.to_csv(PASTA_DADOS / "teste_processado.csv", index=False)
    joblib.dump(
        {"preprocessador": prep,
         "colunas_numericas": COLUNAS_NUMERICAS,
         "colunas_categoricas": COLUNAS_CATEGORICAS,
         "colunas_perfil": COLUNAS_PERFIL,
         "colunas_saida": list(prep.get_feature_names_out()),
         "tipos_golpe": TIPOS_GOLPE},
        PASTA_MODELOS / "preprocessador.joblib",
    )
    print(f"[3] Pré-processamento aplicado: treino={len(treino)} | teste={len(teste)}")
    print(f"    Colunas finais ({treino.shape[1] - 1} variáveis + alvo):")
    print("      " + ", ".join(c for c in treino.columns if c != ALVO))
    print(f"    Taxa de sucesso (treino): {treino[ALVO].mean():.1%} | "
          f"(teste): {teste[ALVO].mean():.1%}")

    # Prova de que a padronização funcionou: média ~0 e desvio ~1 no treino
    num = treino[COLUNAS_NUMERICAS]
    print(f"    Conferência z-score (treino): média máx |{num.mean().abs().max():.1e}| "
          f"| desvio ~ {num.std().mean():.2f}")
    print("\nPronto! Próximo passo: python 02_nao_supervisionado.py")


if __name__ == "__main__":
    main()
