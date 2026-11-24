/* slides.js — interatividade de cada slide (usa os modelos reais exportados do Python) */
"use strict";

const D = window.GTA6, ML = window.ML;
const COR = ["#19e6d4", "#ff2d95", "#ffd23f", "#8c4dff", "#ff8a3d", "#3ddc84", "#56b4e9", "#f4f4f4"];
const NOME_VAR = {
  horas_semana: "Horas por semana", nivel: "Nível", agressividade: "Agressividade", furtividade: "Furtividade",
  precisao_tiro: "Precisão de tiro", habilidade_direcao: "Direção / fuga", hackeamento: "Hackeamento",
  trabalho_equipe: "Trabalho em equipe", heists_anteriores: "Golpes anteriores", tamanho_equipe: "Tamanho da equipe",
  planejamento_min: "Planejamento (min)", dificuldade: "Dificuldade", tipo_golpe_Banco: "Golpe: Banco",
  "tipo_golpe_Carro-forte": "Golpe: Carro-forte", tipo_golpe_Cassino: "Golpe: Cassino", tipo_golpe_Joalheria: "Golpe: Joalheria",
};
const fmt = (n, d = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (p, d = 1) => fmt(p * 100, d) + "%";
const AUTOR_NOME = (c) => D.kmeans.nomes[c];

function fitCanvas(cv) {
  const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
const mapa = (() => {                       // coordenadas PCA -> pixels
  const xs = D.pontos.x, ys = D.pontos.y;
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return (w, h, pad = 22) => ({
    X: (x) => pad + ((x - x0) / (x1 - x0)) * (w - 2 * pad),
    Y: (y) => h - pad - ((y - y0) / (y1 - y0)) * (h - 2 * pad),
  });
})();
function grade(ctx, w, h) {
  ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo((w / 8) * i, 0); ctx.lineTo((w / 8) * i, h); ctx.stroke(); }
  for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, (h / 6) * i); ctx.lineTo(w, (h / 6) * i); ctx.stroke(); }
}
const $id = (i) => document.getElementById(i);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

/* =========================== PRESETS (slides 7 e 9) =========================== */
const PRESETS = [
  { id: "lucia", nome: "Lucia", art: "lucia", tag: "Lucia na Joalheria (perfil fictício)",
    e: { tipo_golpe: "Joalheria", tamanho_equipe: 3, planejamento_min: 60, dificuldade: 4, horas_semana: 18, nivel: 58, heists_anteriores: 11, agressividade: 30, furtividade: 82, precisao_tiro: 60, habilidade_direcao: 55, hackeamento: 78, trabalho_equipe: 80 } },
  { id: "jason", nome: "Jason", art: "jason", tag: "Jason no Carro-forte (perfil fictício)",
    e: { tipo_golpe: "Carro-forte", tamanho_equipe: 4, planejamento_min: 50, dificuldade: 5, horas_semana: 19, nivel: 52, heists_anteriores: 9, agressividade: 80, furtividade: 35, precisao_tiro: 82, habilidade_direcao: 75, hackeamento: 30, trabalho_equipe: 65 } },
  { id: "errado", nome: "Perfil errado<br>pistoleiro na joalheria", tag: "Pistoleiro na Joalheria (perfil errado para o golpe)",
    e: { tipo_golpe: "Joalheria", tamanho_equipe: 2, planejamento_min: 20, dificuldade: 5, horas_semana: 20, nivel: 55, heists_anteriores: 10, agressividade: 90, furtividade: 20, precisao_tiro: 85, habilidade_direcao: 50, hackeamento: 30, trabalho_equipe: 55 } },
  { id: "novato", nome: "Novato<br>sozinho no cassino", tag: "Novato sozinho no Cassino",
    e: { tipo_golpe: "Cassino", tamanho_equipe: 1, planejamento_min: 10, dificuldade: 9, horas_semana: 4, nivel: 12, heists_anteriores: 0, agressividade: 45, furtividade: 30, precisao_tiro: 30, habilidade_direcao: 30, hackeamento: 20, trabalho_equipe: 30 } },
];
const DIF_BASE = { Banco: 6, Joalheria: 4, "Carro-forte": 5, Cassino: 8 };
const ESTADO = { ...PRESETS[0].e, preset: "lucia" };
window.ESTADO = ESTADO;

/* ================================ 01 · BRIEFING ================================ */
const brief = { modo: "sup", revelado: true };
const BRIEF_TXT = {
  sup: { info: "<b>No projeto:</b> prever se o golpe dá certo (sim ou não) a partir das habilidades e do tipo de golpe.<br><b>No mundo real:</b> filtro de spam, diagnóstico por exames, previsão de preço de imóveis.<br><span class='chip'>Regressão Logística</span> <span class='chip'>Random Forest</span>",
         btn: ["▶ Esconder as respostas", "▶ Mostrar as respostas"],
         msg: ["Cada ponto vem com a resposta: <b>verde = deu certo</b>, <b>vermelho = falhou</b>. É isso que o modelo usa para aprender.", "Sem as respostas, não há como supervisionar. Aperte de novo para voltar."] },
  uns: { info: "<b>No projeto:</b> descobrir tipos de jogador sem usar a coluna de sucesso.<br><b>No mundo real:</b> segmentar clientes, agrupar notícias parecidas, achar padrões de compra.<br><span class='chip'>K-Means</span> <span class='chip'>PCA</span>",
         btn: ["▶ Agrupar (K-Means)", "↺ Desagrupar"],
         msg: ["Ninguém disse quem é quem. Só existem pontos (jogadores) no espaço.", "O algoritmo encontrou <b>4 grupos</b> sozinho: os perfis de jogador."] },
};
function desenharBrief() {
  const cv = $id("cv-brief"); if (!cv) return; const { ctx, w, h } = fitCanvas(cv); ctx.clearRect(0, 0, w, h); grade(ctx, w, h);
  const m = mapa(w, h); const P = D.pontos;
  for (let i = 0; i < P.x.length; i += 4) {
    let cor = "rgba(210,200,235,.55)";
    if (brief.modo === "sup" && brief.revelado) cor = P.sucesso[i] ? "#3ddc84" : "#ff4d6d";
    if (brief.modo === "uns" && brief.revelado) cor = COR[P.cluster[i] % COR.length];   // revelado = já agrupado
    ctx.fillStyle = cor; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(m.X(P.x[i]), m.Y(P.y[i]), 3.2, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function atualizarBrief() {
  const modo = brief.modo, t = BRIEF_TXT[modo];
  document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("sel", b.dataset.mode === modo));
  $id("mode-info").innerHTML = t.info;
  const aberto = modo === "sup" ? brief.revelado : !brief.revelado;       // "aberto" = estado interessante
  $id("brief-btn").textContent = aberto ? t.btn[0] : t.btn[1];
  $id("brief-msg").innerHTML = aberto ? t.msg[0] : t.msg[1];
  desenharBrief();
}
function iniciarBrief() {
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { brief.modo = b.dataset.mode; brief.revelado = brief.modo === "sup"; atualizarBrief(); }));
  $id("brief-btn").addEventListener("click", () => { brief.revelado = !brief.revelado; atualizarBrief(); });
  brief.revelado = true; atualizarBrief();
}

