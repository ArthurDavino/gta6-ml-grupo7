/* app.js — estrutura da apresentação: navegação, notas, visão geral, cronômetro, fundo animado */
"use strict";

/* ============ CONFIGURE AQUI (nomes do grupo e link do GitHub) ============ */
const EQUIPE = ["Arthur Davino", "Enzo Ura", "Lorenzo Louzada", "Thiago Vilela"];
const REPO_URL = "https://github.com/ArthurDavino/gta6-ml-grupo7";   // repositório do grupo
/* ========================================================================== */

const slides = [...document.querySelectorAll(".slide")];
/* Tempo previsto por slide (total 14 min, deixando 1 min de folga dos 15 permitidos). O slide 10 é dividido entre dois integrantes. */
const TEMPOS = ["0:35", "0:55", "0:35", "1:30", "1:30", "1:10", "1:10", "1:10", "1:15", "2:00 (1:00 cada)", "0:40", "0:45", "0:20", "0:25"];
let current = 0, overviewOpen = false, helpOpen = false, timerRunning = false, seconds = 0, timerHandle = null;
const $ = (q) => document.querySelector(q), $$ = (q) => [...document.querySelectorAll(q)];
const quem = (s, curto) => s.dataset.person.split(",").map((i) => (curto ? EQUIPE[+i].split(" ")[0] : EQUIPE[+i])).join(" + ");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Notas de fala por slide (aperte N para ver). Quem fala: ver data-person de cada slide. */
const NOTAS = [
  ["Abertura. Apresentar o grupo e o tema: usamos o universo de GTA 6 como cenário para mostrar aprendizado supervisionado e não supervisionado.",
   "Avisar a turma: os dados são simulados, mas os algoritmos são reais, e a demonstração roda aqui dentro, com os mesmos modelos do código Python.",
   "Tempo total previsto: 14 minutos, teoria e prática (o limite é 15). Clique em 'Iniciar missão'."],
  ["Supervisionado: temos o gabarito (o golpe deu certo ou não) e o modelo aprende a prever isso para casos novos.",
   "Não supervisionado: não existe gabarito. O algoritmo agrupa jogadores parecidos sem saber quem é quem.",
   "Clique nos dois cartões e use o botão do gráfico para mostrar a diferença: de um lado os pontos têm cor (resposta conhecida); do outro, só depois de agrupar."],
  ["São quatro scripts independentes: 01 gera e prepara os dados, 02 faz o não supervisionado, 03 o supervisionado e main.py é o menu da demonstração.",
   "Um script não importa o outro: eles trocam arquivos (CSV e modelos salvos). Por isso cada integrante pôde cuidar de uma etapa no GitHub.",
   "Clique em cada etapa para mostrar o arquivo e um trecho do código real."],
  ["Os dados têm defeitos de propósito: valores faltando, duplicatas e habilidades acima de 100. A aba Bruto mostra isso; Limpo mostra a correção; Padronizado mostra o resultado final.",
   "Z-score: z = (x − média) / desvio. Sem padronizar, uma variável de escala maior dominaria o K-Means e a regressão só por causa da escala. Use a calculadora para mostrar um exemplo.",
   "One-hot transforma o tipo de golpe em colunas 0 e 1. Separamos 80% treino e 20% teste, e o padronizador é ajustado só no treino para evitar vazamento de dados."],
  ["K-Means repete dois passos: atribui cada ponto ao centróide mais próximo e recalcula cada centróide como a média do grupo. Minimiza a inércia J.",
   "Aperte Rodar e veja os centróides andando. Se ficar preso num resultado ruim, é um mínimo local: por isso o Python usa n_init = 10. O botão '10 inícios' faz isso.",
   "Para escolher K: cotovelo e silhouette. As barras mostram o silhouette de cada K; o maior é K = 4 (0,55). Clique nas barras para trocar K."],
  ["O PCA não faz o agrupamento: o K-Means foi feito nas 9 dimensões. O PCA só serve para desenhar em 2D, guardando 77,8% da variância.",
   "Clique nos perfis para ver o radar de habilidades. Passe o mouse sobre os pontos para ver cada jogador.",
   "Ponto importante: o K-Means nunca viu a coluna de sucesso, mas os grupos têm taxas de sucesso bem diferentes (de 14% a 71%). Os perfis têm significado real."],
  ["A regressão logística soma as variáveis ponderadas (z = w·x + b) e passa por uma sigmoide para virar probabilidade entre 0 e 1. Arraste o controle para mostrar.",
   "O modelo aprende os pesos minimizando a log-loss por descida do gradiente. No código também escrevemos essa versão do zero.",
   "Os pesos à direita são do modelo treinado de verdade. Passe o mouse: pesos positivos aumentam a chance de sucesso, negativos diminuem (dificuldade é o maior peso negativo)."],
  ["Random Forest: 300 árvores, cada uma treinada com uma amostra aleatória dos dados e vendo só algumas variáveis por divisão. A resposta é a média dos votos.",
   "Cada bolinha é uma árvore real do modelo treinado votando no cenário escolhido. Troque o cenário e veja a votação mudar.",
   "Gini mede a impureza de um nó: 0 é puro, 0,5 é uma mistura 50/50. A árvore escolhe a pergunta que mais reduz o Gini."],
  ["Linha de base: chutar sempre a classe mais comum dá cerca de 54%. A logística chega a 71,5% e a Random Forest a 75%.",
   "A Random Forest tem mais overfitting (treino 10 pontos acima do teste), mas generaliza melhor porque captura interações entre perfil e tipo de golpe.",
   "Use o controle de limiar: baixar o limiar aumenta o recall (acha mais golpes que deram certo) e piora a precisão. Mostra por que acurácia sozinha não basta."],
  ["Esta é a demonstração principal. Os modelos aqui são exatamente os do Python (mesmos pesos, mesmas 300 árvores): o main.py e esta tela dão o mesmo resultado.",
   "Sugestão de roteiro: 1) clique em Lucia e depois em Jason e compare o perfil e a chance; 2) clique em 'Perfil errado' (pistoleiro na joalheria) e depois mude o golpe para Carro-forte; 3) ajuste furtividade e hackeamento no cassino e mostre o 'por quê'.",
   "Mostre que o perfil (K-Means) e a chance de sucesso (supervisionado) usam os mesmos dados de entrada. Lucia e Jason são perfis fictícios inspirados nos protagonistas.",
   "DIVISÃO DA DEMO: Lorenzo conduz a primeira metade (Lucia e Jason, comparando perfil e chance). Thiago assume na segunda metade: 'Perfil errado', troca do golpe para Carro-forte e o 'por quê'."],
  ["Prova de que o código Python roda: esta é a saída gravada da execução real dos quatro scripts.",
   "Clique em Executar em cada aba. O texto aparece aos poucos, como no terminal.",
   "Se o professor pedir, abra o terminal ou o VS Code e rode python main.py ao vivo (próximo slide mostra como)."],
  ["Limitações: os dados são simulados, então mostramos a metodologia e não uma conclusão sobre o jogo real. O acaso do jogo limita a acurácia máxima.",
   "O limiar fixo de 0,5 é uma escolha; no slide de comparação vimos que mudar o limiar troca precisão por recall.",
   "Melhorias: ajustar hiperparâmetros (GridSearchCV), Gradient Boosting, curva ROC/AUC e dados reais."],
  ["Slide de apoio para a arguição: onde rodar o código. Funciona no VS Code, PyCharm, terminal, Jupyter e Google Colab.",
   "Comandos principais: pip install -r requirements.txt; depois os três scripts em ordem; por fim python main.py."],
  ["Encerramento. Agradecer e abrir para perguntas. Lembrar que todos do grupo conhecem o projeto inteiro (arguição individual).",
   "Use o botão 'Voltar à demonstração' se o professor quiser ver outro cenário."],
];

