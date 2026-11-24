"""
main.py  —  ETAPA 4: menu interativo para a DEMONSTRAÇÃO AO VIVO
==================================================================
Reaproveita tudo que as etapas 1, 2 e 3 geraram:
    modelos/preprocessador.joblib          (etapa 1: padronização + one-hot)
    modelos/modelo_kmeans.joblib           (etapa 2: perfis de jogador)
    modelos/modelo_regressao_logistica.joblib
    modelos/modelo_random_forest.joblib    (etapa 3: previsão de sucesso)

FLUXO DE UMA PREVISÃO (ótimo para explicar na apresentação)
    entrada digitada -> mesma padronização do treino -> K-Means (qual perfil?)
                                                     -> Regressão Logística (prob.)
                                                     -> Random Forest (prob.)

IMPORTANTE: um dado novo PRECISA passar pelo mesmo pré-processamento (mesma
média e mesmo desvio do TREINO). Se não, o modelo receberia números em outra
escala do que aprendeu e erraria.

COMO RODAR
    python main.py
(se os modelos ainda não existirem, o menu oferece para gerá-los)
"""

import subprocess
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

RAIZ = Path(__file__).resolve().parent
PASTA_DADOS = RAIZ / "dados"
PASTA_MODELOS = RAIZ / "modelos"
ETAPAS = ["01_gerar_dados.py", "02_nao_supervisionado.py", "03_supervisionado.py"]
ARQUIVOS_NECESSARIOS = [
    PASTA_MODELOS / "preprocessador.joblib",
    PASTA_MODELOS / "modelo_kmeans.joblib",
    PASTA_MODELOS / "modelo_regressao_logistica.joblib",
    PASTA_MODELOS / "modelo_random_forest.joblib",
]

TIPOS_GOLPE = ["Banco", "Joalheria", "Carro-forte", "Cassino"]
DIFICULDADE_BASE = {"Banco": 6, "Joalheria": 4, "Carro-forte": 5, "Cassino": 8}

# (coluna, texto da pergunta, mínimo, máximo, valor padrão)
CAMPOS_GOLPE = [
    ("tamanho_equipe", "Tamanho da equipe (1 a 4 jogadores)", 1, 4, 3),
    ("planejamento_min", "Minutos de planejamento antes do golpe", 0, 120, 40),
    ("dificuldade", "Dificuldade do golpe (1 a 10)", 1, 10, None),  # padrão depende do tipo
]
CAMPOS_JOGADOR = [
    ("horas_semana", "Horas jogadas por semana", 1, 60, 15),
    ("nivel", "Nível do jogador (1 a 100)", 1, 100, 40),
    ("heists_anteriores", "Golpes já realizados", 0, 50, 5),
    ("agressividade", "Agressividade (0 a 100)", 0, 100, 50),
    ("furtividade", "Furtividade (0 a 100)", 0, 100, 50),
    ("precisao_tiro", "Precisão de tiro (0 a 100)", 0, 100, 50),
    ("habilidade_direcao", "Habilidade de direção/fuga (0 a 100)", 0, 100, 50),
    ("hackeamento", "Hackeamento (0 a 100)", 0, 100, 50),
    ("trabalho_equipe", "Trabalho em equipe (0 a 100)", 0, 100, 50),
]