/* ================================ 02 · PIPELINE ================================ */
const ETAPAS = [
  { n: "01", nome: "Dados", arq: "01_gerar_dados.py", titulo: "Gerar e preparar os dados",
    lista: ["Simula 2.000 jogadores com habilidades e um golpe cada.", "Suja os dados de propósito: faltantes, duplicatas e valores impossíveis.", "Limpa, padroniza (z-score) e separa treino e teste."],
    saidas: ["dados_gta6.csv", "treino_processado.csv", "teste_processado.csv", "preprocessador.joblib"],
    codigo: `numerico = Pipeline([
    ("imputar", SimpleImputer(strategy="median")),
    ("padronizar", StandardScaler()),   # z = (x - média) / desvio
])
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.20, stratify=y, random_state=42)

# ajusta o padronizador SÓ no treino (evita vazamento)
A_tr = prep.fit_transform(X_tr)
A_te = prep.transform(X_te)` },
  { n: "02", nome: "Não supervisionado", arq: "02_nao_supervisionado.py", titulo: "Descobrir os perfis de jogador",
    lista: ["Escolhe K por cotovelo e silhouette.", "K-Means (também escrito do zero em numpy).", "PCA projeta 9 dimensões em 2 para desenhar."],
    saidas: ["02_clusters_pca.png", "perfis_clusters.csv", "modelo_kmeans.joblib"],
    codigo: `km  = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
pca = PCA(n_components=2).fit(X)

# K-Means do zero (algoritmo de Lloyd):
dist    = np.linalg.norm(X[:, None] - centroides[None], axis=2)
rotulos = dist.argmin(axis=1)                       # 1) atribuição
novos   = [X[rotulos == j].mean(axis=0)             # 2) atualização
           for j in range(k)]` },
  { n: "03", nome: "Supervisionado", arq: "03_supervisionado.py", titulo: "Prever o sucesso do golpe",
    lista: ["Regressão Logística e Random Forest.", "Compara acurácia, precisão, recall e F1.", "Validação cruzada e matriz de confusão."],
    saidas: ["03_matriz_confusao.png", "metricas_modelos.csv", "modelo_random_forest.joblib"],
    codigo: `lr = LogisticRegression(max_iter=1000).fit(X_tr, y_tr)
rf = RandomForestClassifier(
        n_estimators=300, max_depth=8, min_samples_leaf=5,
        oob_score=True, random_state=42).fit(X_tr, y_tr)

# do zero, p = 1 / (1 + e^-(w·x + b)), descida do gradiente:
w -= taxa * (X.T @ (p - y)) / n` },
  { n: "04", nome: "Demonstração", arq: "main.py", titulo: "Testar ao vivo no terminal",
    lista: ["Menu interativo com cenários prontos.", "Padroniza a entrada com o MESMO preprocessador do treino.", "Mostra perfil, probabilidades e o porquê."],
    saidas: ["python main.py"],
    codigo: `z = transformar(m, entrada)            # mesmo padronizador do treino
perfil, dist = descobrir_perfil(m, z)  # K-Means: centróide mais próximo
p_lr = m["lr"].predict_proba(z)[0, 1]  # regressão logística
p_rf = m["rf"].predict_proba(z)[0, 1]  # média das 300 árvores` },
];
function realcar(cod) {
  return cod.split("\n").map((l) => {
    const i = l.indexOf("#"); let a = i >= 0 ? l.slice(0, i) : l; const c = i >= 0 ? l.slice(i) : "";
    a = a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"[^"]*"/g, (s) => `<span class="s">${s}</span>`)
      .replace(/\b(import|from|def|return|for|in|if|else)\b/g, '<span class="k">$1</span>')
      .replace(/\b([A-Za-z_]+)(?=\()/g, '<span class="f">$1</span>');
    return a + (c ? `<span class="c">${c.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>` : "");
  }).join("\n");
}
function iniciarPipeline() {
  const box = $id("pipe");
  ETAPAS.forEach((e, i) => {
    const b = el("button", "pipe-node" + (i === 0 ? " sel" : ""), `<span class="n">${e.n}</span><strong>${e.nome}</strong><span>${e.arq}</span>`);
    b.addEventListener("click", () => mostrarEtapa(i)); box.appendChild(b);
  });
  mostrarEtapa(0);
}
function mostrarEtapa(i) {
  const e = ETAPAS[i];
  document.querySelectorAll(".pipe-node").forEach((b, j) => b.classList.toggle("sel", i === j));
  $id("pd-file").textContent = e.arq; $id("pd-title").textContent = e.titulo;
  $id("pd-list").innerHTML = e.lista.map((t) => `<li>${t}</li>`).join("");
  $id("pd-out").innerHTML = e.saidas.map((s) => `<span class="chip">${s}</span>`).join("");
  $id("pd-code").innerHTML = realcar(e.codigo);
}

/* ================================== 03 · DADOS ================================== */
const ETAPAS_DADOS = [
  { k: "bruto", nome: "1 · Bruto", desc: "<b>Como nasceu:</b> valores faltando (—), uma habilidade acima de 100 (erro de digitação) e linhas duplicadas. 2.015 linhas." },
  { k: "limpo", nome: "2 · Limpo", desc: "<b>Limpeza:</b> 15 duplicatas removidas e habilidades limitadas a 0–100. Os vazios continuam e serão preenchidos com a mediana." },
  { k: "padronizado", nome: "3 · Padronizado", desc: "<b>Pronto para o modelo:</b> vazios preenchidos com a mediana e cada coluna em z-score (média 0, desvio 1)." },
];
const CAB = { id_jogador: "id", nivel: "nível", furtividade: "furtiv.", precisao_tiro: "tiro", hackeamento: "hack", planejamento_min: "plan. (min)", tipo_golpe: "golpe", sucesso: "sucesso" };
let estagioDados = 0;
function renderDados() {
  const e = ETAPAS_DADOS[estagioDados], T = D.tabela;
  document.querySelectorAll("#stage-tabs .pill").forEach((b, i) => b.classList.toggle("sel", i === estagioDados));
  $id("stage-desc").innerHTML = e.desc;
  const cab = T.colunas.map((c) => `<th>${CAB[c] || c}</th>`).join("");
  const linhas = T[e.k].map((r) => "<tr>" + r.map((v, j) => {
    let cls = "", txt = v;
    if (v === null) { cls = "bad"; txt = "—"; }
    else if (e.k === "bruto" && T.colunas[j] === "hackeamento" && v > 100) cls = "warn";
    else if (e.k === "padronizado" && j >= 1 && j <= 5) { cls = "good"; txt = (v >= 0 ? "+" : "") + Number(v).toFixed(2); }
    else if (typeof v === "number" && !Number.isInteger(v)) txt = fmt(v, 1);
    return `<td class="${cls}">${txt}</td>`;
  }).join("") + "</tr>").join("");
  $id("data-table").innerHTML = `<thead><tr>${cab}</tr></thead><tbody>${linhas}</tbody>`;
}
const ZVARS = ["furtividade", "precisao_tiro", "hackeamento", "planejamento_min", "nivel", "horas_semana"];
const zs = { v: "furtividade", x: 50 };
function iniciarDados() {
  const tabs = $id("stage-tabs");
  ETAPAS_DADOS.forEach((e, i) => { const b = el("button", "pill", e.nome); b.addEventListener("click", () => { estagioDados = i; renderDados(); }); tabs.appendChild(b); });
  renderDados();
  const ch = $id("z-vars");
  ZVARS.forEach((v) => { const b = el("button", "pill", NOME_VAR[v]); b.dataset.v = v; b.addEventListener("click", () => escolherZ(v)); ch.appendChild(b); });
  $id("z-slider").addEventListener("input", (e) => { zs.x = +e.target.value; desenharZ(); });
  escolherZ("furtividade");
}
function escolherZ(v) {
  zs.v = v; const i = D.numericas.indexOf(v), [mn, mx] = D.faixas[v];
  document.querySelectorAll("#z-vars .pill").forEach((b) => b.classList.toggle("sel", b.dataset.v === v));
  const s = $id("z-slider"); s.min = Math.floor(mn); s.max = Math.ceil(mx); s.step = (mx - mn) > 30 ? 1 : 0.5;
  zs.x = Math.round(D.scaler.media[i] + D.scaler.escala[i]); s.value = zs.x; desenharZ();
}
function desenharZ() {
  const i = D.numericas.indexOf(zs.v), mu = D.scaler.media[i], sd = D.scaler.escala[i], z = (zs.x - mu) / sd;
  $id("z-x").textContent = fmt(zs.x, 1); $id("z-mu").textContent = fmt(mu, 1); $id("z-sd").textContent = fmt(sd, 1);
  $id("z-res").textContent = (z >= 0 ? "+" : "") + fmt(z, 2);
  $id("z-msg").innerHTML = Math.abs(z) < 0.05 ? "Exatamente na média do treino." : `<b>${NOME_VAR[zs.v]} = ${fmt(zs.x, 1)}</b> está ${fmt(Math.abs(z), 2)} desvio(s)-padrão ${z > 0 ? "acima" : "abaixo"} da média. Na escala nova, todas as variáveis são comparáveis.`;
  const cv = $id("cv-z"); const { ctx, w, h } = fitCanvas(cv); ctx.clearRect(0, 0, w, h);
  const X = (t) => 12 + ((t + 3.5) / 7) * (w - 24), Y = (t) => h - 18 - Math.exp(-t * t / 2) * (h - 34);
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(255,45,149,.55)"); g.addColorStop(1, "rgba(140,77,255,.1)");
  ctx.beginPath(); ctx.moveTo(X(-3.5), h - 18);
  for (let t = -3.5; t <= 3.5; t += .05) ctx.lineTo(X(t), Y(t));
  ctx.lineTo(X(3.5), h - 18); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, h - 18); ctx.lineTo(w - 8, h - 18); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "11px 'Space Mono', monospace"; ctx.textAlign = "center";
  [-3, -2, -1, 0, 1, 2, 3].forEach((t) => ctx.fillText(t, X(t), h - 4));
  const zc = Math.max(-3.5, Math.min(3.5, z));
  ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(zc), h - 18); ctx.lineTo(X(zc), Y(zc) - 4); ctx.stroke();
  ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(X(zc), Y(zc) - 4, 6, 0, 6.283); ctx.fill();
}

