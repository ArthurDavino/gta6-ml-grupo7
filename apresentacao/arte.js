/* arte.js — ilustrações em SVG (arte original do projeto, estilo "tela de carregamento")
 *
 * Os personagens são ilustrações ESTILIZADAS feitas aqui, não imagens oficiais da Rockstar.
 * Quer usar fotos/arte oficial? Coloque os arquivos em  apresentacao/img/  com os nomes:
 *      jason.jpg  e  lucia.jpg   (também aceita .png ou .webp)
 * A apresentação troca sozinha a ilustração pela sua imagem.
 */
(function (root) {
  "use strict";
  let uid = 0;
  const id = (p) => `${p}${++uid}`;
  const sol = (cx, cy, r, g, mascara) => `
    <defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe45e"/><stop offset=".55" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff2d95"/></linearGradient>
      <mask id="${mascara}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>
        ${[0.28, 0.42, 0.56, 0.7, 0.84].map((t, i) => `<rect x="${cx - r}" y="${cy - r + 2 * r * t}" width="${2 * r}" height="${2 + i * 1.6}" fill="#000"/>`).join("")}
      </mask>
    </defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})" mask="url(#${mascara})"/>`;
  const ceu = (g, stops) => `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient></defs><rect width="300" height="400" fill="url(#${g})"/>`;
  const palmeira = (x, y, s, cor = "#12072b") => {
    const folhas = [-75, -40, -8, 25, 60, 95, 130, 165].map((a) => `<path d="M0 0 C 26 -22 58 -20 84 6 C 56 -6 26 -4 0 0 Z" transform="rotate(${a})" fill="${cor}"/>`).join("");
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0 C 5 -50 -6 -100 6 -150 L 12 -150 C 2 -100 14 -50 6 0 Z" fill="${cor}"/><g transform="translate(9 -150)">${folhas}</g></g>`;
  };
  const predios = (y, cor, seed = 1) => {
    let x = 0, s = seed, out = "";
    while (x < 300) {
      s = (s * 9301 + 49297) % 233280;
      const w = 16 + (s % 22), h = 40 + ((s >> 3) % 90);
      out += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${cor}"/>`;
      for (let j = 0; j < 6; j++) out += `<rect x="${x + 3 + (j % 3) * 5}" y="${y - h + 6 + Math.floor(j / 3) * 9}" width="2.4" height="3" fill="#ffd23f" opacity=".55"/>`;
      x += w + 2;
    }
    return out;
  };
  const moldura = (corpo) => `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img">${corpo}</svg>`;

  /* --------------------------- personagens --------------------------- */
  function lucia() {
    const c = id("lu"), g = id("lg"), m = id("lm"), r = id("lr"), v = id("lv");
    return moldura(`
      ${ceu(c, [[0, "#3b1a8a"], [0.45, "#d6308f"], [0.8, "#ff8a3d"], [1, "#ffd23f"]])}
      ${sol(220, 150, 70, g, m)}
      ${predios(290, "#1a0a3d", 4)}
      ${palmeira(34, 330, 0.9)}${palmeira(272, 340, 0.8)}
      <defs>
        <linearGradient id="${r}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a2a9e"/><stop offset=".7" stop-color="#ff5aa0"/><stop offset="1" stop-color="#ffb347"/></linearGradient>
        <linearGradient id="${v}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a3d"/><stop offset="1" stop-color="#19e6d4"/></linearGradient>
      </defs>
      <path d="M92 150 C84 86 118 54 152 54 C190 54 222 88 210 152 C218 214 232 268 222 350 L78 350 C68 268 86 212 92 150 Z" fill="#1a0b16"/>
      <path d="M128 214 L172 214 L176 268 L124 268 Z" fill="#b4724f"/>
      <path d="M50 400 C48 306 96 266 150 266 C206 266 254 306 252 400 Z" fill="url(#${r})"/>
      <path d="M118 268 C128 292 172 292 182 268 C172 276 128 276 118 268Z" fill="#8a4a35" opacity=".55"/>
      <ellipse cx="150" cy="164" rx="49" ry="60" fill="#d39a77"/>
      <path d="M103 150 C112 96 160 78 198 116 C178 104 146 112 130 156 C122 138 112 138 103 150 Z" fill="#1a0b16"/>
      <path d="M198 160 C200 200 190 226 164 226" fill="none" stroke="#ff7a4a" stroke-width="3" opacity=".55"/>
      <g><rect x="106" y="158" width="40" height="26" rx="11" fill="#0c0616"/><rect x="154" y="158" width="40" height="26" rx="11" fill="#0c0616"/><rect x="144" y="164" width="12" height="4" fill="#0c0616"/>
         <path d="M112 164 L124 164 L116 180 L110 180Z" fill="url(#${v})" opacity=".85"/><path d="M160 164 L172 164 L164 180 L158 180Z" fill="url(#${v})" opacity=".85"/></g>
      <path d="M138 205 C146 212 156 212 164 205 C158 216 144 216 138 205Z" fill="#e0457c"/>
      <circle cx="102" cy="186" r="4" fill="#ffd23f"/><circle cx="198" cy="186" r="4" fill="#ffd23f"/>
      <rect width="300" height="400" fill="none" stroke="#fff" stroke-opacity=".12"/>`);
  }

  function jason() {
    const c = id("ja"), g = id("jg"), m = id("jm"), r = id("jr"), v = id("jv");
    return moldura(`
      ${ceu(c, [[0, "#122a6b"], [0.45, "#7b2cbf"], [0.8, "#ff5d8f"], [1, "#ffb347"]])}
      ${sol(84, 140, 64, g, m)}
      ${predios(292, "#150a38", 9)}
      ${palmeira(266, 336, 0.95)}${palmeira(30, 346, 0.7)}
      <defs>
        <linearGradient id="${r}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8e0f5"/><stop offset=".6" stop-color="#ffe9f5"/><stop offset="1" stop-color="#ffcf8a"/></linearGradient>
        <linearGradient id="${v}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19e6d4"/><stop offset="1" stop-color="#ff2d95"/></linearGradient>
      </defs>
      <path d="M124 208 L176 208 L182 270 L118 270 Z" fill="#a8683f"/>
      <path d="M36 400 C34 304 88 266 150 266 C212 266 266 304 264 400 Z" fill="url(#${r})"/>
      <path d="M112 266 C126 300 174 300 188 266 C176 280 124 280 112 266Z" fill="#8a5233" opacity=".6"/>
      <path d="M126 282 C134 322 166 322 174 282" fill="none" stroke="#ffd23f" stroke-width="3"/><circle cx="150" cy="318" r="5" fill="#ffd23f"/>
      <path d="M60 330 C70 300 90 288 104 284" fill="none" stroke="#2a1a40" stroke-width="3" opacity=".45"/>
      <path d="M240 330 C230 300 210 288 196 284" fill="none" stroke="#2a1a40" stroke-width="3" opacity=".45"/>
      <ellipse cx="150" cy="160" rx="52" ry="58" fill="#c28660"/>
      <path d="M100 168 C104 214 128 232 150 232 C172 232 196 214 200 168 C196 196 176 210 150 210 C124 210 104 196 100 168Z" fill="#3a2418" opacity=".55"/>
      <path d="M99 144 C96 92 122 74 150 74 C180 74 205 92 201 144 C192 118 174 106 150 106 C126 106 108 118 99 144Z" fill="#1c120f"/>
      <path d="M200 156 C202 198 192 224 164 232" fill="none" stroke="#ffb347" stroke-width="3" opacity=".6"/>
      <g><path d="M104 156 H196 V166 C196 186 182 192 168 190 C158 189 154 180 150 180 C146 180 142 189 132 190 C118 192 104 186 104 166Z" fill="#0c0616"/>
         <path d="M112 162 L130 162 L120 178 L112 176Z" fill="url(#${v})" opacity=".85"/><path d="M162 162 L180 162 L170 178 L162 176Z" fill="url(#${v})" opacity=".85"/></g>
      <path d="M136 208 C144 213 156 213 164 208" fill="none" stroke="#6a3a2a" stroke-width="3" stroke-linecap="round"/>
      <rect width="300" height="400" fill="none" stroke="#fff" stroke-opacity=".12"/>`);
  }

  /* ----------------------------- cenários ---------------------------- */
  function cidade() {
    const c = id("ci"), g = id("cg"), m = id("cm");
    return moldura(`
      ${ceu(c, [[0, "#220a54"], [0.4, "#b02a8e"], [0.72, "#ff6a5a"], [1, "#ffc23f"]])}
      ${sol(150, 230, 92, g, m)}
      ${predios(300, "#1a0a3d", 3)}
      <rect y="300" width="300" height="100" fill="#14072f"/>
      <g opacity=".5">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${60 + i * 30}" y="${312 + i * 5}" width="${180 - i * 30}" height="3" fill="#ff7ab0"/>`).join("")}</g>
      ${palmeira(30, 330, 1.05)}${palmeira(262, 336, 0.9)}${palmeira(222, 330, 0.6)}`);
  }
  function carro() {
    const c = id("ca"), g = id("cg"), m = id("cm");
    return moldura(`
      ${ceu(c, [[0, "#1c0b4f"], [0.45, "#c2308f"], [0.78, "#ff8a3d"], [1, "#ffd23f"]])}
      ${sol(150, 210, 80, g, m)}
      <rect y="268" width="300" height="132" fill="#150830"/>
      <path d="M0 400 L150 268 L300 400Z" fill="#1d0c42"/>
      <path d="M150 268 L146 400 M150 268 L154 400" stroke="#ffd23f" stroke-width="2" stroke-dasharray="10 12" opacity=".7"/>
      <g transform="translate(6 40)">
        <path d="M30 250 L52 236 L108 232 L130 214 L176 214 L198 232 L262 238 L286 252 L286 270 L30 270 Z" fill="#0b0418" stroke="#ff5aa0" stroke-width="1.5"/>
        <path d="M126 214 L112 232" stroke="#ff5aa0" stroke-width="2"/>
        <circle cx="82" cy="272" r="17" fill="#0b0418" stroke="#19e6d4" stroke-width="2"/><circle cx="242" cy="272" r="17" fill="#0b0418" stroke="#19e6d4" stroke-width="2"/>
        <circle cx="146" cy="200" r="13" fill="#0b0418"/><path d="M132 198 C128 214 136 222 146 222 C142 212 144 204 150 192 C140 186 134 190 132 198Z" fill="#0b0418"/>
        <circle cx="176" cy="202" r="13" fill="#0b0418"/><path d="M190 208 C202 214 204 232 196 234 C198 224 192 220 186 218Z" fill="#0b0418"/>
      </g>
      ${palmeira(22, 300, 0.8)}${palmeira(280, 304, 0.7)}`);
  }
  function banco() {
    const c = id("ba");
    return moldura(`
      ${ceu(c, [[0, "#0a0a2e"], [0.6, "#2a1060"], [1, "#6d1c7a"]])}
      <g opacity=".22"><polygon points="60,0 130,300 20,300" fill="#fff"/><polygon points="240,0 300,300 190,300" fill="#9ff"/></g>
      <rect y="300" width="300" height="100" fill="#0d0524"/>
      <path d="M36 176 L150 116 L264 176 Z" fill="#1b0d45" stroke="#ffd23f" stroke-width="2"/>
      <circle cx="150" cy="156" r="14" fill="none" stroke="#ffd23f" stroke-width="2"/><text x="150" y="162" text-anchor="middle" font-size="18" font-weight="700" fill="#ffd23f" font-family="Arial">$</text>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${52 + i * 44}" y="184" width="16" height="96" fill="#1b0d45" stroke="#ff5aa0" stroke-width="1.2"/>`).join("")}
      <rect x="40" y="280" width="220" height="10" fill="#241058"/><rect x="30" y="290" width="240" height="10" fill="#2a1368"/>
      <g fill="#ff2d95"><circle cx="40" cy="60" r="3"/><circle cx="260" cy="90" r="3"/></g>`);
  }
  function cassino() {
    const c = id("cs");
    return moldura(`
      ${ceu(c, [[0, "#08162b"], [0.55, "#2a0a52"], [1, "#a81d86"]])}
      ${predios(310, "#12062c", 6)}
      <rect x="36" y="110" width="228" height="92" rx="16" fill="#12062c" stroke="#19e6d4" stroke-width="3"/>
      <text x="150" y="168" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="46" fill="#ff2d95" stroke="#ffd23f" stroke-width="1">CASINO</text>
      <g fill="#fff" stroke="#0b0418" stroke-width="2"><rect x="76" y="226" width="40" height="40" rx="8" transform="rotate(-12 96 246)"/><rect x="170" y="236" width="40" height="40" rx="8" transform="rotate(10 190 256)"/></g>
      <g fill="#0b0418"><circle cx="86" cy="236" r="3.4"/><circle cx="106" cy="256" r="3.4"/><circle cx="96" cy="246" r="3.4"/><circle cx="180" cy="246" r="3.4"/><circle cx="200" cy="266" r="3.4"/></g>
      <rect y="320" width="300" height="80" fill="#0d0524"/>`);
  }

  function joalheria() {
    const c = id("jo"), g = id("jb");
    return moldura(`
      ${ceu(c, [[0, "#0a1230"], [0.6, "#3a1272"], [1, "#a81d86"]])}
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff7ff"/><stop offset=".5" stop-color="#19e6d4"/><stop offset="1" stop-color="#8c4dff"/></linearGradient></defs>
      <rect x="30" y="120" width="240" height="140" rx="12" fill="#12062c" stroke="#ffd23f" stroke-width="3"/>
      <rect x="42" y="132" width="216" height="116" rx="6" fill="#1c0b45"/>
      <g><polygon points="150,150 180,170 150,214 120,170" fill="url(#${g})" stroke="#fff" stroke-width="1.5"/><polyline points="120,170 180,170" stroke="#fff" stroke-width="1" fill="none"/><polyline points="135,160 150,170 165,160 150,150" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/></g>
      <g transform="translate(70 200) scale(.5)"><polygon points="30,0 60,20 30,64 0,20" fill="url(#${g})" stroke="#fff" stroke-width="2"/></g>
      <g transform="translate(200 196) scale(.55)"><polygon points="30,0 60,20 30,64 0,20" fill="url(#${g})" stroke="#fff" stroke-width="2"/></g>
      <g fill="#fff"><path d="M92 146 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M210 150 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/></g>
      <text x="150" y="100" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="30" fill="#ffd23f" stroke="#ff2d95" stroke-width="1">JOIAS</text>
      <rect y="300" width="300" height="100" fill="#0d0524"/>`);
  }

  const FABRICA = { lucia, jason, cidade, carro, banco, cassino, joalheria };
  const override = {};

  function montar(el) {
    const nome = el.dataset.art;
    if (override[nome]) { el.innerHTML = `<img src="${override[nome]}" alt="" style="width:100%;height:100%;object-fit:cover">`; return; }
    el.innerHTML = FABRICA[nome] ? FABRICA[nome]() : "";
  }
  function montarTudo(raiz) { (raiz || document).querySelectorAll("[data-art]").forEach(montar); }

  /* Procura imagens do usuário em img/ (jason e lucia) e troca a ilustração. */
  function procurarImagens() {
    ["jason", "lucia"].forEach((nome) => {
      ["jpg", "png", "webp"].forEach((ext) => {
        const url = `img/${nome}.${ext}`, im = new Image();
        im.onload = () => { override[nome] = url; document.querySelectorAll(`[data-art="${nome}"]`).forEach(montar); };
        im.src = url;
      });
    });
  }

  root.ARTE = { montarTudo, montar, procurarImagens, FABRICA };
})(window);