# Cenários prontos para demonstrar rápido, sem digitar nada.
CENARIOS = {
    "Estrategista Furtivo na Joalheria": dict(
        tipo_golpe="Joalheria", tamanho_equipe=4, planejamento_min=70, dificuldade=4,
        horas_semana=18, nivel=60, heists_anteriores=12, agressividade=25, furtividade=88,
        precisao_tiro=55, habilidade_direcao=50, hackeamento=85, trabalho_equipe=75),
    "Pistoleiro Agressivo na Joalheria (perfil errado p/ o golpe)": dict(
        tipo_golpe="Joalheria", tamanho_equipe=2, planejamento_min=20, dificuldade=5,
        horas_semana=20, nivel=55, heists_anteriores=10, agressividade=90, furtividade=20,
        precisao_tiro=85, habilidade_direcao=50, hackeamento=30, trabalho_equipe=55),
    "Pistoleiro Agressivo no Carro-forte": dict(
        tipo_golpe="Carro-forte", tamanho_equipe=4, planejamento_min=50, dificuldade=5,
        horas_semana=20, nivel=55, heists_anteriores=10, agressividade=88, furtividade=25,
        precisao_tiro=88, habilidade_direcao=60, hackeamento=30, trabalho_equipe=60),
    "Novato Casual sozinho no Cassino": dict(
        tipo_golpe="Cassino", tamanho_equipe=1, planejamento_min=10, dificuldade=9,
        horas_semana=4, nivel=12, heists_anteriores=0, agressividade=45, furtividade=30,
        precisao_tiro=30, habilidade_direcao=30, hackeamento=20, trabalho_equipe=30),
}


# ----------------------------------------------------------------------------
# CARREGAMENTO
# ----------------------------------------------------------------------------
def rodar_pipeline() -> bool:
    """Executa as etapas 1, 2 e 3 em sequência (usando o mesmo Python)."""
    for arquivo in ETAPAS:
        print(f"\n>>> Executando {arquivo} ...")
        resultado = subprocess.run([sys.executable, str(RAIZ / arquivo)], cwd=RAIZ)
        if resultado.returncode != 0:
            print(f"Erro ao executar {arquivo}. Veja a mensagem acima.")
            return False
    return True


def carregar_modelos() -> dict | None:
    if any(not a.exists() for a in ARQUIVOS_NECESSARIOS):
        return None
    prep = joblib.load(PASTA_MODELOS / "preprocessador.joblib")
    return {
        "prep": prep,
        "kmeans": joblib.load(PASTA_MODELOS / "modelo_kmeans.joblib"),
        "lr": joblib.load(PASTA_MODELOS / "modelo_regressao_logistica.joblib")["modelo"],
        "rf": joblib.load(PASTA_MODELOS / "modelo_random_forest.joblib")["modelo"],
    }


# ----------------------------------------------------------------------------
# ENTRADA DE DADOS
# ----------------------------------------------------------------------------
def ler_numero(texto, minimo, maximo, padrao):
    """Lê um número validando o intervalo. ENTER usa o valor padrão."""
    while True:
        bruto = input(f"  {texto} [{padrao}]: ").strip().replace(",", ".")
        if bruto == "":
            return padrao
        try:
            valor = float(bruto)
        except ValueError:
            print("    Digite um número.")
            continue
        if not minimo <= valor <= maximo:
            print(f"    O valor deve estar entre {minimo} e {maximo}.")
            continue
        return int(valor) if valor.is_integer() else valor


def ler_tipo_golpe() -> str:
    print("\n  Tipo de golpe:")
    for i, t in enumerate(TIPOS_GOLPE, 1):
        print(f"    {i}) {t}")
    while True:
        bruto = input("  Escolha [1-4]: ").strip()
        if bruto.isdigit() and 1 <= int(bruto) <= len(TIPOS_GOLPE):
            return TIPOS_GOLPE[int(bruto) - 1]
        print("    Opção inválida.")


def coletar_entrada(somente_perfil: bool = False) -> dict:
    entrada = {}
    if not somente_perfil:
        entrada["tipo_golpe"] = ler_tipo_golpe()
        print("\n  --- Dados do golpe (ENTER = valor entre colchetes) ---")
        for col, texto, mn, mx, pad in CAMPOS_GOLPE:
            if pad is None:
                pad = DIFICULDADE_BASE[entrada["tipo_golpe"]]
            entrada[col] = ler_numero(texto, mn, mx, pad)
    print("\n  --- Dados do jogador (ENTER = valor entre colchetes) ---")
    for col, texto, mn, mx, pad in CAMPOS_JOGADOR:
        entrada[col] = ler_numero(texto, mn, mx, pad)
    return entrada