/* ================================ 04 · K-MEANS ================================ */
const km = { k: 4, seed: 7, st: null, trilhas: [], timer: null, nomes: null };
function kmNovo(seed) {
  pararKM(); km.seed = seed; km.st = ML.criarKMeans(km.k, km.seed, $id("km-pp").checked);
  km.trilhas = km.st.centros.map((c) => [ML.projetar(c)]); km.nomes = null; km.live = false; atualizarKM("Centróides sorteados. Aperte <b>▶ Rodar</b> e acompanhe.");
}
function kmPasso() {
  const s = km.st; if (!s || s.convergiu) return false;
  s.passo(); s.centros.forEach((c, i) => km.trilhas[i].push(ML.projetar(c)));
  if (s.convergiu) {
    const alvo = D.kmeans.k_tabela.find((t) => t.k === km.k).inercia, bom = s.inercia <= alvo * 1.01;
    if (km.k === 4) km.nomes = nomearKM();
    atualizarKM(bom ? `✔ Convergiu em ${s.iteracao} iterações com J ≈ ${fmt(s.inercia)}. É o melhor resultado (igual ao do Python).`
                    : `⚠ Convergiu, mas preso num <b>mínimo local</b>: J = ${fmt(s.inercia)} (o melhor é ${fmt(alvo)}). Por isso o Python usa <b>n_init = 10</b>. Tente "Sortear de novo" ou "10 inícios".`);
    return false;
  }
  atualizarKM("Atribuindo pontos ao centróide mais próximo e recalculando a média de cada grupo…"); return true;
}
function nomearKM() {          // dá o nome do perfil do Python ao grupo vivo, pela maioria
  const nomes = {};
  for (let c = 0; c < km.k; c++) {
    const cont = {}; km.st.rotulos.forEach((r, i) => { if (r === c) cont[D.pontos.cluster[i]] = (cont[D.pontos.cluster[i]] || 0) + 1; });
    const [melhor, n] = Object.entries(cont).sort((a, b) => b[1] - a[1])[0] || [0, 0];
    const total = Object.values(cont).reduce((a, b) => a + b, 0);
    nomes[c] = n / total > 0.9 ? AUTOR_NOME(melhor) : "Grupo " + (c + 1);
  }
  return nomes;
}
function pararKM() { clearInterval(km.timer); km.timer = null; $id("km-run").textContent = "▶ Rodar"; }
function rodarKM() {
  if (km.timer) { pararKM(); return; }
  if (km.st.convergiu) kmNovo(km.seed + 1);
  $id("km-run").textContent = "⏸ Pausar";
  km.timer = setInterval(() => { if (!kmPasso()) pararKM(); }, 650);
}
function melhorDe10() {
  pararKM(); let melhor = null;
  for (let s = 1; s <= 10; s++) {
    const st = ML.criarKMeans(km.k, 100 + s, $id("km-pp").checked); const tr = st.centros.map((c) => [ML.projetar(c)]);
    for (let i = 0; i < 60 && !st.convergiu; i++) { st.passo(); st.centros.forEach((c, j) => tr[j].push(ML.projetar(c))); }
    if (!melhor || st.inercia < melhor.st.inercia) melhor = { st, tr };
  }
  km.st = melhor.st; km.trilhas = melhor.tr; km.nomes = km.k === 4 ? nomearKM() : null;
  const alvo = D.kmeans.k_tabela.find((t) => t.k === km.k).inercia;
  atualizarKM(`✦ Melhor de 10 inícios: J = ${fmt(km.st.inercia)} (Python: ${fmt(alvo)}). É assim que o <b>n_init = 10</b> escolhe o melhor resultado.`);
}
function atualizarKM(msg) {
  const s = km.st;
  $id("km-it").textContent = s.iteracao; $id("km-j").textContent = s.inercia === null ? "—" : fmt(s.inercia);
  $id("km-py").textContent = fmt(D.kmeans.k_tabela.find((t) => t.k === km.k).inercia);
  if (msg) $id("km-msg").innerHTML = msg;
  document.querySelectorAll(".kbar").forEach((b) => b.classList.toggle("sel", +b.dataset.k === km.k));
  desenharKM();
  const lg = $id("km-legend"); lg.innerHTML = "";
  if (s.rotulos[0] >= 0) {
    const cont = new Array(km.k).fill(0); s.rotulos.forEach((r) => cont[r]++);
    cont.forEach((n, c) => { lg.appendChild(el("span", "", `<i style="background:${COR[c % COR.length]}"></i>${km.nomes ? km.nomes[c] : "Grupo " + (c + 1)} (${n})`)); });
  } else lg.appendChild(el("span", "", "<i style='background:#cdbdea'></i>2.000 jogadores sem grupo"));
}
function desenharKM() {
  const cv = $id("cv-km"); const { ctx, w, h } = fitCanvas(cv); ctx.clearRect(0, 0, w, h); grade(ctx, w, h);
  const m = mapa(w, h), P = D.pontos, s = km.st;
  for (let i = 0; i < P.x.length; i++) {
    ctx.fillStyle = s.rotulos[i] < 0 ? "rgba(205,189,234,.5)" : COR[s.rotulos[i] % COR.length];
    ctx.globalAlpha = s.rotulos[i] < 0 ? .6 : .7; ctx.beginPath(); ctx.arc(m.X(P.x[i]), m.Y(P.y[i]), 2.6, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  km.trilhas.forEach((tr, c) => {
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath();
    tr.forEach(([x, y], i) => (i ? ctx.lineTo(m.X(x), m.Y(y)) : ctx.moveTo(m.X(x), m.Y(y)))); ctx.stroke(); ctx.setLineDash([]);
    const [x, y] = tr[tr.length - 1], px = m.X(x), py = m.Y(y);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#0a0520"; ctx.lineWidth = 3; ctx.beginPath();
    for (let a = 0; a < 4; a++) { const ang = Math.PI / 4 + a * Math.PI / 2; ctx.moveTo(px, py); ctx.lineTo(px + 13 * Math.cos(ang), py + 13 * Math.sin(ang)); }
    ctx.stroke(); ctx.strokeStyle = COR[c % COR.length]; ctx.lineWidth = 3.5; ctx.stroke();
  });
}
function iniciarKM() {
  const kb = $id("k-bars"), mx = Math.max(...D.kmeans.k_tabela.map((t) => t.silhouette));
  D.kmeans.k_tabela.forEach((t) => {
    const b = el("button", "kbar", `<i style="height:${(t.silhouette / mx) * 100}%"></i><span>${t.k}</span>`); b.dataset.k = t.k; b.title = `K = ${t.k}: silhouette ${t.silhouette}`;
    b.addEventListener("click", () => { km.k = t.k; kmNovo(km.seed); }); kb.appendChild(b);
  });
  $id("km-run").addEventListener("click", rodarKM);
  $id("km-step").addEventListener("click", () => { pararKM(); if (km.st.convergiu) kmNovo(km.seed + 1); kmPasso(); });
  $id("km-reset").addEventListener("click", () => kmNovo(km.seed + 1));
  $id("km-best").addEventListener("click", melhorDe10);
  $id("km-pp").addEventListener("change", () => kmNovo(km.seed));
  kmNovo(7);
}

/* ============================= 05 · PERFIS + PCA ============================= */
const prof = { sel: 0, hover: -1 };
const DESC_PERFIL = {
  "Estrategista Furtivo": "Silencioso e metódico: furtividade e hackeamento altos, pouca agressividade. Lidera a taxa de sucesso.",
  "Pistoleiro Agressivo": "Resolve no tiro: agressividade e precisão altas, furtividade baixa. Vai bem em golpes de força.",
  "Piloto de Fuga": "Especialista em direção: o melhor na fuga, habilidades medianas no resto.",
  "Novato Casual": "Poucas horas, nível baixo e quase nenhum golpe feito. É onde mais se falha.",
};
const HAB = [["agressividade", "Agress."], ["furtividade", "Furtiv."], ["precisao_tiro", "Tiro"], ["habilidade_direcao", "Direção"], ["hackeamento", "Hack"], ["trabalho_equipe", "Equipe"]];
function perfilDoCluster(c) { return D.perfis.find((p) => p.perfil === D.kmeans.nomes[c]); }
function desenharPCA() {
  const cv = $id("cv-pca"); if (!cv) return; const { ctx, w, h } = fitCanvas(cv); ctx.clearRect(0, 0, w, h); grade(ctx, w, h);
  const m = mapa(w, h), P = D.pontos;
  for (let i = 0; i < P.x.length; i++) {
    const on = P.cluster[i] === prof.sel;
    ctx.globalAlpha = on ? .85 : .13; ctx.fillStyle = COR[P.cluster[i] % COR.length];
    ctx.beginPath(); ctx.arc(m.X(P.x[i]), m.Y(P.y[i]), on ? 3.2 : 2.4, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  D.kmeans.centros.forEach((c, k) => {
    const [x, y] = ML.projetar(c), px = m.X(x), py = m.Y(y);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = COR[k % COR.length]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 9, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "700 12px 'Barlow', sans-serif"; ctx.textAlign = "center"; ctx.fillText(D.kmeans.nomes[k], px, py - 16);
  });
  if (prof.hover >= 0) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.X(P.x[prof.hover]), m.Y(P.y[prof.hover]), 7, 0, 6.283); ctx.stroke(); }
  ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "11px 'Space Mono', monospace"; ctx.textAlign = "left";
  ctx.fillText(`PC1 · ${fmt(D.pca.variancia[0] * 100, 1)}% da variância`, 10, h - 6); ctx.save(); ctx.translate(12, h - 22); ctx.rotate(-Math.PI / 2); ctx.fillText(`PC2 · ${fmt(D.pca.variancia[1] * 100, 1)}%`, 0, 0); ctx.restore();
}
function radar(p, cor, alvo = "radar") {
  const R = 78, cx = 110, cy = 112, n = HAB.length, ang = (i) => -Math.PI / 2 + (i / n) * 2 * Math.PI;
  const pt = (i, v) => [cx + R * v * Math.cos(ang(i)), cy + R * v * Math.sin(ang(i))];
  let s = "";
  [0.25, 0.5, 0.75, 1].forEach((r) => { s += `<polygon points="${HAB.map((_, i) => pt(i, r).join(",")).join(" ")}" fill="none" stroke="rgba(255,255,255,.2)"/>`; });
  HAB.forEach(([, nome], i) => { const [x, y] = pt(i, 1.2); s += `<line x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" stroke="rgba(255,255,255,.2)"/><text x="${x}" y="${y + 3}" text-anchor="middle" font-size="10" fill="currentColor" opacity=".8" font-family="Barlow, sans-serif">${nome}</text>`; });
  s += `<polygon points="${HAB.map(([k], i) => pt(i, p[k] / 100).join(",")).join(" ")}" fill="${cor}" fill-opacity=".4" stroke="${cor}" stroke-width="2.5"/>`;
  $id(alvo).innerHTML = s;
}
function mostrarPerfil(c) {
  prof.sel = c; const p = perfilDoCluster(c);
  document.querySelectorAll("#prof-tabs .pill").forEach((b) => b.classList.toggle("sel", +b.dataset.c === c));
  $id("prof-name").textContent = D.kmeans.nomes[c]; $id("prof-succ").textContent = fmt(p.taxa_sucesso, 1) + "%"; $id("prof-n").textContent = p.jogadores;
  $id("prof-desc").textContent = DESC_PERFIL[D.kmeans.nomes[c]] || ""; radar(p, COR[c % COR.length]); desenharPCA();
}
function iniciarPerfis() {
  const tabs = $id("prof-tabs");
  Object.keys(D.kmeans.nomes).forEach((c) => { const b = el("button", "pill", `<span class="dot" style="background:${COR[c % COR.length]}"></span>${D.kmeans.nomes[c]}`); b.dataset.c = c; b.addEventListener("click", () => mostrarPerfil(+c)); tabs.appendChild(b); });
  const sc = $id("scree"); D.pca.variancia.forEach((v, i) => { const b = el("i", i < 2 ? "hi" : ""); b.style.height = (v / D.pca.variancia[0]) * 100 + "%"; b.title = `PC${i + 1}: ${fmt(v * 100, 1)}%`; sc.appendChild(b); });
  $id("scree-msg").textContent = `PC1 + PC2 = ${fmt((D.pca.variancia[0] + D.pca.variancia[1]) * 100, 1)}% da informação dos 9 atributos`;
  const cv = $id("cv-pca"), tip = $id("pca-tip");
  cv.addEventListener("mousemove", (e) => {
    const r = cv.getBoundingClientRect(), m = mapa(r.width, r.height), x = e.clientX - r.left, y = e.clientY - r.top; let melhor = -1, dm = 100;
    for (let i = 0; i < D.pontos.x.length; i++) { if (D.pontos.cluster[i] !== prof.sel) continue; const d = (m.X(D.pontos.x[i]) - x) ** 2 + (m.Y(D.pontos.y[i]) - y) ** 2; if (d < dm) { dm = d; melhor = i; } }
    prof.hover = melhor;
    if (melhor >= 0) { const hb = D.pontos.habilidades[melhor]; tip.style.opacity = 1; tip.style.left = Math.min(x + 14, r.width - 220) + "px"; tip.style.top = y + 14 + "px";
      tip.innerHTML = `<b>Jogador #${melhor + 1}</b> · ${D.pontos.sucesso[melhor] ? "✔ golpe deu certo" : "✘ golpe falhou"}<br>agr ${hb[0]} · furt ${hb[1]} · tiro ${hb[2]} · dir ${hb[3]} · hack ${hb[4]} · eq ${hb[5]}`; }
    else tip.style.opacity = 0;
    desenharPCA();
  });
  cv.addEventListener("mouseleave", () => { prof.hover = -1; tip.style.opacity = 0; desenharPCA(); });
  cv.addEventListener("click", () => { if (prof.hover >= 0) { /* clique no ponto: nada extra */ } });
  mostrarPerfil(2);
}

/* ============================ 06 · REGRESSÃO LOGÍSTICA ============================ */
function desenharSig() {
  const cv = $id("cv-sig"); if (!cv) return; const { ctx, w, h } = fitCanvas(cv); ctx.clearRect(0, 0, w, h);
  const z = +$id("z-logit").value, p = ML.sigmoide(z), X = (t) => 28 + ((t + 6) / 12) * (w - 50), Y = (q) => h - 24 - q * (h - 44);
  ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 1;
  [0, .25, .5, .75, 1].forEach((q) => { ctx.beginPath(); ctx.moveTo(28, Y(q)); ctx.lineTo(w - 12, Y(q)); ctx.stroke(); });
  ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = "11px 'Space Mono', monospace"; ctx.textAlign = "right";
  [0, .5, 1].forEach((q) => ctx.fillText(q.toFixed(1), 24, Y(q) + 4)); ctx.textAlign = "center";
  [-6, -3, 0, 3, 6].forEach((t) => ctx.fillText(t, X(t), h - 8));
  const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#ff4d6d"); g.addColorStop(.5, "#ffd23f"); g.addColorStop(1, "#3ddc84");
  ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.beginPath(); for (let t = -6; t <= 6; t += .1) (t === -6 ? ctx.moveTo(X(t), Y(ML.sigmoide(t))) : ctx.lineTo(X(t), Y(ML.sigmoide(t)))); ctx.stroke();
  ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(z), Y(0)); ctx.lineTo(X(z), Y(p)); ctx.lineTo(28, Y(p)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(X(z), Y(p), 9, 0, 6.283); ctx.fill(); ctx.stroke();
  $id("lr-p").textContent = pct(p);
}
let lrSel = 0;
function iniciarLR() {
  $id("z-logit").addEventListener("input", desenharSig);
  const ordem = D.colunas_saida.map((c, i) => ({ c, w: D.lr.coef[i] })).sort((a, b) => Math.abs(b.w) - Math.abs(a.w));
  const mx = Math.abs(ordem[0].w), box = $id("lr-coefs");
  ordem.forEach((o, i) => {
    const pos = o.w >= 0, larg = (Math.abs(o.w) / mx) * 50;
    const b = el("button", "coef" + (i === 0 ? " sel" : ""), `<span>${NOME_VAR[o.c] || o.c}</span><div class="tr"><i style="${pos ? "left:50%" : "right:50%"};width:${larg}%;background:${pos ? "#3ddc84" : "#ff4d6d"}"></i></div><span style="color:${pos ? "#3ddc84" : "#ff4d6d"}">${o.w >= 0 ? "+" : ""}${o.w.toFixed(2)}</span>`);
    const sel = () => { box.querySelectorAll(".coef").forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
      $id("lr-msg").innerHTML = `<b>${NOME_VAR[o.c] || o.c}</b>: peso ${o.w >= 0 ? "+" : ""}${o.w.toFixed(2)}. ${o.c.startsWith("tipo_golpe_") ? "Este tipo de golpe " + (pos ? "favorece" : "dificulta") + " o sucesso em relação à média." : `Cada desvio-padrão a mais ${pos ? "aumenta" : "reduz"} as chances de sucesso: multiplica as odds por e<sup>${o.w.toFixed(2)}</sup> = <b>${Math.exp(o.w).toFixed(2)}</b>.`}`; };
    b.addEventListener("mouseenter", sel); b.addEventListener("click", sel); box.appendChild(b);
    if (i === 0) sel();
  });
  desenharSig();
}

/* ============================== 07 · RANDOM FOREST ============================== */
function corVoto(p) {
  const t = Math.max(0, Math.min(1, p)), a = t < .5 ? [255, 77, 109] : [255, 210, 63], b = t < .5 ? [255, 210, 63] : [61, 220, 132], u = t < .5 ? t * 2 : (t - .5) * 2;
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(",")})`;
}
let rfSel = "lucia", rfAnim = null;
function mostrarFloresta(id) {
  rfSel = id; const pr = PRESETS.find((p) => p.id === id), r = ML.prever(pr.e);
  document.querySelectorAll("#rf-presets .pill").forEach((b) => b.classList.toggle("sel", b.dataset.id === id));
  const f = $id("forest"); f.classList.remove("on");
  if (!f.children.length) for (let i = 0; i < r.rf.votos.length; i++) f.appendChild(el("i"));
  [...f.children].forEach((d, i) => { d.style.background = corVoto(r.rf.votos[i]); d.style.transitionDelay = (i * 4) + "ms"; d.title = `Árvore ${i + 1}: ${pct(r.rf.votos[i], 0)}`; });
  requestAnimationFrame(() => requestAnimationFrame(() => f.classList.add("on")));
  cancelAnimationFrame(rfAnim); const t0 = performance.now(), alvo = r.rf.p, out = $id("rf-p");
  (function passo(t) { const u = Math.min(1, (t - t0) / 1300); out.textContent = pct(alvo * u, 1); if (u < 1) rfAnim = requestAnimationFrame(passo); })(t0);
  $id("rf-who").innerHTML = `${pr.tag}<br>Regressão Logística daria <b>${pct(r.lr.p)}</b>`;
}
function iniciarRF() {
  const box = $id("rf-presets");
  PRESETS.forEach((p) => { const b = el("button", "pill", p.nome.replace("<br>", " · ")); b.dataset.id = p.id; b.addEventListener("click", () => mostrarFloresta(p.id)); box.appendChild(b); });
  $id("gini-p").addEventListener("input", atualizarGini); atualizarGini(); mostrarFloresta(rfSel);
}
function atualizarGini() {
  const p = +$id("gini-p").value, g = 1 - p * p - (1 - p) * (1 - p);
  $id("gini-g").textContent = fmt(g, 2); $id("gini-fill").style.width = (g / 0.5) * 100 + "%";
  $id("gini-msg").innerHTML = `Em um nó, <b>${fmt(p * 100, 0)}%</b> dos golpes deram certo. ` + (g < 0.05 ? "Nó praticamente <b>puro</b>: a árvore pode parar." : g > 0.45 ? "<b>Mistura total</b> (50/50): a árvore precisa fazer outra pergunta." : "Ainda há mistura: boa pergunta é a que mais reduz este número.");
}

/* ================================= 08 · COMPARAÇÃO ================================= */
let cmpModelo = "rf";
function renderCmp(anim) {
  const lim = +$id("limiar").value; $id("limiar-v").textContent = fmt(lim, 2);
  const base = Math.max(D.teste.y.reduce((a, b) => a + b, 0) / D.teste.y.length, 1 - D.teste.y.reduce((a, b) => a + b, 0) / D.teste.y.length);
  const mlr = ML.matriz("lr", lim), mrf = ML.matriz("rf", lim);
  const linhas = [["Linha de base", base, "#8a7fa8"], ["Regressão Logística", mlr.acuracia, "#8c4dff"], ["Random Forest", mrf.acuracia, "#ff2d95"]];
  const box = $id("acc-bars"); if (!box.children.length) linhas.forEach(() => box.appendChild(el("div", "hrow", `<span></span><div class="tr"><i></i></div><b></b>`)));
  [...box.children].forEach((row, i) => { row.children[0].textContent = linhas[i][0]; const bar = row.children[1].firstChild; bar.style.background = linhas[i][2]; bar.style.width = linhas[i][1] * 100 + "%"; row.children[2].textContent = pct(linhas[i][1]); });
  const M = cmpModelo === "rf" ? mrf : mlr;
  $id("conf").innerHTML = `<span></span><span class="h">PREVIU FALHA</span><span class="h">PREVIU SUCESSO</span>
    <span class="h" style="writing-mode:vertical-rl;transform:rotate(180deg)">REAL: FALHOU</span><div class="cell ok"><b>${M.vn}</b><span>VN · acertou</span></div><div class="cell no"><b>${M.fp}</b><span>FP · falso alarme</span></div>
    <span class="h" style="writing-mode:vertical-rl;transform:rotate(180deg)">REAL: DEU CERTO</span><div class="cell no"><b>${M.fn}</b><span>FN · deixou passar</span></div><div class="cell ok"><b>${M.vp}</b><span>VP · acertou</span></div>`;
  $id("metrics").innerHTML = `<div><small>ACURÁCIA</small><b>${pct(M.acuracia)}</b></div><div><small>PRECISÃO</small><b>${pct(M.precisao)}</b></div><div><small>RECALL</small><b>${pct(M.recall)}</b></div>`;
  $id("cmp-msg").innerHTML = lim < 0.4 ? "<b>Limiar baixo:</b> o modelo aprova quase tudo. O recall sobe (acha mais golpes certos), mas a precisão cai (mais falsos alarmes)."
    : lim > 0.6 ? "<b>Limiar alto:</b> o modelo só aprova com muita certeza. A precisão sobe, mas o recall cai (deixa passar golpes bons)." : "<b>Limiar padrão (0,5):</b> o que usamos no projeto. Mexa no controle e veja a troca entre precisão e recall.";
  document.querySelectorAll("#cmp-tabs .pill").forEach((b) => b.classList.toggle("sel", b.dataset.m === cmpModelo));
}
function iniciarCmp() {
  const t = $id("cmp-tabs");
  [["rf", "Random Forest"], ["lr", "Regressão Logística"]].forEach(([m, n]) => { const b = el("button", "pill", n); b.dataset.m = m; b.addEventListener("click", () => { cmpModelo = m; renderCmp(); }); t.appendChild(b); });
  $id("limiar").addEventListener("input", renderCmp);
  const L = D.metricas["Regressão Logística"], F = D.metricas["Random Forest"];
  $id("overfit").innerHTML = `<div><small>LOGÍSTICA · TREINO → TESTE</small><b>${pct(L.acuracia_treino)} → ${pct(L.acuracia_teste)}</b>diferença de ${fmt((L.acuracia_treino - L.acuracia_teste) * 100, 1)} pontos</div><div><small>FOREST · TREINO → TESTE</small><b>${pct(F.acuracia_treino)} → ${pct(F.acuracia_teste)}</b>diferença de ${fmt((F.acuracia_treino - F.acuracia_teste) * 100, 1)} pontos (mais overfitting)</div>`;
  const ordem = D.colunas_saida.map((c, i) => ({ c, v: D.rf.importancias[i] })).sort((a, b) => b.v - a.v).slice(0, 6), mx = ordem[0].v;
  $id("imp-bars").innerHTML = ordem.map((o) => `<div class="hrow"><span>${NOME_VAR[o.c] || o.c}</span><div class="tr"><i style="--w:${(o.v / mx) * 100}%;background:#19e6d4"></i></div><b>${fmt(o.v * 100, 1)}%</b></div>`).join("");
  renderCmp();
}

/* ================================ 09 · SIMULADOR ================================ */
const SL_GOLPE = [["tamanho_equipe", 1, 4, 1], ["planejamento_min", 0, 120, 1], ["dificuldade", 1, 10, 1]];
const SL_JOGADOR = [["horas_semana", 1, 60, 1], ["nivel", 1, 100, 1], ["heists_anteriores", 0, 50, 1], ["agressividade", 0, 100, 1], ["furtividade", 0, 100, 1], ["precisao_tiro", 0, 100, 1], ["habilidade_direcao", 0, 100, 1], ["hackeamento", 0, 100, 1], ["trabalho_equipe", 0, 100, 1]];
const ARTE_GOLPE = { Banco: "banco", Joalheria: "joalheria", "Carro-forte": "carro", Cassino: "cassino" };
function slider(box, [chave, mn, mx, st]) {
  const row = el("div", "sl", `<label for="s-${chave}">${NOME_VAR[chave]}</label><output id="o-${chave}"></output><input type="range" id="s-${chave}" min="${mn}" max="${mx}" step="${st}">`);
  row.querySelector("input").addEventListener("input", (e) => { ESTADO[chave] = +e.target.value; ESTADO.preset = null; marcarPreset(); renderSim(); });
  box.appendChild(row);
}
function marcarPreset() { document.querySelectorAll(".preset").forEach((b) => b.classList.toggle("sel", b.dataset.id === ESTADO.preset)); }
function aplicarPreset(id) {
  const p = PRESETS.find((x) => x.id === id); Object.assign(ESTADO, p.e); ESTADO.preset = id; sincronizarSim(); renderSim(); marcarPreset();
}
function sincronizarSim() {
  [...SL_GOLPE, ...SL_JOGADOR].forEach(([c]) => { $id("s-" + c).value = ESTADO[c]; });
  document.querySelectorAll(".heist").forEach((b) => b.classList.toggle("sel", b.dataset.t === ESTADO.tipo_golpe));
}
function iniciarSim() {
  const hc = $id("heist-cards");
  Object.keys(ARTE_GOLPE).forEach((t) => {
    const b = el("button", "heist", `<div class="photo" data-art="${ARTE_GOLPE[t]}"></div><span>${t}</span>`); b.dataset.t = t;
    b.addEventListener("click", () => { ESTADO.tipo_golpe = t; ESTADO.dificuldade = DIF_BASE[t]; ESTADO.preset = null; sincronizarSim(); marcarPreset(); renderSim(); }); hc.appendChild(b);
  });
  ARTE.montarTudo(hc);
  SL_GOLPE.forEach((s) => slider($id("heist-sliders"), s)); SL_JOGADOR.forEach((s) => slider($id("player-sliders"), s));
  const pb = $id("presets");
  PRESETS.forEach((p) => {
    const b = el("button", "preset" + (p.art ? "" : " txt"), (p.art ? `<div class="photo" data-art="${p.art}"></div>` : "") + `<span>${p.nome}</span>`); b.dataset.id = p.id; b.title = p.tag;
    b.addEventListener("click", () => aplicarPreset(p.id)); pb.appendChild(b);
  });
  ARTE.montarTudo(pb);
  aplicarPreset("lucia");
}
function arco(id, nome, p, cor) {
  const box = $id(id);
  if (!box.firstChild) box.innerHTML = `<svg viewBox="0 0 120 68"><path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="11" stroke-linecap="round" pathLength="100"/><path class="arc" d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="${cor}" stroke-width="11" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" style="transition:stroke-dasharray .45s cubic-bezier(.2,.85,.2,1)"/></svg><div class="gv"></div><small>${nome}</small>`;
  box.querySelector(".arc").setAttribute("stroke-dasharray", `${Math.max(.01, p * 100)} 100`); box.querySelector(".gv").textContent = pct(p);
}
function renderSim() {
  const r = ML.prever(ESTADO), m = r.media;
  document.querySelectorAll("#heist-sliders input, #player-sliders input").forEach((i) => { $id("o-" + i.id.slice(2)).textContent = i.value; });
  const cls = m >= 0.6 ? "pass" : m >= 0.4 ? "risk" : "fail";
  $id("stamp").className = "stamp " + cls;
  $id("stamp").innerHTML = (cls === "pass" ? "Missão cumprida" : cls === "risk" ? "Risco alto" : "Wasted") + `<small>${pct(m)} DE CHANCE · ${cls === "pass" ? "PODE IR" : cls === "risk" ? "MELHORE O PLANO" : "REPENSE O GOLPE"}</small>`;
  $id("profile-line").innerHTML = `Perfil (K-Means): <b>${r.perfil.nome}</b> · distância ${fmt(r.perfil.distancia, 2)}`;
  arco("g-lr", "REGRESSÃO LOGÍSTICA", r.lr.p, "#8c4dff"); arco("g-rf", "RANDOM FOREST", r.rf.p, "#ff2d95");
  const contrib = D.colunas_saida.map((c, i) => ({ c, v: r.lr.contrib[i] })).filter((o) => !o.c.startsWith("tipo_golpe_"));
  const mx = Math.max(...contrib.map((o) => Math.abs(o.v)), 0.5);
  const pos = contrib.filter((o) => o.v > 0.005).sort((a, b) => b.v - a.v).slice(0, 4), neg = contrib.filter((o) => o.v < -0.005).sort((a, b) => a.v - b.v).slice(0, 4);
  const linha = (o) => `<div class="why-row"><span>${NOME_VAR[o.c]}</span><div class="tr"><i style="${o.v >= 0 ? "left:50%" : "right:50%"};width:${(Math.abs(o.v) / mx) * 50}%;background:${o.v >= 0 ? "#3ddc84" : "#ff4d6d"}"></i></div><b style="color:${o.v >= 0 ? "#3ddc84" : "#ff4d6d"}">${o.v >= 0 ? "+" : ""}${o.v.toFixed(2)}</b></div>`;
  $id("why").innerHTML = `<small>POR QUÊ? (O QUE AJUDA E O QUE ATRAPALHA)</small>` + pos.map(linha).join("") + neg.map(linha).join("");
  radar(ESTADO, "#ff2d95", "sim-radar");
  const sim = r.rf.votos.filter((v) => v >= 0.5).length;
  $id("vote-line").innerHTML = `<b>${sim}</b> de ${r.rf.votos.length} árvores votam "sucesso"`;
  if (Math.abs(r.lr.p - r.rf.p) >= 0.15) $id("why").innerHTML += `<p class="micro" style="margin-top:.3rem">Os modelos discordam: a Random Forest captura interações entre perfil e golpe; a logística é linear.</p>`;
}