/* ---------------------------- navegação ---------------------------- */
function renderNotes() {
  const s = slides[current];
  $("#notes-title").textContent = s.dataset.title;
  $("#notes-person").textContent = quem(s) + " · " + s.dataset.part + " · tempo previsto " + TEMPOS[current];
  $("#notes-body").innerHTML = (NOTAS[current] || ["Retome a ideia principal do slide."]).map((t) => "<p>" + esc(t) + "</p>").join("");
}
function updateChrome() {
  const s = slides[current];
  document.body.dataset.tone = s.dataset.tone;
  $("#speaker-tag").textContent = quem(s, true).toUpperCase() + " · " + s.dataset.part;
  $("#objective-text").textContent = s.dataset.obj || "";
  $("#index-num").textContent = String(current + 1).padStart(2, "0");
  $("#progress").style.width = ((current + 1) / slides.length * 100) + "%";
  const stars = Math.round((current / (slides.length - 1)) * 5);
  $$("#wanted i").forEach((e, i) => e.classList.toggle("on", i < stars));
  $$("#rail button").forEach((b, i) => { b.classList.toggle("active", i === current); b.setAttribute("aria-current", String(i === current)); });
  $$(".overview-card").forEach((b, i) => b.classList.toggle("active", i === current));
}
function goTo(i) {
  if (i < 0 || i >= slides.length || i === current) return;
  if (overviewOpen) closeOverview();
  if (helpOpen) closeHelp();
  slides[current].classList.remove("is-active");
  slides[current].classList.toggle("is-past", i > current);
  current = i;
  slides.forEach((s, n) => { if (n !== current) s.classList.toggle("is-past", n < current); });
  slides[current].classList.remove("is-past");
  slides[current].classList.add("is-active");
  updateChrome(); renderNotes();
  if (typeof onEnterSlide === "function") onEnterSlide(i);
}
function toggleNotes(force) { const o = document.body.classList.contains("notes-open"); document.body.classList.toggle("notes-open", force === undefined ? !o : !!force); renderNotes(); }
function openOverview() { toggleNotes(false); $("#overview").classList.add("show"); overviewOpen = true; }
function closeOverview() { $("#overview").classList.remove("show"); overviewOpen = false; }
function openHelp() { toggleNotes(false); $("#help-modal").classList.add("show"); helpOpen = true; }
function closeHelp() { $("#help-modal").classList.remove("show"); helpOpen = false; }
function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.(); }
function toggleTimer() {
  timerRunning = !timerRunning;
  $("#timer").classList.toggle("show", timerRunning);
  if (timerRunning) timerHandle = setInterval(() => { seconds++; $("#timer").textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0"); }, 1000);
  else clearInterval(timerHandle);
}
document.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "escape") { closeOverview(); closeHelp(); toggleNotes(false); return; }
  if (overviewOpen || helpOpen) return;
  if (["arrowright", "pagedown", " "].includes(k)) { e.preventDefault(); goTo(current + 1); }
  else if (["arrowleft", "pageup"].includes(k)) { e.preventDefault(); goTo(current - 1); }
  else if (k === "home") { e.preventDefault(); goTo(0); }
  else if (k === "end") { e.preventDefault(); goTo(slides.length - 1); }
  else if (k === "n") toggleNotes();
  else if (k === "m") openOverview();
  else if (k === "f") toggleFullscreen();
  else if (k === "c") toggleTimer();
  else if (k === "d") goTo(9);
  else if (k === "?") openHelp();
});
/* depois de mexer num controle deslizante, devolve as setas do teclado à navegação */
document.addEventListener("pointerup", (e) => { if (e.target.type === "range") setTimeout(() => e.target.blur(), 0); });
let touchX = null;
document.addEventListener("touchstart", (e) => { if (e.touches.length === 1) touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener("touchend", (e) => {
  if (touchX === null || overviewOpen || helpOpen) return;
  const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if (Math.abs(dx) > 90 && !e.target.closest("button,input,canvas")) goTo(current + (dx < 0 ? 1 : -1));
}, { passive: true });

/* ---------------------------- montagem ---------------------------- */
function montarChrome() {
  $("#wanted").innerHTML = "<i>★</i><i>★</i><i>★</i><i>★</i><i>★</i>";
  $("#index-total").textContent = " / " + String(slides.length).padStart(2, "0");
  $("#crew").innerHTML = EQUIPE.map((n) => "<b>" + esc(n.toUpperCase()) + "</b>").join("");
  $("#repo-link").href = REPO_URL;
  const rail = $("#rail"), ov = $("#overview-grid");
  slides.forEach((s, i) => {
    const t = `${String(i + 1).padStart(2, "0")} · ${s.dataset.title}`;
    const b = document.createElement("button"); b.title = t; b.setAttribute("aria-label", t); b.addEventListener("click", () => goTo(i)); rail.appendChild(b);
    const v = document.createElement("button"); v.className = "overview-card";
    v.innerHTML = `<small>${String(i + 1).padStart(2, "0")} / ${esc(quem(s, true))}</small><strong>${esc(s.dataset.title)}</strong><em>${esc(s.dataset.part)}</em>`;
    v.addEventListener("click", () => goTo(i)); ov.appendChild(v);
  });
}

/* tela de carregamento da capa: mostra o que foi carregado de verdade */
function carregarCapa() {
  const D = window.GTA6;
  const info = D ? `${D.rf.arvores.length} árvores · ${D.kmeans.centros.length} perfis · ${D.pontos.x.length.toLocaleString("pt-BR")} jogadores · ${D.colunas_saida.length} variáveis` : "falha ao carregar modelo_web.js (rode exportar_para_web.py)";
  let p = 0;
  const t = setInterval(() => {
    p = Math.min(100, p + 6 + Math.random() * 9);
    $("#loadfill").style.width = p + "%"; $("#loadpct").textContent = Math.round(p) + "%";
    if (p >= 100) { clearInterval(t); $("#load-info").textContent = "✔ modelos carregados: " + info; }
  }, 110);
}
function girarFundo() {
  const frames = $$("#bg-carousel .bg-frame"); let i = 0;
  setInterval(() => { frames[i].classList.remove("on"); i = (i + 1) % frames.length; frames[i].classList.add("on"); }, 4600);
}

/* partículas de neon ao fundo */
function ambient() {
  const c = $("#ambient"), ctx = c.getContext("2d"); let w, h, dpr, pts = [];
  const cores = ["255,45,149", "25,230,212", "255,210,63", "140,77,255"];
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2); w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
    pts = Array.from({ length: Math.min(60, Math.floor(innerWidth / 24)) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.6 + .5) * dpr, v: (Math.random() * .22 + .05) * dpr, c: cores[(Math.random() * cores.length) | 0] }));
  }
  resize(); addEventListener("resize", resize);
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  (function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) { if (!reduz) { p.y -= p.v; if (p.y < 0) p.y = h; } ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = `rgba(${p.c},.55)`; ctx.fill(); }
    requestAnimationFrame(draw);
  })();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.ARTE) { ARTE.montarTudo(); ARTE.procurarImagens(); }
  montarChrome(); updateChrome(); renderNotes(); carregarCapa(); girarFundo(); ambient();
  if (typeof iniciarSlides === "function") iniciarSlides();
  if (location.hash && /^#\d+$/.test(location.hash)) goTo(Math.min(slides.length - 1, +location.hash.slice(1)));
});