# ----------------------------------------------------------------------------
# PREVISÃO
# ----------------------------------------------------------------------------
def transformar(m: dict, entrada: dict) -> pd.DataFrame:
    """Aplica o pré-processamento da etapa 1 a UMA linha nova."""
    pacote = m["prep"]
    linha = pd.DataFrame([entrada])[pacote["colunas_numericas"] + pacote["colunas_categoricas"]]
    return pd.DataFrame(pacote["preprocessador"].transform(linha), columns=pacote["colunas_saida"])


def barra(p: float, largura: int = 20) -> str:
    cheio = round(p * largura)
    return "█" * cheio + "░" * (largura - cheio)


def descobrir_perfil(m: dict, z: pd.DataFrame) -> tuple[str, float]:
    """K-Means: o perfil é o do centróide MAIS PRÓXIMO (distância euclidiana)."""
    pacote = m["kmeans"]
    x = z[pacote["colunas_perfil"]].to_numpy()
    cluster = int(pacote["kmeans"].predict(x)[0])
    distancia = float(np.linalg.norm(x[0] - pacote["kmeans"].cluster_centers_[cluster]))
    return pacote["nomes_clusters"][cluster], distancia


def prever(m: dict, entrada: dict, titulo: str = "") -> None:
    z = transformar(m, entrada)
    perfil, dist = descobrir_perfil(m, z)
    p_lr = float(m["lr"].predict_proba(z)[0, 1])
    p_rf = float(m["rf"].predict_proba(z)[0, 1])
    media = (p_lr + p_rf) / 2

    print("\n" + "=" * 62)
    print(f" RESULTADO {('— ' + titulo) if titulo else ''}")
    print("=" * 62)
    print(f" Golpe : {entrada['tipo_golpe']} | equipe de {entrada['tamanho_equipe']} | "
          f"dificuldade {entrada['dificuldade']} | planejamento {entrada['planejamento_min']} min")
    print(f" Perfil do jogador (K-Means, não supervisionado): {perfil}")
    print(f"   distância ao centróide do grupo: {dist:.2f} (menor = mais típico do grupo)")
    print("\n Chance de SUCESSO (supervisionado):")
    print(f"   Regressão Logística : {p_lr:6.1%}  {barra(p_lr)}")
    print(f"   Random Forest       : {p_rf:6.1%}  {barra(p_rf)}")

    if media >= 0.60:
        veredito = "ALTA chance de sucesso — pode ir!"
    elif media >= 0.40:
        veredito = "RISCO ALTO — resultado incerto, vale melhorar o plano."
    else:
        veredito = "BAIXA chance de sucesso — melhor repensar o golpe."
    print(f"\n Veredito (média dos modelos = {media:.1%}): {veredito}")
    if abs(p_lr - p_rf) >= 0.15:
        print(" Obs.: os modelos DISCORDAM bastante. A Random Forest captura interações")
        print("       (ex.: hackear só importa no Cassino); a logística é linear.")

    # Explicabilidade da regressão logística:
    # log-odds = b + soma(w_i * z_i). Cada termo w_i * z_i é a contribuição da
    # variável i para a decisão — positivo ajuda, negativo atrapalha.
    contrib = pd.Series(m["lr"].coef_[0] * z.iloc[0].to_numpy(), index=z.columns)
    contrib = contrib[~contrib.index.str.startswith("tipo_golpe_")]
    print("\n Por que? (contribuição de cada variável na Regressão Logística)")
    print("   [+ ajuda / - atrapalha]   (valor informado entre parênteses)")
    for nome, v in contrib[contrib > 0.005].nlargest(3).items():
        print(f"   + {nome:<20s} {v:+.2f}   ({entrada[nome]})")
    for nome, v in contrib[contrib < -0.005].nsmallest(3).items():
        print(f"   - {nome:<20s} {v:+.2f}   ({entrada[nome]})")
    print(" (dados simulados — projeto acadêmico, não é um jogo real)")


# ----------------------------------------------------------------------------
# OPÇÕES DO MENU
# ----------------------------------------------------------------------------
def opcao_prever(m):
    print("\n--- Simular um golpe ---")
    prever(m, coletar_entrada())