/* ================================== 10 · TERMINAL ================================== */
const term = { aba: 0, timer: null };
const SCRIPTS = () => Object.keys(D.terminal);
function termAba(i) {
  clearInterval(term.timer); term.aba = i; const nome = SCRIPTS()[i];
  document.querySelectorAll("#term-tabs .pill").forEach((b, j) => b.classList.toggle("sel", i === j));
  $id("term-title").textContent = "~/gta6-ml — python " + nome;
  $id("term-out").innerHTML = `<span class="p">$ python ${nome}</span>\n<span class="cursor"></span>`; $id("term-run").textContent = "▶ Executar";
}
function termRodar() {
  clearInterval(term.timer); const nome = SCRIPTS()[term.aba], linhas = D.terminal[nome].split("\n"), out = $id("term-out"); let n = 0;
  const cabe = (l) => l.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const marca = (l) => (/^(=+|\s*ETAPA|\[\d+\]|\s*>>>|\s*RESULTADO)/.test(l) ? `<span class="p">${cabe(l)}</span>` : cabe(l));
  $id("term-run").textContent = "↺ Executar de novo";
  term.timer = setInterval(() => {
    n = Math.min(linhas.length, n + 2);
    out.innerHTML = `<span class="p">$ python ${nome}</span>\n` + linhas.slice(0, n).map(marca).join("\n") + (n < linhas.length ? '\n<span class="cursor"></span>' : "");
    out.scrollTop = out.scrollHeight; if (n >= linhas.length) clearInterval(term.timer);
  }, 28);
}
function iniciarTerm() {
  const t = $id("term-tabs"); SCRIPTS().forEach((n, i) => { const b = el("button", "pill", n); b.addEventListener("click", () => termAba(i)); t.appendChild(b); });
  $id("term-run").addEventListener("click", termRodar); termAba(0);
}

