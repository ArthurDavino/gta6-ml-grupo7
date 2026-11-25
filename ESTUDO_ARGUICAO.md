# Guia de estudo — apresentação (até 15 min) e arguição individual

## Roteiro sugerido da apresentação (14 minutos, falas divididas por igual)

O enunciado permite no máximo 15 minutos (teoria e prática juntas). O roteiro soma **14 minutos**, deixando 1 minuto de folga, porque a demonstração e os cliques sempre tomam mais tempo do que o previsto. Slides da apresentação interativa (`apresentacao/index.html`):

| Tempo | Quem | Slides | Conteúdo |
|---|---|---|---|
| 0:00–3:35 | **Arthur** | 1 a 4 | Abertura, supervisionado x não supervisionado (com exemplos do mundo real), as 4 etapas e o pré-processamento (z-score, treino/teste) |
| 3:35–7:25 | **Enzo** | 5 a 7 | K-Means ao vivo, PCA e os 4 perfis, regressão logística |
| 7:25–10:50 | **Lorenzo** | 8 a 10 (1ª metade) | Random Forest (300 árvores votando), comparação dos modelos e início da demo (Lucia e Jason) |
| 10:50–14:00 | **Thiago** | 10 (2ª metade) a 14 | Demo com "perfil errado" e troca de golpe, terminal, limitações, como rodar e perguntas |

Os nomes aparecem no canto superior de cada slide e nas notas (tecla **N**).

Dica de demo: rode o cenário "Pistoleiro Agressivo na Joalheria (perfil errado p/ o golpe)"
e depois "Pistoleiro Agressivo no Carro-forte": o **mesmo jogador** tem chance baixa
num golpe e alta no outro — mostra que o modelo aprendeu interação entre perfil e golpe.

## Conceitos-chave (uma frase cada)

- **Aprendizado supervisionado**: aprende com exemplos que têm a resposta (rótulo) para prever a resposta de casos novos.
- **Não supervisionado**: não há rótulo; o algoritmo procura estrutura (grupos, padrões) nos dados.
- **Classificação**: prever uma categoria (aqui: sucesso/fracasso). Regressão seria prever um número.
- **Treino x teste**: o teste simula dados novos; avaliar no treino esconderia o overfitting.
- **Overfitting**: o modelo decora o treino e generaliza mal (acurácia treino ≫ acurácia teste).
- **Data leakage**: informação do teste vazando para o treino (ex.: calcular média usando todos os dados).

## Perguntas prováveis e respostas curtas

**Pré-processamento (arquivo 01)**
1. *Por que padronizar?* K-Means usa distância e a regressão logística usa pesos; sem z-score, variáveis em escala maior dominam só pela escala. Fórmula: `z = (x − μ) / σ`.
2. *Por que mediana e não média para preencher faltantes?* A mediana não é distorcida por outliers.
3. *Por que one-hot e não 1, 2, 3, 4?* Números criariam uma ordem falsa entre os tipos de golpe.
4. *Por que o scaler é ajustado só no treino?* Para o teste continuar sendo "dados nunca vistos" (evita vazamento).
5. *O que é estratificar?* Manter a proporção sucesso/fracasso igual em treino e teste.

**K-Means e PCA (arquivo 02)**
6. *Como o K-Means funciona?* Escolhe K centróides; repete (a) cada ponto vai ao centróide mais próximo e (b) cada centróide vira a média do seu grupo, até estabilizar. Minimiza a inércia `Σ ‖x − μ‖²`.
7. *Ele sempre acha a melhor solução?* Não: converge para um mínimo local. Por isso usamos `n_init=10` (várias inicializações) e ficamos com a menor inércia.
8. *Como escolheu K = 4?* Cotovelo (queda da inércia) e silhouette (maior em K = 4, ≈ 0,55). Silhouette: `s = (b − a) / max(a, b)`.
9. *K-Means usou a coluna `sucesso`?* Não. Depois comparamos as taxas de sucesso por grupo só para interpretar (validação externa).
10. *O que o PCA faz?* Encontra os eixos de maior variância (autovetores da matriz de covariância) para resumir 9 dimensões em 2 e poder desenhar. O clustering foi feito nas 9 dimensões; o PCA é só a "foto".
11. *Quanto da informação os 2 componentes guardam?* ≈ 78% (49% + 29%).
12. *Limitações do K-Means?* Precisa fixar K, assume grupos aproximadamente esféricos, sensível a escala e outliers.