def opcao_cenarios(m):
    nomes = list(CENARIOS)
    print("\n--- Cenários prontos ---")
    for i, n in enumerate(nomes, 1):
        print(f"  {i}) {n}")
    print(f"  {len(nomes) + 1}) Rodar TODOS em sequência")
    bruto = input("Escolha: ").strip()
    if not bruto.isdigit() or not 1 <= int(bruto) <= len(nomes) + 1:
        print("Opção inválida.")
        return
    escolhidos = nomes if int(bruto) == len(nomes) + 1 else [nomes[int(bruto) - 1]]
    for n in escolhidos:
        prever(m, CENARIOS[n], n)


def opcao_perfil(m):
    print("\n--- Descobrir o perfil de um jogador (K-Means) ---")
    entrada = coletar_entrada(somente_perfil=True)
    entrada.update(tipo_golpe="Banco", tamanho_equipe=3, planejamento_min=40, dificuldade=6)
    perfil, dist = descobrir_perfil(m, transformar(m, entrada))
    print(f"\n >>> Este jogador pertence ao grupo: {perfil} (distância {dist:.2f})")
    print("     O K-Means comparou o jogador com o centróide de cada grupo")
    print("     e escolheu o mais próximo.")


def opcao_metricas(_m):
    arquivo = PASTA_DADOS / "metricas_modelos.csv"
    if not arquivo.exists():
        print("Métricas não encontradas. Rode a etapa 3.")
        return
    t = pd.read_csv(arquivo).set_index("modelo").T
    t.index = ["acurácia (treino)", "acurácia (teste)", "precisão", "recall", "F1",
               "validação cruzada (média)", "validação cruzada (desvio)"]
    print("\n--- Métricas dos modelos (conjunto de TESTE) ---")
    print(t.to_string(float_format=lambda v: f"{v:.3f}"))
    perfis = PASTA_DADOS / "perfis_clusters.csv"
    if perfis.exists():
        print("\n--- Perfis encontrados pelo K-Means (médias; taxa_sucesso em %) ---")
        print(pd.read_csv(perfis).set_index("perfil").T.to_string())
    print("\nGráficos (abra para mostrar na apresentação): pasta graficos/")


def opcao_retreinar(_m):
    if rodar_pipeline():
        print("\nTudo regenerado com sucesso.")


# ----------------------------------------------------------------------------
# PROGRAMA PRINCIPAL
# ----------------------------------------------------------------------------
MENU = """
==============================================================
   GTA 6 — Machine Learning: perfis e previsão de golpes
==============================================================
 1) Simular um golpe (digitar os dados)
 2) Cenários prontos (demonstração rápida)
 3) Descobrir o perfil de um jogador (K-Means)
 4) Ver métricas dos modelos e perfis encontrados
 5) Gerar dados e treinar tudo de novo (etapas 1, 2 e 3)
 0) Sair
"""
ACOES = {"1": opcao_prever, "2": opcao_cenarios, "3": opcao_perfil,
         "4": opcao_metricas, "5": opcao_retreinar}


def main() -> None:
    modelos = carregar_modelos()
    if modelos is None:
        print("Os modelos ainda não foram treinados (etapas 1, 2 e 3).")
        if input("Gerar agora? Leva alguns segundos [S/n]: ").strip().lower() in ("", "s", "sim"):
            if not rodar_pipeline():
                return
            modelos = carregar_modelos()
        if modelos is None:
            return

    while True:
        print(MENU)
        try:
            escolha = input("Opção: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nAté a próxima!")
            return
        if escolha == "0":
            print("Até a próxima!")
            return
        if escolha not in ACOES:
            print("Opção inválida.")
            continue
        try:
            ACOES[escolha](modelos)
            if escolha == "5":  # recarrega os modelos recém-treinados
                modelos = carregar_modelos() or modelos
        except (EOFError, KeyboardInterrupt):
            print("\nAté a próxima!")
            return


if __name__ == "__main__":
    main()