/* ================================== 11 · LIMITES ================================== */
const LIMITES = [
  ["Dados simulados", "Método, não conclusão", "Os modelos aprendem regras que nós mesmos escrevemos no simulador. O que mostramos é a metodologia (limpar, agrupar, prever e avaliar), e não uma verdade sobre o GTA 6 real."],
  ["O acaso limita a acurácia", "Nem o melhor jogador acerta sempre", "Sorteamos o resultado a partir da probabilidade: um jogador excelente ainda pode falhar. Por isso o teto fica perto de 75–80%, e não 100%."],
  ["Limiar fixo de 0,5", "Decidir é escolher o que errar menos", "Dizemos \"sucesso\" quando p ≥ 0,5. Como vimos na comparação, mudar o limiar troca precisão por recall. A escolha certa depende do custo de cada erro."],
  ["Próximos passos", "Como melhorar", "Ajustar hiperparâmetros com GridSearchCV, testar Gradient Boosting, avaliar com curva ROC e AUC e, principalmente, usar dados reais de partidas."],
];
function iniciarLimites() {
  const box = $id("lim-list");
  LIMITES.forEach((l, i) => { const b = el("button", "lim-card" + (i === 0 ? " sel" : ""), `<i>0${i + 1}</i><strong>${l[0]}</strong>`); b.addEventListener("click", () => mostrarLimite(i)); box.appendChild(b); });
  mostrarLimite(0);
}
function mostrarLimite(i) {
  document.querySelectorAll(".lim-card").forEach((b, j) => b.classList.toggle("sel", i === j));
  $id("lim-k").textContent = "0" + (i + 1) + " / 04"; $id("lim-t").textContent = LIMITES[i][1]; $id("lim-p").textContent = LIMITES[i][2];
}

