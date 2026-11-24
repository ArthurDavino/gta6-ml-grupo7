# Apresentação interativa (GTA VI × Machine Learning)

Apresentação em HTML, feita para rodar **offline no navegador** (Chrome recomendado). Não precisa
instalar nada. A demonstração do projeto acontece **dentro dos slides**.

## Como abrir

Dê dois cliques em `index.html`. Aperte **F** para tela cheia.

| Tecla | Ação |
|---|---|
| → / ← / espaço | próximo / anterior |
| N | notas de fala do slide |
| M | visão geral (todas as missões) |
| C | cronômetro |
| D | pula direto para a demonstração |
| Esc | fecha painéis |
| Ctrl + P | salva a apresentação em PDF |

## O que é interativo

- **Briefing:** alterna entre aprendizado supervisionado e não supervisionado.
- **4 etapas:** clique em cada etapa e veja o código real.
- **Dados:** compara os dados brutos, limpos e padronizados (linhas reais do projeto) e calcula o z-score.
- **K-Means ao vivo:** roda o algoritmo de Lloyd sobre os 2.000 jogadores, passo a passo.
  O botão "10 inícios" mostra por que o Python usa `n_init=10`.
- **Perfis + PCA:** passe o mouse nos pontos, escolha um perfil e veja o radar.
- **Regressão Logística:** arraste o controle da sigmoide; veja os pesos aprendidos.
- **Random Forest:** as 300 árvores reais do modelo votando em cada cenário.
- **Comparação:** mexa no limiar de decisão e veja a matriz de confusão mudar.
- **Planeje o golpe:** o `main.py` dentro da apresentação (mesmos modelos, mesmos resultados).
- **Terminal:** reproduz a saída real dos quatro scripts Python.

## Os modelos são os mesmos do Python

O arquivo `modelo_web.js` guarda os modelos **treinados no Python** (pesos da regressão logística,
as 300 árvores, centróides, PCA) em formato JavaScript. O navegador só faz as contas de inferência,
e dá o mesmo resultado do `main.py`. Mantenha todos os arquivos desta pasta juntos.

## Personalização

1. **Nomes do grupo e link do GitHub:** edite o começo de `app.js` (`EQUIPE` e `REPO_URL`).
2. **Imagens oficiais de Jason e Lucia (opcional):** as ilustrações atuais são arte original do
   projeto. Para usar imagens suas, coloque `jason.jpg` e `lucia.jpg` (ou `.png`/`.webp`) na pasta
   `apresentacao/img/` e recarregue. A troca é automática. Use só imagens que você tenha direito de usar.
3. **Notas de fala:** edite o array `NOTAS` em `app.js`.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | os 14 slides |
| `estilo.css` | visual |
| `app.js` | navegação, notas, cronômetro, configuração do grupo |
| `slides.js` | interatividade de cada slide |
| `modelo.js` | motor de inferência (padronização, K-Means, logística, floresta) |
| `arte.js` | ilustrações em SVG |
| `modelo_web.js` | modelos e dados exportados do Python (gerado) |