**Supervisionado (arquivo 03)**
13. *Como a regressão logística gera probabilidade?* `z = w·x + b` e `p = 1 / (1 + e^(−z))` (sigmoide), que sempre fica entre 0 e 1.
14. *Como ela aprende?* Minimiza a log-loss `−[y·ln p + (1−y)·ln(1−p)]` por descida do gradiente: `w ← w − taxa · Xᵀ(p − y)/n`. Há uma versão escrita à mão no arquivo.
15. *Como a Random Forest funciona?* Muitas árvores, cada uma treinada numa amostra bootstrap e com subconjunto aleatório de variáveis em cada divisão; a decisão final é por votação.
16. *O que é impureza de Gini?* `G = 1 − Σ pₖ²`; 0 = nó puro. A árvore escolhe a divisão que mais reduz G.
17. *Por que a Random Forest foi melhor?* O simulador tem interações (cada golpe valoriza habilidades diferentes); árvores capturam isso, o modelo linear não.
18. *Por que a Random Forest tem gap treino–teste maior?* Árvores têm mais capacidade de se ajustar ao treino. Controlamos com `max_depth=8` e `min_samples_leaf=5`.
19. *Interprete a matriz de confusão.* VN/VP = acertos; FP = previu sucesso mas falhou; FN = previu falha mas deu certo. Precisão = `VP/(VP+FP)`; recall = `VP/(VP+FN)`; F1 = média harmônica.
20. *Acurácia basta?* Não, se as classes forem desbalanceadas; por isso olhamos também precisão, recall, F1 e comparamos com a linha de base (≈ 54%).
21. *O que é validação cruzada?* Dividir o treino em 5 partes, treinar em 4 e testar em 1, 5 vezes. A média e o desvio mostram estabilidade.

**Código e decisões**
22. *Por que `random_state`/semente fixa?* Reprodutibilidade: todos obtêm os mesmos números.
23. *Como o `main.py` trata um dado novo?* Monta uma linha, aplica o **mesmo** `preprocessador.joblib` do treino e entrega aos modelos.
24. *Por que usar bibliotecas?* scikit-learn está permitido, e implementamos K-Means e regressão logística do zero para provar que entendemos o que ele faz por dentro.
25. *Os dados são reais?* Não: são simulados; então o que mostramos é a **metodologia**, não uma conclusão sobre o jogo real.

## Perguntas sobre as melhorias de código (commits de desenvolvimento)

**O que é a curva ROC e a AUC? (Lorenzo, arquivo 03)**
A curva ROC liga, para todos os limiares possíveis, a taxa de verdadeiros positivos (recall) à taxa de falsos positivos. A AUC é a área sob ela: 0,5 é chute e 1,0 é perfeito. Resultado: 0,787 na logística e 0,832 na Random Forest. Interpretação: é a chance de o modelo dar nota maior a um golpe que deu certo do que a um que falhou. Vantagem: não depende do limiar de 0,5.

**Para que serve o silhouette por grupo? (Enzo, arquivo 02)**
O silhouette médio escolhe o K, mas esconde diferenças entre os grupos. Por grupo vemos quais perfis são mais coesos: o Novato Casual (0,67) é o mais bem separado; o Pistoleiro Agressivo (0,50) e o Piloto de Fuga (0,51) são um pouco mais próximos dos vizinhos. Nenhum jogador ficou com silhouette negativo (nenhum no grupo errado).

**Como o 01 recebe argumentos? (Arthur, arquivo 01)**
Com o módulo `argparse`: `python 01_gerar_dados.py 5000 --semente 7`. O primeiro argumento é a quantidade de jogadores (mínimo 200) e `--semente` muda os sorteios. Sem argumentos, o resultado é idêntico ao de antes (2.000 jogadores, semente 42). Se mudar, é preciso rodar o 02 e o 03 de novo.

**O que a opção 6 do main.py faz? (Thiago, main.py)**
Mostra, numa tabela, o perfil (K-Means), as probabilidades da logística e da floresta, a média e o veredito de cada um dos 4 cenários prontos, com os mesmos limites do veredito (60% e 40%), agora guardados em constantes (`LIMITE_ALTA` e `LIMITE_RISCO`) usadas pela função `classificar`.