/* ================================ 12 · COMO RODAR ================================ */
const COMO = [
  { nome: "VS Code", sub: "recomendado", titulo: "Rodar no Visual Studio Code",
    passos: ["Instale o <b>Python 3.10 ou mais novo</b> (python.org) marcando <b>Add Python to PATH</b>.", "Instale o <b>VS Code</b> e a extensão <b>Python</b> (da Microsoft).", "<b>File → Open Folder</b> e escolha a pasta do projeto. Abra o terminal com <b>Ctrl + '</b>.", "<b>Ctrl+Shift+P → Python: Select Interpreter</b> e escolha o <b>.venv</b>.", "Use o botão <b>▶ Run Python File</b> no canto superior, ou <b>F5</b> para depurar com breakpoints."],
    cmds: [["Ambiente virtual (uma vez)", "python -m venv .venv"], ["Ativar no Windows", ".venv\\Scripts\\activate"], ["Ativar no Linux/Mac", "source .venv/bin/activate"], ["Instalar dependências", "pip install -r requirements.txt"], ["Rodar em ordem", "python 01_gerar_dados.py\npython 02_nao_supervisionado.py\npython 03_supervisionado.py\npython main.py"]] },
  { nome: "PyCharm", sub: "IDE completa", titulo: "Rodar no PyCharm",
    passos: ["<b>File → Open</b> e escolha a pasta do projeto.", "<b>Settings → Project → Python Interpreter → Add → Virtualenv</b>. O PyCharm oferece instalar o <b>requirements.txt</b> sozinho.", "Clique com o botão direito em cada arquivo e use <b>Run</b> (na ordem 01, 02, 03).", "Para o <b>main.py</b>, rode e digite as opções direto na janela <b>Run</b> (aceita input)."],
    cmds: [["Se os acentos saírem errados", "set PYTHONIOENCODING=utf-8"], ["Terminal do PyCharm (Alt+F12)", "python main.py"]] },
  { nome: "Terminal", sub: "sem IDE", titulo: "Rodar só pelo terminal",
    passos: ["Abra o <b>Prompt de Comando</b>, o <b>PowerShell</b> ou o terminal do Linux/Mac.", "Entre na pasta do projeto com <b>cd</b>.", "Se <b>python</b> não for encontrado no Windows, tente <b>py -3</b>.", "O Python é <b>interpretado</b>: não existe etapa de compilação. É só executar o arquivo."],
    cmds: [["Entrar na pasta", "cd caminho\\para\\gta6-ml"], ["Conferir a versão", "python --version"], ["Instalar", "pip install -r requirements.txt"], ["Rodar tudo", "python 01_gerar_dados.py\npython 02_nao_supervisionado.py\npython 03_supervisionado.py\npython main.py"]] },
  { nome: "Google Colab", sub: "sem instalar nada", titulo: "Rodar no Google Colab",
    passos: ["Acesse <b>colab.research.google.com</b> e crie um <b>Novo notebook</b>.", "No ícone de pasta (barra lateral), <b>faça upload</b> dos 4 arquivos .py e do requirements.txt.", "Em cada célula, rode os comandos ao lado. O <b>main.py</b> usa <b>%run</b>, que aceita digitação.", "Para ver os gráficos, use a última célula."],
    cmds: [["Célula 1", "!pip install -q -r requirements.txt"], ["Célula 2", "%run 01_gerar_dados.py\n%run 02_nao_supervisionado.py\n%run 03_supervisionado.py"], ["Célula 3 (menu interativo)", "%run main.py"], ["Célula 4 (gráfico)", "from IPython.display import Image\nImage('graficos/02_clusters_pca.png')"]] },
  { nome: "Jupyter", sub: "notebook local", titulo: "Rodar no Jupyter Notebook",
    passos: ["Instale e abra o Jupyter na pasta do projeto.", "Crie um notebook e use <b>%run</b> em cada célula (igual ao Colab).", "Útil para mostrar os gráficos e o código lado a lado."],
    cmds: [["Instalar", "pip install notebook"], ["Abrir", "jupyter notebook"], ["Em uma célula", "%run main.py"]] },
];
function iniciarComo() {
  const tabs = $id("how-tabs");
  COMO.forEach((c, i) => { const b = el("button", i === 0 ? "sel" : "", `${c.nome}<small>${c.sub}</small>`); b.addEventListener("click", () => mostrarComo(i)); tabs.appendChild(b); });
  mostrarComo(0);
}
function mostrarComo(i) {
  const c = COMO[i];
  document.querySelectorAll("#how-tabs button").forEach((b, j) => b.classList.toggle("sel", i === j));
  $id("how-text").innerHTML = `<h3>${c.titulo}</h3><ol>${c.passos.map((p) => `<li>${p}</li>`).join("")}</ol>`;
  const box = $id("how-code"); box.innerHTML = "";
  c.cmds.forEach(([rot, cmd]) => {
    box.appendChild(el("span", "cmd-label", rot.toUpperCase()));
    const row = el("div", "cmd"), code = el("code"), btn = el("button", "", "COPIAR");
    code.textContent = cmd;
    btn.addEventListener("click", () => { (navigator.clipboard ? navigator.clipboard.writeText(cmd) : Promise.reject()).then(() => { btn.textContent = "COPIADO ✔"; }, () => { btn.textContent = "SELECIONE"; }); setTimeout(() => (btn.textContent = "COPIAR"), 1400); });
    row.append(code, btn); box.appendChild(row);
  });
}

