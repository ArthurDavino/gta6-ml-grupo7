/* modelo.js — motor de inferência no navegador
 * Faz as MESMAS contas do main.py, usando os números exportados em modelo_web.js:
 *   padronização (z-score + one-hot) -> K-Means -> Regressão Logística -> Random Forest
 * Nada aqui treina modelos de verdade, exceto o K-Means ao vivo (Lloyd), que é
 * o mesmo algoritmo do arquivo 02_nao_supervisionado.py.
 */
(function (root) {
  "use strict";
  const D = root.GTA6;

  const sigmoide = (z) => 1 / (1 + Math.exp(-z));

  /** entrada: { tipo_golpe, horas_semana, ... }  ->  vetor z com as 16 colunas de saída */
  function transformar(entrada) {
    const z = D.numericas.map((c, i) => (entrada[c] - D.scaler.media[i]) / D.scaler.escala[i]);
    D.categorias.forEach((cat) => z.push(entrada.tipo_golpe === cat ? 1 : 0));
    return z;
  }

  /** z = b + soma(w_i * z_i); p = sigmoide(z) */
  function regressaoLogistica(z) {
    const contrib = z.map((v, i) => v * D.lr.coef[i]);
    const logit = D.lr.intercepto + contrib.reduce((a, b) => a + b, 0);
    return { p: sigmoide(logit), logit, contrib };
  }

  function percorrer(arvore, z) {
    let i = 0;
    for (;;) {
      const no = arvore[i];
      if (no.length === 1) return no[0];
      i = Math.fround(z[no[0]]) <= no[1] ? no[2] : no[3]; // sklearn compara em float32
    }
  }

  /** Cada árvore dá uma probabilidade; a floresta tira a média (votação suave). */
  function floresta(z) {
    const votos = D.rf.arvores.map((a) => percorrer(a, z));
    return { p: votos.reduce((a, b) => a + b, 0) / votos.length, votos };
  }

  /** K-Means: o perfil é o centróide mais próximo (distância euclidiana). */
  function perfil(z) {
    const x = D.perfil.map((c) => z[D.colunas_saida.indexOf(c)]);
    let melhor = 0, dMin = Infinity;
    D.kmeans.centros.forEach((c, k) => {
      const d = Math.hypot(...c.map((v, i) => v - x[i]));
      if (d < dMin) { dMin = d; melhor = k; }
    });
    return { cluster: melhor, nome: D.kmeans.nomes[melhor], distancia: dMin, x };
  }

  /** Projeção PCA (2D) de um vetor de perfil já padronizado. */
  function projetar(x) {
    return D.pca.componentes.map((comp) => comp.reduce((s, c, i) => s + c * (x[i] - D.pca.media[i]), 0));
  }

  function prever(entrada) {
    const z = transformar(entrada);
    const lr = regressaoLogistica(z), rf = floresta(z), pf = perfil(z);
    return { z, lr, rf, perfil: pf, media: (lr.p + rf.p) / 2, pca: projetar(pf.x) };
  }

  /* ---------- K-Means ao vivo (algoritmo de Lloyd) ---------- */
  function criarKMeans(k, semente, maisMais) {
    const X = D.pontos.z, n = X.length, d = X[0].length;
    let s = (semente >>> 0) || 1;
    const aleat = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const centros = [];
    if (!maisMais) {                       // início aleatório: k pontos quaisquer
      const usados = new Set();
      while (centros.length < k) {
        const i = Math.floor(aleat() * n);
        if (!usados.has(i)) { usados.add(i); centros.push(X[i].slice()); }
      }
    } else {                               // k-means++: próximos centros longe dos já escolhidos
      centros.push(X[Math.floor(aleat() * n)].slice());
      while (centros.length < k) {
        const d2 = X.map((x) => Math.min(...centros.map((c) => x.reduce((a, v, j) => a + (v - c[j]) ** 2, 0))));
        let r = aleat() * d2.reduce((a, b) => a + b, 0), i = 0;
        while (r > d2[i] && i < n - 1) { r -= d2[i]; i++; }
        centros.push(X[i].slice());
      }
    }
    const estado = { k, centros, rotulos: new Array(n).fill(-1), inercia: null, iteracao: 0, convergiu: false };
    estado.passo = function () {
      let mudou = false, inercia = 0;
      for (let i = 0; i < n; i++) {                         // 1) atribuição
        let b = 0, dm = Infinity;
        for (let c = 0; c < k; c++) {
          let dd = 0;
          for (let j = 0; j < d; j++) { const t = X[i][j] - estado.centros[c][j]; dd += t * t; }
          if (dd < dm) { dm = dd; b = c; }
        }
        if (estado.rotulos[i] !== b) { estado.rotulos[i] = b; mudou = true; }
        inercia += dm;
      }
      const soma = Array.from({ length: k }, () => new Array(d).fill(0)), qtd = new Array(k).fill(0);
      for (let i = 0; i < n; i++) { qtd[estado.rotulos[i]]++; for (let j = 0; j < d; j++) soma[estado.rotulos[i]][j] += X[i][j]; }
      for (let c = 0; c < k; c++) if (qtd[c]) estado.centros[c] = soma[c].map((v) => v / qtd[c]); // 2) atualização
      estado.inercia = inercia; estado.iteracao++; estado.convergiu = !mudou;
      return estado;
    };
    return estado;
  }

  /* ---------- matriz de confusão com limiar variável ---------- */
  function matriz(modelo, limiar) {
    const p = D.teste["p_" + modelo], y = D.teste.y;
    let vp = 0, vn = 0, fp = 0, fn = 0;
    p.forEach((pi, i) => {
      const prev = pi >= limiar ? 1 : 0;
      if (prev && y[i]) vp++; else if (!prev && !y[i]) vn++; else if (prev) fp++; else fn++;
    });
    const n = y.length;
    return { vp, vn, fp, fn, acuracia: (vp + vn) / n, precisao: vp + fp ? vp / (vp + fp) : 0, recall: vp + fn ? vp / (vp + fn) : 0 };
  }

  root.ML = { D, sigmoide, transformar, regressaoLogistica, floresta, perfil, projetar, prever, criarKMeans, matriz };
})(typeof window !== "undefined" ? window : globalThis);