/* ============================== FIM + ENTRADA DOS SLIDES ============================== */
function iniciarFim() {
  $id("end-stats").textContent = `${D.rf.arvores.length} ÁRVORES · ${fmt(D.pontos.x.length)} JOGADORES · ${D.kmeans.centros.length} PERFIS · ${pct(D.metricas["Random Forest"].acuracia_teste, 0)} DE ACURÁCIA`;
}
function iniciarSlides() {
  iniciarBrief(); iniciarPipeline(); iniciarDados(); iniciarKM(); iniciarPerfis(); iniciarLR(); iniciarRF(); iniciarCmp(); iniciarSim(); iniciarTerm(); iniciarLimites(); iniciarComo(); iniciarFim();
  addEventListener("resize", () => onEnterSlide(current));
}
function onEnterSlide(i) {
  requestAnimationFrame(() => setTimeout(() => {
    if (i === 1) desenharBrief();
    else if (i === 3) desenharZ();
    else if (i === 4) desenharKM();
    else if (i === 5) desenharPCA();
    else if (i === 6) desenharSig();
    else if (i === 7) mostrarFloresta(rfSel);
    else if (i === 8) renderCmp();
    else if (i === 9) renderSim();
    else if (i === 10) termAba(term.aba);
  }, 120));
}
