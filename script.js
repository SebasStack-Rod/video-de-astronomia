/* ===========================================================
   ¿QUÉ HAY ALLÁ AFUERA? · Video animado de astronomía
   -----------------------------------------------------------
   index.html  estructura y textos de cada escena
   styles.css  diseño
   script.js   reloj del video, animaciones e imágenes

   Las imágenes se leen de la carpeta imagenes/ con los nombres
   del guion. Si falta alguna, se muestra una ilustración de
   referencia con el nombre del archivo que la reemplaza.

   Pruebas rápidas: abrir index.html?t=125 salta al segundo 125.
   En la consola: VIDEO.buscar(300), VIDEO.reproducir(), VIDEO.pausar().
   =========================================================== */
'use strict';

/* ---------- 1. CONFIGURACIÓN ---------- */
const CONFIG = {
  carpetaImagenes: 'imagenes/',
  // Si el archivo no está como .jpg, se prueban estas extensiones en orden.
  extensiones: ['jpg', 'jpeg', 'png', 'webp'],
  // true: las fases de la Luna se dibujan como se ven desde el hemisferio sur.
  hemisferioSur: true,
  // Narración grabada (opcional). Ejemplo: { s1: 'audio/escena1.mp3' }
  audioPorEscena: {},
};

// Duración de cada escena en segundos (salen de los tiempos del guion).
const ESCENAS = [
  { id: 's1', nombre: 'Apertura', dur: 40 },
  { id: 's2', nombre: 'La Luna', dur: 120 },
  { id: 's3', nombre: 'Las constelaciones', dur: 100 },
  { id: 's4', nombre: 'La Vía Láctea', dur: 60 },
  { id: 's5', nombre: 'El agujero negro', dur: 70 },
  { id: 's6', nombre: 'Venus', dur: 70 },
  { id: 's7', nombre: 'Las Voyager', dur: 80 },
  { id: 's8', nombre: 'El disco de oro', dur: 60 },
  { id: 's9', nombre: 'Cierre', dur: 60 },
  { id: 's10', nombre: 'Créditos', dur: 14 },
];
let acumulado = 0;
ESCENAS.forEach(e => { e.ini = acumulado; acumulado += e.dur; e.fin = acumulado; });
const DURACION_TOTAL = acumulado;

const FUENTE_SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
const FUENTE_SANS = '"Segoe UI",system-ui,-apple-system,Arial,sans-serif';
const FUENTE_SVG = 'Segoe UI, system-ui, Arial, sans-serif';   // sin comillas, para atributos SVG

/* ---------- 2. UTILIDADES ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const acotar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mezcla = (a, b, t) => a + (b - a) * t;
const suave = t => t * t * (3 - 2 * t);
const progreso = (ts, a, b) => acotar((ts - a) / (b - a));
const tiempoTexto = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function aleatorio(semilla) {
  let s = semilla >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

/* ---------- 3. FONDO ESTRELLADO (y salto entre escenas) ---------- */
const Fondo = (() => {
  const cv = $('#fondo');
  const ctx = cv.getContext('2d');
  let w = 0, h = 0, estrellas = [], lite = false;
  const E = { revelado: 1, warp: 0, reloj: 0 };

  function crear(n) {
    const r = aleatorio(20261);
    estrellas = Array.from({ length: n }, () => {
      const t = r();
      return {
        x: r() * 2 - 1, y: r() * 2 - 1, z: 0.15 + r() * 0.85,
        fase: r() * 6.28, vel: 0.7 + r() * 1.6, orden: r(),
        color: t < 0.14 ? '#b4ccff' : t > 0.86 ? '#ffe2b8' : '#eef2ff',
      };
    });
  }
  function ajustar() {
    const dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(1, Math.floor(window.innerWidth * dpr));
    h = Math.max(1, Math.floor(window.innerHeight * dpr));
    cv.width = w; cv.height = h;
  }
  function modoLiviano(v) {
    lite = !!v;
    crear(lite ? 230 : 520);
    ajustar();
  }
  function dibujar(dt) {
    E.reloj += dt;
    E.warp *= Math.exp(-dt * 2.6);
    if (E.warp < 0.004) E.warp = 0;
    ctx.clearRect(0, 0, w, h);
    const base = 0.0016;
    const v = base + E.warp * 1.5;
    const cx = w / 2, cy = h / 2;
    const k = w / 1920 + 0.4;
    for (const e of estrellas) {
      if (e.orden > E.revelado) continue;
      const z0 = e.z;
      e.z -= v * dt;
      let sx = cx + (e.x * cx) / e.z, sy = cy + (e.y * cy) / e.z;
      if (e.z < 0.04 || Math.abs(sx - cx) > cx * 1.05 || Math.abs(sy - cy) > cy * 1.05) {
        e.z = 1; e.x = Math.random() * 2 - 1; e.y = Math.random() * 2 - 1;
        sx = cx + e.x * cx; sy = cy + e.y * cy;
      }
      const entra = acotar((E.revelado - e.orden) * 18);
      const tw = 0.65 + 0.35 * Math.sin(E.reloj * e.vel + e.fase);
      const r = ((1 - e.z) * 1.7 + 0.55) * k;
      ctx.globalAlpha = (0.35 + 0.65 * (1 - e.z)) * tw * entra;
      ctx.fillStyle = e.color;
      if (E.warp > 0.06) {
        const sx0 = cx + (e.x * cx) / (e.z + 0.06 * E.warp * 3), sy0 = cy + (e.y * cy) / (e.z + 0.06 * E.warp * 3);
        ctx.strokeStyle = e.color; ctx.lineWidth = r;
        ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx, sy); ctx.stroke();
      } else if (r < 1.3) {
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      } else {
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  window.addEventListener('resize', ajustar);
  modoLiviano(false);
  return {
    dibujar, modoLiviano, estado: E,
    pulso() { E.warp = 1; },
    get liviano() { return lite; },
  };
})();

/* ---------- 4. ILUSTRACIONES DE REFERENCIA ----------
   Cada imagen del guion tiene una ilustración dibujada con código.
   Se usa solo mientras falta el archivo real en imagenes/.        */
const Ilus = (() => {
  const W = 1200, H = 800;
  const svg = (cuerpo, defs = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${cuerpo}</svg>`;
  const rect = c => `<rect width="${W}" height="${H}" fill="${c}"/>`;
  const grad = (id, tipo, attrs, paradas) =>
    `<${tipo}Gradient id="${id}" ${attrs}>${paradas.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</${tipo}Gradient>`;
  const desenfoque = (id, d) => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${d}"/></filter>`;
  function campo(n, semilla, { rmax = 1.8, brillo = 1 } = {}) {
    const r = aleatorio(semilla); let s = '';
    for (let i = 0; i < n; i++) {
      const rad = 0.4 + Math.pow(r(), 4) * rmax;
      s += `<circle cx="${(r() * W) | 0}" cy="${(r() * H) | 0}" r="${rad.toFixed(2)}" fill="#fff" opacity="${(0.25 + r() * 0.7 * brillo).toFixed(2)}"/>`;
    }
    return s;
  }
  const D = {};

  /* Cielo y Vía Láctea */
  D.cielo = () => svg(
    `${rect('url(#ci-f)')}
     <g filter="url(#ci-b)">
       <ellipse cx="640" cy="350" rx="820" ry="130" transform="rotate(-24 640 350)" fill="#aebaff" opacity=".26"/>
       <ellipse cx="650" cy="345" rx="560" ry="56" transform="rotate(-24 650 345)" fill="#f4e7cf" opacity=".3"/>
     </g>
     ${campo(420, 11)}
     <path d="M0 800V700Q130 655 250 690T480 676Q610 646 730 686T990 672Q1110 656 1200 696V800Z" fill="#04050a"/>`,
    grad('ci-f', 'linear', 'x1="0" y1="0" x2="0" y2="1"', [[0, '#01020a'], [.72, '#0a1230'], [1, '#1b2a4f']]) + desenfoque('ci-b', 32));

  D.via = () => svg(
    `${rect('url(#vi-f)')}
     <g filter="url(#vi-b)">
       <ellipse cx="600" cy="400" rx="900" ry="190" transform="rotate(-62 600 400)" fill="#c4cdff" opacity=".3"/>
       <ellipse cx="600" cy="400" rx="760" ry="80" transform="rotate(-62 600 400)" fill="#fff0d6" opacity=".4"/>
       <ellipse cx="640" cy="360" rx="500" ry="30" transform="rotate(-62 640 360)" fill="#02030a" opacity=".5"/>
     </g>
     ${campo(700, 23, { rmax: 2 })}`,
    grad('vi-f', 'linear', 'x1="0" y1="0" x2="1" y2="1"', [[0, '#01020a'], [1, '#0c1431']]) + desenfoque('vi-b', 26));

  /* Galaxia con la posición del Sol */
  D.galaxia = () => {
    const r = aleatorio(5); let p = '';
    for (let brazo = 0; brazo < 4; brazo++) {
      for (let i = 0; i < 330; i++) {
        const t = 0.3 + r() * 5.9, rad = 30 * Math.exp(0.38 * t), ang = t + brazo * Math.PI / 2;
        const j = (r() - 0.5) * rad * 0.24, j2 = (r() - 0.5) * rad * 0.24;
        const x = 600 + Math.cos(ang) * rad + j, y = 400 + Math.sin(ang) * rad + j2;
        const c = rad < 120 ? '#ffd9a0' : rad < 220 ? '#e5e6ff' : '#9fb8ff';
        p += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + r() * 1.7).toFixed(1)}" fill="${c}" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
      }
    }
    return svg(
      `${rect('#02030a')}${campo(120, 9, { rmax: 1.2 })}
       <circle cx="600" cy="400" r="150" fill="url(#ga-n)"/>${p}
       <circle cx="600" cy="400" r="26" fill="#fff4dc" opacity=".9"/>
       <circle cx="654" cy="208" r="26" fill="none" stroke="#f0b45a" stroke-width="3"/>
       <circle cx="654" cy="208" r="8" fill="#f0b45a"/>
       <path d="M670 190 L735 130" stroke="#f0b45a" stroke-width="3"/>
       <text x="745" y="128" fill="#f0b45a" font-size="34" font-family="${FUENTE_SVG}">Sol</text>
       <text x="636" y="470" fill="#eef2ff" font-size="26" font-family="${FUENTE_SVG}" opacity=".8">Centro de la galaxia</text>`,
      grad('ga-n', 'radial', 'cx=".5" cy=".5" r=".5"', [[0, '#ffe3b0', .95], [.4, '#d9a35b', .45], [1, '#d9a35b', 0]]));
  };

  /* Agujeros negros: anillo tipo Event Horizon Telescope */
  const anillo = (id, inferiorBrillante) => svg(
    `${rect('#020204')}
     <g filter="url(#${id}-b)"><circle cx="600" cy="400" r="170" fill="none" stroke="url(#${id}-g)" stroke-width="${inferiorBrillante ? 64 : 80}"/></g>
     <circle cx="600" cy="400" r="120" fill="#000"/>`,
    grad(`${id}-g`, 'linear', 'x1="0" y1="0" x2="0" y2="1"',
      inferiorBrillante ? [[0, '#5a1e08'], [.55, '#d8691c'], [1, '#ffc46a']] : [[0, '#c4561a'], [.5, '#ff9a3c'], [1, '#d8691c']]) + desenfoque(`${id}-b`, 16));
  D.sgra = () => anillo('sg', false);
  D.m87 = () => anillo('m8', true);

  D.sim = () => svg(
    `${rect('#010103')}${campo(140, 31, { rmax: 1.1 })}
     <g filter="url(#si-b)"><ellipse cx="600" cy="400" rx="520" ry="46" fill="url(#si-d)"/></g>
     <circle cx="600" cy="400" r="128" fill="#000"/>
     <g filter="url(#si-c)"><path d="M462 400A138 138 0 0 1 738 400" fill="none" stroke="#ffd9a0" stroke-width="22"/>
        <path d="M480 424A122 122 0 0 0 720 424" fill="none" stroke="#ff9a3c" stroke-width="12" opacity=".8"/></g>
     <g clip-path="url(#si-m)"><g filter="url(#si-b)"><ellipse cx="600" cy="412" rx="520" ry="42" fill="url(#si-d)"/></g></g>`,
    grad('si-d', 'radial', 'cx=".5" cy=".5" r=".5"', [[0, '#fff2d0'], [.5, '#ff9a3c', .85], [1, '#ff6a1f', 0]]) +
    desenfoque('si-b', 9) + desenfoque('si-c', 4) + '<clipPath id="si-m"><rect x="0" y="400" width="1200" height="400"/></clipPath>');

  /* Luna */
  D.luna = () => svg(
    `${rect('#02030a')}${campo(160, 3, { rmax: 1.2 })}
     <circle cx="600" cy="400" r="330" fill="url(#lu-g)"/>
     <g clip-path="url(#lu-c)" fill="#6f6d68">
       <ellipse cx="505" cy="275" rx="120" ry="88" opacity=".5"/><ellipse cx="650" cy="300" rx="70" ry="58" opacity=".5"/>
       <ellipse cx="715" cy="405" rx="105" ry="76" opacity=".45"/><ellipse cx="410" cy="425" rx="86" ry="150" opacity=".42"/>
       <ellipse cx="585" cy="475" rx="82" ry="50" opacity=".4"/><ellipse cx="805" cy="330" rx="38" ry="48" opacity=".5"/>
       <circle cx="560" cy="655" r="36" fill="#f1eee4" opacity=".7"/><circle cx="470" cy="560" r="24" fill="#e6e2d6" opacity=".6"/>
       <circle cx="700" cy="560" r="20" fill="#e6e2d6" opacity=".6"/><circle cx="600" cy="205" r="18" fill="#e6e2d6" opacity=".5"/>
     </g>`,
    grad('lu-g', 'radial', 'cx=".38" cy=".35" r=".78"', [[0, '#f8f5ea'], [.7, '#d8d4c5'], [1, '#9e9a8c']]) +
    '<clipPath id="lu-c"><circle cx="600" cy="400" r="330"/></clipPath>');

  const rutaFase = (cx, cy, R, a) => {
    const s = (a < Math.PI ? 1 : -1) * (CONFIG.hemisferioSur ? -1 : 1), c = Math.cos(a);
    const rx = Math.max(Math.abs(R * c), 0.01), d = s * c;
    return `M${cx} ${cy - R}A${R} ${R} 0 0 ${s > 0 ? 1 : 0} ${cx} ${cy + R}A${rx.toFixed(2)} ${R} 0 0 ${d > 0 ? 0 : 1} ${cx} ${cy - R}Z`;
  };
  D.fases = () => {
    const nombres = ['Luna nueva', 'Creciente', 'Cuarto creciente', 'Gibosa creciente', 'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Menguante'];
    let s = rect('#03040b') + campo(90, 4, { rmax: 1 });
    nombres.forEach((n, i) => {
      const cx = 105 + i * 141.4, a = i * Math.PI / 4;
      s += `<circle cx="${cx}" cy="360" r="58" fill="#161a2b" stroke="#2a3050" stroke-width="2"/>`;
      if (i > 0) s += `<path d="${rutaFase(cx, 360, 58, a)}" fill="#ece8da"/>`;
      const palabras = n.split(' ');
      s += `<text x="${cx}" y="470" fill="#eceff9" font-size="21" text-anchor="middle" font-family="${FUENTE_SVG}">` +
        palabras.map((pal, k) => `<tspan x="${cx}" dy="${k ? 26 : 0}">${pal}</tspan>`).join('') + '</text>';
    });
    return svg(s);
  };

  D.crateres = () => {
    const r = aleatorio(7); let s = rect('url(#cr-f)');
    for (let i = 0; i < 380; i++) s += `<circle cx="${(r() * W) | 0}" cy="${(r() * H) | 0}" r="${(1 + r() * 3).toFixed(1)}" fill="#5f5c57" opacity=".35"/>`;
    for (let i = 0; i < 40; i++) {
      const rad = 14 + Math.pow(r(), 2.2) * 130, x = (r() * W) | 0, y = (r() * H) | 0;
      s += `<circle cx="${x}" cy="${y}" r="${rad | 0}" fill="url(#cr-g)" stroke="#d9d6cc" stroke-opacity=".5" stroke-width="${Math.max(1.5, rad / 22).toFixed(1)}"/>` +
           `<ellipse cx="${(x + rad * .18) | 0}" cy="${(y + rad * .2) | 0}" rx="${(rad * .62) | 0}" ry="${(rad * .55) | 0}" fill="#45433f" opacity=".3"/>`;
    }
    return svg(s,
      grad('cr-f', 'linear', 'x1="0" y1="0" x2="1" y2="1"', [[0, '#99968d'], [1, '#6a6761']]) +
      grad('cr-g', 'radial', 'cx=".5" cy=".5" r=".5"', [[0, '#4e4c48'], [.8, '#76736d'], [1, '#9c998f']]));
  };

  /* Constelaciones (estrellas reales, sin líneas) */
  const constelacion = (id) => {
    const c = CONS.find(k => k.id === id), m = proyectar(c, W, H, 0.74, 0.5);
    let s = rect('url(#co-f)') + campo(220, 40 + id.length, { rmax: 1.3 });
    if (c.extras && c.extras.nebulosa) { const n = m.ex.nebulosa; s += `<circle cx="${n.x.toFixed(0)}" cy="${n.y.toFixed(0)}" r="60" fill="url(#co-n)"/>`; }
    c.estrellas.forEach((e, i) => {
      const p = m.est[i], rad = Math.max(2.2, 7.5 - e[3] * 1.5) * 1.5, col = (c.colores && c.colores[i]) || '#f4f6ff';
      s += `<circle cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="${(rad * 2.6).toFixed(1)}" fill="${col}" opacity=".18"/><circle cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="${rad.toFixed(1)}" fill="${col}"/>`;
    });
    return svg(s, grad('co-f', 'radial', 'cx=".5" cy=".5" r=".75"', [[0, '#0b1330'], [1, '#01020a']]) +
      grad('co-n', 'radial', 'cx=".5" cy=".5" r=".5"', [[0, '#ffb8d6', .75], [1, '#ffb8d6', 0]]));
  };
  ['orion', 'escorpio', 'sagitario', 'cruz', 'centauro'].forEach(id => { D['c-' + id] = () => constelacion(id); });

  /* Venus */
  D['venus-cielo'] = () => svg(
    `${rect('url(#vc-f)')}${campo(60, 8, { rmax: 1 })}
     <circle cx="760" cy="430" r="90" fill="url(#vc-g)"/><circle cx="760" cy="430" r="10" fill="#fffbe8"/>
     <path d="M0 800V660Q140 610 280 650T560 640Q700 610 840 650T1100 640Q1160 630 1200 650V800Z" fill="#05060b"/>`,
    grad('vc-f', 'linear', 'x1="0" y1="0" x2="0" y2="1"', [[0, '#0a0f2c'], [.5, '#3a2a5c'], [.8, '#c2566a'], [1, '#f7b26b']]) +
    grad('vc-g', 'radial', 'cx=".5" cy=".5" r=".5"', [[0, '#fff', .9], [1, '#fff', 0]]));

  D['venus-sonda'] = () => {
    let s = rect('#02030a') + campo(80, 12, { rmax: 1 }) + '<circle cx="600" cy="400" r="320" fill="url(#vs-g)"/><g clip-path="url(#vs-c)" fill="none" stroke-linecap="round">';
    for (let i = 0; i < 14; i++) {
      const y = 130 + i * 40;
      s += `<path d="M260 ${y}Q430 ${y - 50 + (i % 3) * 30} 600 ${y + 8}T940 ${y - 10}" stroke="${i % 2 ? '#fff8dc' : '#b58a3e'}" stroke-width="${10 + (i % 4) * 4}" opacity=".3"/>`;
    }
    return svg(s + '</g><circle cx="600" cy="400" r="320" fill="url(#vs-s)"/>',
      grad('vs-g', 'radial', 'cx=".4" cy=".38" r=".75"', [[0, '#fff3c4'], [.6, '#e5c16a'], [1, '#a9803a']]) +
      grad('vs-s', 'radial', 'cx=".35" cy=".35" r=".8"', [[.55, '#000', 0], [1, '#000', .6]]) +
      '<clipPath id="vs-c"><circle cx="600" cy="400" r="320"/></clipPath>');
  };

  D['venus-venera'] = () => {
    const r = aleatorio(17); let s = rect('url(#vv-f)') + '<path d="M0 360Q300 300 600 330T1200 350V800H0Z" fill="url(#vv-t)"/>';
    for (let i = 0; i < 46; i++) {
      const x = r() * W, y = 380 + r() * 400, w = 40 + r() * 150, k = y / 800;
      s += `<path d="M${x | 0} ${y | 0}l${(w * k) | 0} ${(-8 * k) | 0}l${(w * .6 * k) | 0} ${(26 * k) | 0}l${(-w * k) | 0} ${(10 * k) | 0}z" fill="#6d4223" stroke="#a8713e" stroke-width="2" opacity=".85"/>`;
    }
    s += '<path d="M380 800Q600 560 820 800Z" fill="#8a8d92" stroke="#c9ccd1" stroke-width="5"/><path d="M450 800Q600 640 750 800" fill="none" stroke="#5c5f65" stroke-width="6"/>';
    return svg(s, grad('vv-f', 'linear', 'x1="0" y1="0" x2="0" y2="1"', [[0, '#d9863f'], [1, '#a2602b']]) +
      grad('vv-t', 'linear', 'x1="0" y1="0" x2="0" y2="1"', [[0, '#8b5428'], [1, '#4a2c15']]));
  };

  /* Voyager */
  D['voyager-sonda'] = () => svg(
    `${rect('#02030a')}${campo(110, 21, { rmax: 1.1 })}
     <path d="M560 500L260 640" stroke="#9aa0ad" stroke-width="10"/>
     <g fill="#cfd3dc" stroke="#6c7280" stroke-width="3"><rect x="250" y="630" width="64" height="26" rx="8" transform="rotate(-20 282 643)"/><rect x="330" y="600" width="64" height="26" rx="8" transform="rotate(-20 362 613)"/><rect x="410" y="570" width="64" height="26" rx="8" transform="rotate(-20 442 583)"/></g>
     <path d="M640 480L930 610" stroke="#9aa0ad" stroke-width="10"/><rect x="900" y="590" width="90" height="80" fill="#2a2f3c" stroke="#8c93a3" stroke-width="4"/>
     <path d="M660 440L1080 150" stroke="#9aa0ad" stroke-width="5"/><rect x="1060" y="125" width="44" height="34" fill="#2a2f3c" stroke="#8c93a3" stroke-width="3"/>
     <polygon points="520,420 600,400 680,420 700,500 640,560 560,560 500,500" fill="#8c93a3" stroke="#d5d9e3" stroke-width="4"/>
     <circle cx="650" cy="470" r="26" fill="#f0b45a" stroke="#ffe1a8" stroke-width="3"/>
     <ellipse cx="470" cy="320" rx="210" ry="200" fill="url(#vo-d)" stroke="#f0f1f5" stroke-width="8"/>
     <g stroke="#9aa0ad" stroke-width="5"><path d="M470 320L470 120"/><path d="M470 320L300 430"/><path d="M470 320L640 430"/></g>
     <circle cx="470" cy="320" r="14" fill="#2a2f3c"/>`,
    grad('vo-d', 'radial', 'cx=".42" cy=".4" r=".7"', [[0, '#fbfbf7'], [1, '#aeb2bd']]));

  D['voyager-mapa'] = () => {
    const sol = [330, 400], radios = [70, 150, 225, 300, 370], nombres = ['Tierra', 'Júpiter', 'Saturno', 'Urano', 'Neptuno'];
    const P = (r, g) => [sol[0] + r * Math.cos(g * Math.PI / 180), sol[1] - r * Math.sin(g * Math.PI / 180)];
    const curva = pts => pts.reduce((d, p, i, a) => {
      if (i === 0) return `M${p[0].toFixed(0)} ${p[1].toFixed(0)}`;
      const q = a[i - 1], m = [(q[0] + p[0]) / 2, (q[1] + p[1]) / 2];
      return d + `Q${q[0].toFixed(0)} ${q[1].toFixed(0)} ${m[0].toFixed(0)} ${m[1].toFixed(0)}` + (i === a.length - 1 ? `L${p[0].toFixed(0)} ${p[1].toFixed(0)}` : '');
    }, '');
    const v2 = [P(70, 20), P(150, 8), P(225, -8), P(300, -28), P(370, -48), [760, 640], [1120, 740]];
    const v1 = [P(70, 25), P(150, 32), P(225, 44), [640, 170], [900, 90], [1130, 40]];
    let s = rect('#02030a') + campo(80, 6, { rmax: 1 });
    radios.forEach((r, i) => { s += `<circle cx="${sol[0]}" cy="${sol[1]}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="2"/>`; const p = P(r, 100 + i * 12); s += `<text x="${p[0].toFixed(0)}" y="${p[1].toFixed(0)}" fill="#9aa3c0" font-size="20" font-family="${FUENTE_SVG}" text-anchor="middle">${nombres[i]}</text>`; });
    s += `<circle cx="${sol[0]}" cy="${sol[1]}" r="16" fill="#ffd27a"/>`;
    s += `<path d="${curva(v2)}" fill="none" stroke="#f0b45a" stroke-width="5"/><path d="${curva(v1)}" fill="none" stroke="#9ed4f2" stroke-width="5"/>`;
    s += `<text x="900" y="700" fill="#f0b45a" font-size="30" font-family="${FUENTE_SVG}">Voyager 2</text><text x="800" y="110" fill="#9ed4f2" font-size="30" font-family="${FUENTE_SVG}">Voyager 1</text>`;
    s += `<text x="40" y="760" fill="#9aa3c0" font-size="22" font-family="${FUENTE_SVG}">Esquema sin escala</text>`;
    return svg(s);
  };

  D.pale = () => svg(
    `${rect('#0a0807')}
     <g filter="url(#pa-b)" opacity=".8"><polygon points="560,0 700,0 520,800 380,800" fill="#6b4a30" opacity=".5"/><polygon points="760,0 830,0 760,800 690,800" fill="#8a6a4a" opacity=".4"/></g>
     <circle cx="640" cy="360" r="14" fill="url(#pa-g)"/><circle cx="640" cy="360" r="3.2" fill="#a9d4ff"/>`,
    desenfoque('pa-b', 18) + grad('pa-g', 'radial', 'cx=".5" cy=".5" r=".5"', [[0, '#9ccfff', .8], [1, '#9ccfff', 0]]));

  /* Disco de oro */
  D.disco = () => {
    let s = rect('#03040b') + campo(70, 14, { rmax: 1 }) + '<circle cx="600" cy="400" r="330" fill="url(#di-g)"/>';
    for (let r = 60; r < 320; r += 7) s += `<circle cx="600" cy="400" r="${r}" fill="none" stroke="#7a5a1c" stroke-opacity=".35" stroke-width="1.5"/>`;
    s += '<circle cx="600" cy="400" r="56" fill="#c9a24a" stroke="#7a5a1c" stroke-width="3"/><circle cx="600" cy="400" r="10" fill="#03040b"/><circle cx="600" cy="400" r="330" fill="url(#di-s)"/>';
    return svg(s, grad('di-g', 'radial', 'cx=".4" cy=".35" r=".8"', [[0, '#ffe39a'], [.6, '#e0b24a'], [1, '#a77c25']]) +
      grad('di-s', 'linear', 'x1="0" y1="0" x2="1" y2="1"', [[0, '#fff', .3], [.45, '#fff', 0], [1, '#000', .25]]));
  };

  D.cubierta = () => {
    let s = rect('#03040b') + '<circle cx="600" cy="400" r="340" fill="url(#cu-g)"/><g stroke="#4a4f5c" stroke-width="3" fill="none">';
    for (let i = 0; i < 14; i++) { const a = i * 0.42; s += `<line x1="400" y1="470" x2="${(400 + 130 * Math.cos(a - 1.6)).toFixed(0)}" y2="${(470 + 130 * Math.sin(a - 1.6)).toFixed(0)}"/>`; }
    s += '<circle cx="760" cy="300" r="48"/><circle cx="880" cy="300" r="48"/><line x1="808" y1="300" x2="832" y2="300"/><circle cx="600" cy="610" r="54"/><circle cx="600" cy="610" r="22"/>' +
         '<path d="M440 190H520V230H560V190H640"/><path d="M700 520Q740 470 780 520T860 520"/><circle cx="600" cy="400" r="300" stroke-dasharray="4 10"/></g>';
    return svg(s, grad('cu-g', 'radial', 'cx=".4" cy=".35" r=".8"', [[0, '#e6e8ee'], [.7, '#b5b9c4'], [1, '#868a96']]));
  };

  D.exo = () => svg(
    `${rect('#02030a')}${campo(160, 19, { rmax: 1.2 })}
     <circle cx="150" cy="400" r="260" fill="url(#ex-s)"/><circle cx="150" cy="400" r="70" fill="#ffd9a0"/>
     <circle cx="470" cy="330" r="48" fill="url(#ex-a)"/>
     <circle cx="680" cy="470" r="86" fill="url(#ex-b)"/><path d="M560 480Q680 520 800 440" stroke="#d9c7a0" stroke-width="5" fill="none" opacity=".7"/>
     <circle cx="930" cy="300" r="64" fill="url(#ex-c)"/>
     <circle cx="1060" cy="540" r="32" fill="url(#ex-d)"/>`,
    grad('ex-s', 'radial', 'cx=".5" cy=".5" r=".5"', [[0, '#ffb35a', .85], [1, '#ffb35a', 0]]) +
    grad('ex-a', 'radial', 'cx=".35" cy=".35" r=".8"', [[0, '#ffd9b0'], [1, '#8a5a3a']]) +
    grad('ex-b', 'radial', 'cx=".35" cy=".35" r=".8"', [[0, '#f4e2b8'], [1, '#8e7248']]) +
    grad('ex-c', 'radial', 'cx=".35" cy=".35" r=".8"', [[0, '#a9d9ff'], [.55, '#3f86d9'], [1, '#12306a']]) +
    grad('ex-d', 'radial', 'cx=".35" cy=".35" r=".8"', [[0, '#d7d7e8'], [1, '#55556e']]));

  const nombresRef = {
    cielo: 'cielo', via: 'via', galaxia: 'galaxia', sgra: 'sgra', m87: 'm87', sim: 'sim', luna: 'luna', fases: 'fases',
    crateres: 'crateres', pale: 'pale', disco: 'disco', cubierta: 'cubierta', exo: 'exo',
  };
  return {
    obtener(clave) {
      const f = D[clave] || D[nombresRef[clave]];
      return f ? f() : svg(rect('#0a0f24'));
    },
    rutaFase,
  };
})();

/* ---------- 5. CONSTELACIONES ----------
   Posiciones aproximadas de las estrellas principales:
   [nombre, ascensión recta (horas), declinación (grados), magnitud].
   Las líneas son un esquema simplificado para orientarse.
   Los tiempos ini/fin son segundos dentro de la escena 3.        */
const CONS = [
  {
    id: 'orion', ini: 26, fin: 41, ocupa: 0.82, anclaY: 0.5,
    estrellas: [['Betelgeuse', 5.919, 7.41, 0.5], ['Rigel', 5.242, -8.20, 0.13], ['Bellatrix', 5.419, 6.35, 1.64],
      ['Saiph', 5.796, -9.67, 2.07], ['Alnitak', 5.679, -1.94, 1.77], ['Alnilam', 5.603, -1.20, 1.69],
      ['Mintaka', 5.533, -0.30, 2.2], ['Meissa', 5.585, 9.93, 3.4], ['Hatysa', 5.590, -5.91, 2.75]],
    lineas: [[0, 7], [7, 2], [0, 4], [2, 6], [4, 5], [5, 6], [4, 3], [6, 1], [5, 8]],
    colores: { 0: '#ff9d70', 1: '#b4d0ff' }, rotulos: { 0: 'Betelgeuse', 1: 'Rigel' },
    extras: { nebulosa: { ra: 5.588, dec: -5.39 } },
    anot: [{ t: 'resalto', idx: [4, 5, 6], texto: 'Cinturón', color: '#f0b45a' }, { t: 'brillo', extra: 'nebulosa', texto: 'Nebulosa de Orión' }],
  },
  {
    id: 'escorpio', ini: 41, fin: 52, ocupa: 0.86, anclaY: 0.5,
    estrellas: [['Antares', 16.490, -26.43, 0.96], ['Acrab', 16.090, -19.81, 2.6], ['Dschubba', 16.005, -22.62, 2.3],
      ['π Sco', 15.981, -26.11, 2.9], ['ρ Sco', 15.949, -29.21, 3.9], ['σ Sco', 16.353, -25.59, 2.9], ['τ Sco', 16.598, -28.22, 2.8],
      ['ε Sco', 16.837, -34.29, 2.3], ['μ Sco', 16.865, -38.05, 3.0], ['ζ Sco', 16.910, -42.36, 3.6], ['η Sco', 17.203, -43.24, 3.3],
      ['Sargas', 17.622, -42.99, 1.87], ['ι Sco', 17.793, -40.13, 3.0], ['κ Sco', 17.708, -39.03, 2.4], ['Shaula', 17.560, -37.10, 1.6],
      ['Lesath', 17.513, -37.30, 2.7]],
    lineas: [[1, 2], [2, 3], [3, 4], [2, 5], [5, 0], [0, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15]],
    colores: { 0: '#ff6a4a' }, rotulos: { 0: 'Antares' },
    anot: [{ t: 'anillo', idx: 0, texto: 'Antares, gigante roja', color: '#ff6a4a' }],
  },
  {
    id: 'sagitario', ini: 52, fin: 63, ocupa: 0.84, anclaY: 0.5,
    estrellas: [['Kaus Australis', 18.403, -34.38, 1.85], ['Kaus Media', 18.350, -29.83, 2.7], ['Kaus Borealis', 18.466, -25.42, 2.8],
      ['Nunki', 18.921, -26.30, 2.05], ['Ascella', 19.043, -29.88, 2.6], ['τ Sgr', 19.115, -27.67, 3.3], ['φ Sgr', 18.761, -26.99, 3.2],
      ['Alnasl', 18.097, -30.42, 3.0]],
    lineas: [[7, 1], [1, 2], [2, 6], [6, 3], [3, 5], [5, 4], [4, 0], [0, 1], [6, 4]],
    extras: { centro: { ra: 17.761, dec: -29.0 } }, fitExtras: ['centro'],
    anot: [{ t: 'cruz', extra: 'centro', texto: 'Dirección del centro galáctico' }],
  },
  {
    id: 'cruz', ini: 63, fin: 83, ocupa: 0.36, anclaY: 0.27, fit: [0, 1, 2, 3],
    estrellas: [['Acrux', 12.443, -63.10, 0.77], ['Mimosa', 12.795, -59.69, 1.25], ['Gacrux', 12.519, -57.11, 1.64], ['Imai', 12.252, -58.75, 2.8]],
    lineas: [[2, 0], [3, 1]], rotulos: { 0: 'Acrux', 2: 'Gacrux' },
    anot: [{ t: 'polo' }],
  },
  {
    id: 'centauro', ini: 83, fin: 100, ocupa: 0.76, anclaY: 0.45,
    estrellas: [['Alpha Centauri', 14.660, -60.83, 0.0], ['Hadar', 14.064, -60.37, 0.6], ['Menkent', 14.111, -36.37, 2.06],
      ['ε Cen', 13.665, -53.47, 2.3], ['ζ Cen', 13.926, -47.29, 2.55], ['γ Cen', 12.692, -48.96, 2.2], ['δ Cen', 12.140, -50.72, 2.6],
      ['η Cen', 14.592, -42.16, 2.3], ['ι Cen', 13.343, -36.71, 2.75]],
    lineas: [[6, 5], [5, 4], [4, 3], [3, 1], [1, 0], [4, 7], [7, 2], [2, 8]],
    colores: { 0: '#ffe9b8' }, rotulos: { 1: 'Hadar' },
    anot: [{ t: 'anillo', idx: 0, texto: 'Alpha Centauri, el sistema estelar más cercano al nuestro', color: '#9ed4f2' }],
  },
];

/* Proyección sobre un plano (norte arriba, este a la izquierda) ajustada al lienzo. */
function proyectar(c, ancho, alto, ocupa = c.ocupa, anclaY = c.anclaY) {
  const idx = c.fit || c.estrellas.map((_, i) => i);
  const ra0 = idx.reduce((s, i) => s + c.estrellas[i][1], 0) / idx.length;
  const dec0 = idx.reduce((s, i) => s + c.estrellas[i][2], 0) / idx.length;
  const d0 = dec0 * Math.PI / 180;
  const proj = (ra, dec) => {
    const l = (ra - ra0) * 15 * Math.PI / 180, d = dec * Math.PI / 180;
    const k = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(l);
    return { x: -Math.cos(d) * Math.sin(l) / k, y: -(Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(l)) / k };
  };
  const P = c.estrellas.map(e => proj(e[1], e[2]));
  const X = {};
  for (const k in (c.extras || {})) X[k] = proj(c.extras[k].ra, c.extras[k].dec);
  const caja = idx.map(i => P[i]).concat((c.fitExtras || []).map(k => X[k]));
  const xs = caja.map(p => p.x), ys = caja.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const esc = Math.min(ancho * ocupa / ((x1 - x0) || 1), alto * ocupa / ((y1 - y0) || 1));
  const ox = ancho / 2 - (x0 + x1) / 2 * esc, oy = alto * anclaY - (y0 + y1) / 2 * esc;
  const mp = p => ({ x: p.x * esc + ox, y: p.y * esc + oy });
  const ex = {};
  for (const k in X) ex[k] = mp(X[k]);
  return { est: P.map(mp), ex, esc };
}

/* ---------- 6. ANIMACIONES EN CANVAS ---------- */
const LI = {};   // lienzos, se llenan al iniciar
function lienzo(id) {
  const cv = document.getElementById(id);
  return cv ? { cv, ctx: cv.getContext('2d'), w: cv.width, h: cv.height } : null;
}
function etiqueta(ctx, texto, x, y, w, color = '#eceff9', tam = 30, alfa = 1, lado = null) {
  ctx.save();
  ctx.font = `600 ${tam}px ${FUENTE_SANS}`;
  ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const ancho = ctx.measureText(texto).width;
  const izq = lado ? lado === 'izq' : x > w * 0.55;
  const tx = acotar(izq ? x - 24 - ancho : x + 24, 12, w - ancho - 12);
  ctx.globalAlpha = alfa;
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(2,3,10,.9)'; ctx.strokeText(texto, tx, y);
  ctx.fillStyle = color; ctx.fillText(texto, tx, y);
  ctx.restore();
}

const texturas = {};
function texturaLuna() {
  if (texturas.luna) return texturas.luna;
  const R = 256, c = document.createElement('canvas');
  c.width = c.height = R * 2;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(R * 0.8, R * 0.7, R * 0.1, R, R, R);
  gr.addColorStop(0, '#f8f5ea'); gr.addColorStop(0.7, '#d8d4c5'); gr.addColorStop(1, '#a09c8e');
  g.fillStyle = gr; g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(92,90,86,.42)';
  [[-.25, -.35, .28, .2], [.05, -.3, .14, .12], [.35, -.05, .22, .16], [-.45, .05, .16, .3], [-.05, .2, .18, .1], [.62, -.28, .08, .1]]
    .forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(R + x * R, R + y * R, rx * R, ry * R, 0, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = 'rgba(245,243,235,.85)'; g.beginPath(); g.arc(R - 0.1 * R, R + 0.62 * R, 0.07 * R, 0, Math.PI * 2); g.fill();
  return (texturas.luna = c);
}

/* Fases de la Luna */
const NOMBRES_FASES = ['Luna nueva', 'Creciente', 'Cuarto creciente', 'Gibosa creciente', 'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Menguante'];
function trazarIluminada(ctx, cx, cy, R, a) {
  const s = (a < Math.PI ? 1 : -1) * (CONFIG.hemisferioSur ? -1 : 1), c = Math.cos(a);
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2, s < 0);
  ctx.ellipse(cx, cy, Math.max(Math.abs(R * c), 0.001), R, 0, Math.PI / 2, -Math.PI / 2, s * c > 0);
  ctx.closePath();
}
function discoLunar(ctx, cx, cy, R, a) {
  ctx.fillStyle = '#141829'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.save(); trazarIluminada(ctx, cx, cy, R, a); ctx.clip();
  ctx.drawImage(texturaLuna(), cx - R, cy - R, R * 2, R * 2);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
}
function planetaTierra(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#8fc4ff'); g.addColorStop(0.6, '#2f6fd0'); g.addColorStop(1, '#10285c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fillStyle = 'rgba(2,3,10,.55)'; ctx.fill(); ctx.restore();
}

function dibujarFases(ts) {
  const o = LI.fases; if (!o || ts < 27.5 || ts > 51) return;
  const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
  const entrada = suave(progreso(ts, 28.5, 31));
  const a = progreso(ts, 37.5, 50) * Math.PI * 2;
  const ex = 500, ey = 285, Ro = 215;
  ctx.globalAlpha = entrada;
  // luz del Sol
  ctx.strokeStyle = 'rgba(240,180,90,.2)'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(240,180,90,.85)';
  for (let i = -3; i <= 3; i++) {
    const y = ey + i * 62;
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(990, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(130, y - 9); ctx.lineTo(130, y + 9); ctx.closePath(); ctx.fill();
  }
  ctx.font = `600 30px ${FUENTE_SANS}`; ctx.fillStyle = '#f0b45a'; ctx.textAlign = 'left'; ctx.fillText('Luz del Sol', 40, 46);
  // órbita, Tierra y Luna
  ctx.setLineDash([7, 12]); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ex, ey, Ro, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  planetaTierra(ctx, ex, ey, 44);
  const mx = ex - Ro * Math.cos(a), my = ey + Ro * Math.sin(a);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(mx, my); ctx.stroke();
  ctx.fillStyle = '#141829'; ctx.beginPath(); ctx.arc(mx, my, 32, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(mx, my, 32, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); ctx.clip();
  ctx.drawImage(texturaLuna(), mx - 32, my - 32, 64, 64); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(mx, my, 32, 0, Math.PI * 2); ctx.stroke();
  // vista desde la Tierra
  const cx = 1290, cy = 270, R = 185;
  ctx.font = `500 28px ${FUENTE_SANS}`; ctx.fillStyle = 'rgba(236,239,249,.7)'; ctx.textAlign = 'center';
  ctx.fillText('Así se ve desde la Tierra', cx, 44);
  discoLunar(ctx, cx, cy, R, a);
  const idx = Math.floor(a / (Math.PI / 4) + 0.5) % 8;
  ctx.font = `400 54px ${FUENTE_SERIF}`; ctx.fillStyle = '#eceff9'; ctx.fillText(NOMBRES_FASES[idx], cx, 520);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i === idx ? '#f0b45a' : 'rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.arc(cx + (i - 3.5) * 58, 580, 9, 0, Math.PI * 2); ctx.fill();
  }
  const ciclo = suave(progreso(ts, 46, 48));
  if (ciclo > 0) {
    ctx.globalAlpha = entrada * ciclo; ctx.font = `500 34px ${FUENTE_SANS}`; ctx.fillStyle = '#9ed4f2';
    ctx.fillText('Ciclo completo: unos 29,5 días', ex, 590);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}

/* Misma cara de la Luna */
function dibujarCara(ts) {
  const o = LI.cara; if (!o || ts < 57 || ts > 85) return;
  const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
  const ex = 462, ey = 380, Ro = 250, R = 62;
  ctx.globalAlpha = suave(progreso(ts, 58, 60.5));
  const th = (ts - 58) * 0.5;
  ctx.setLineDash([8, 12]); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ex, ey, Ro, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  planetaTierra(ctx, ex, ey, 50);
  ctx.font = `500 26px ${FUENTE_SANS}`; ctx.fillStyle = 'rgba(236,239,249,.75)'; ctx.textAlign = 'center';
  ctx.fillText('Tierra', ex, ey + 88);
  const mx = ex + Ro * Math.cos(th), my = ey + Ro * Math.sin(th), fi = th + Math.PI;
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(mx, my); ctx.stroke();
  ctx.fillStyle = '#3d4052'; ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dcd8ca'; ctx.beginPath(); ctx.arc(mx, my, R, fi - Math.PI / 2, fi + Math.PI / 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f0b45a'; ctx.beginPath(); ctx.arc(mx + Math.cos(fi) * (R - 16), my + Math.sin(fi) * (R - 16), 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI * 2); ctx.stroke();
  // leyenda
  ctx.textAlign = 'left'; ctx.font = `400 26px ${FUENTE_SANS}`;
  ctx.fillStyle = '#dcd8ca'; ctx.fillRect(10, 22, 22, 22); ctx.fillStyle = '#eceff9'; ctx.fillText('Lado que vemos', 44, 34);
  ctx.fillStyle = '#3d4052'; ctx.fillRect(10, 60, 22, 22); ctx.fillStyle = '#eceff9'; ctx.fillText('Lado que no vemos', 44, 72);
  const f = suave(progreso(ts, 70, 72.5));
  ctx.globalAlpha *= f; ctx.textAlign = 'center'; ctx.font = `500 30px ${FUENTE_SANS}`; ctx.fillStyle = '#9ed4f2';
  ctx.fillText('Un giro sobre sí misma ≈ una vuelta a la Tierra', w / 2, h - 24);
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}

/* Demostración de la escena 3: estrellas que parecen un dibujo pero están a distinta distancia */
const DEMO = [[-270, -60, 0], [-170, 90, 160], [-60, -90, -120], [40, 70, 200], [140, -80, -60], [230, 60, 120], [300, -40, -200]];
function dibujarDemo(ts) {
  const o = LI.demo; if (!o || ts > 27) return;
  const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
  const entrada = suave(progreso(ts, 1, 3));
  const beta = suave(progreso(ts, 12, 20)) * (75 * Math.PI / 180);
  const cb = Math.cos(beta), sb = Math.sin(beta), cx = w / 2 + 30, cy = h / 2, k = 0.95;
  const P = DEMO.map(([x, y, z]) => [cx + (x * cb + z * sb) * k, cy + y * k, -x * sb + z * cb]);
  const tierra = [cx + (-420 * sb) * k, cy];
  ctx.globalAlpha = entrada;
  if (sb > 0.25) {
    ctx.strokeStyle = `rgba(158,212,242,${(0.28 * sb).toFixed(2)})`; ctx.lineWidth = 1.5;
    P.forEach(p => { ctx.beginPath(); ctx.moveTo(tierra[0], tierra[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); });
    planetaTierra(ctx, tierra[0], tierra[1], 18 * Math.min(1, sb * 1.4));
  }
  const n = DEMO.length - 1, avance = progreso(ts, 2, 9) * n;
  ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(158,212,242,.85)';
  for (let i = 0; i < n; i++) {
    const f = acotar(avance - i); if (f <= 0) break;
    const a = P[i], b = P[i + 1];
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); ctx.stroke();
  }
  P.forEach(p => {
    const r = acotar(8 - p[2] / 60, 3.5, 12);
    ctx.fillStyle = 'rgba(236,239,249,.22)'; ctx.beginPath(); ctx.arc(p[0], p[1], r * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f6ff'; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.textAlign = 'center'; ctx.font = `500 30px ${FUENTE_SANS}`; ctx.fillStyle = '#eceff9';
  ctx.globalAlpha = entrada * acotar(sb < 0.5 ? 1 - sb * 2 : (sb - 0.5) * 2);
  ctx.fillText(sb < 0.5 ? 'Vistas desde la Tierra' : 'Vistas desde otro lugar', w / 2, 44);
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}

/* Mapa animado de cada constelación */
function dibujarMapa(ts) {
  const o = LI.mapa; if (!o) return;
  const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
  const c = CONS.find(k => ts >= k.ini && ts < k.fin); if (!c) return;
  if (!c.geo) c.geo = proyectar(c, w, h);
  const m = c.geo, lt = ts - c.ini, dur = c.fin - c.ini;
  const entrada = acotar(lt / 1.2);
  ctx.globalAlpha = 1 - progreso(lt, dur - 0.8, dur);
  // líneas
  const n = c.lineas.length, avance = progreso(lt, 1.2, Math.min(7, dur - 4)) * n;
  ctx.lineCap = 'round';
  c.lineas.forEach(([i, j], k) => {
    const f = acotar(avance - k); if (f <= 0) return;
    const A = m.est[i], B = m.est[j], X = A.x + (B.x - A.x) * f, Y = A.y + (B.y - A.y) * f;
    ctx.strokeStyle = 'rgba(158,212,242,.16)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(X, Y); ctx.stroke();
    ctx.strokeStyle = 'rgba(158,212,242,.9)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(X, Y); ctx.stroke();
  });
  const aA = suave(progreso(lt, 8, 9.4));
  // estrellas
  c.estrellas.forEach((e, i) => {
    const P = m.est[i], r = Math.max(2.4, 7.5 - e[3] * 1.5) * 1.5 * (0.5 + 0.5 * entrada), col = (c.colores && c.colores[i]) || '#f4f6ff';
    const base = ctx.globalAlpha;
    ctx.globalAlpha = base * 0.2 * entrada; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(P.x, P.y, r * 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = base * entrada; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = base;
    if (c.rotulos && c.rotulos[i] && entrada > 0.5) etiqueta(ctx, c.rotulos[i], P.x, P.y - 2, w, '#eceff9', 28, entrada);
  });
  // anotaciones
  if (aA > 0 && c.anot) c.anot.forEach(nota => anotar(ctx, c, m, nota, aA, lt, w, h));
  ctx.globalAlpha = 1;
}
function anotar(ctx, c, m, nota, a, lt, w, h) {
  const base = ctx.globalAlpha; ctx.globalAlpha = base * a;
  if (nota.t === 'resalto') {
    ctx.strokeStyle = nota.color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
    nota.idx.forEach((i, k) => { const p = m.est[i]; k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke();
    const mid = m.est[nota.idx[Math.floor(nota.idx.length / 2)]];
    etiqueta(ctx, nota.texto, mid.x, mid.y + 44, w, nota.color, 32);
  } else if (nota.t === 'anillo') {
    const p = m.est[nota.idx], r = 30 + 4 * Math.sin(lt * 3);
    ctx.strokeStyle = nota.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    etiqueta(ctx, nota.texto, p.x, p.y + 52, w, nota.color, 30);
  } else if (nota.t === 'brillo') {
    const p = m.ex[nota.extra], g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 70);
    g.addColorStop(0, 'rgba(255,184,214,.85)'); g.addColorStop(1, 'rgba(255,184,214,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 70, 0, Math.PI * 2); ctx.fill();
    etiqueta(ctx, nota.texto, p.x, p.y + 70, w, '#ffb8d6', 30, 1, 'izq');
  } else if (nota.t === 'cruz') {
    const p = m.ex[nota.extra];
    ctx.strokeStyle = '#f0b45a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, Math.PI * 2); ctx.moveTo(p.x - 44, p.y); ctx.lineTo(p.x + 44, p.y); ctx.moveTo(p.x, p.y - 44); ctx.lineTo(p.x, p.y + 44); ctx.stroke();
    etiqueta(ctx, nota.texto, p.x, p.y - 62, w, '#f0b45a', 30);
  } else if (nota.t === 'polo') {
    const A = m.est[0], G = m.est[2], vx = A.x - G.x, vy = A.y - G.y;
    const t = (h - 80 - A.y) / vy, fin = { x: A.x + vx * t * a, y: A.y + vy * t * a };
    ctx.setLineDash([12, 12]); ctx.strokeStyle = '#f0b45a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(G.x, G.y); ctx.lineTo(fin.x, fin.y); ctx.stroke(); ctx.setLineDash([]);
    if (a > 0.95) {
      const ang = Math.atan2(vy, vx);
      ctx.fillStyle = '#f0b45a'; ctx.beginPath(); ctx.moveTo(fin.x, fin.y);
      ctx.lineTo(fin.x - 26 * Math.cos(ang - 0.4), fin.y - 26 * Math.sin(ang - 0.4));
      ctx.lineTo(fin.x - 26 * Math.cos(ang + 0.4), fin.y - 26 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
    }
    etiqueta(ctx, 'Hacia el polo sur celeste', fin.x, fin.y - 36, w, '#f0b45a', 30, a);
  }
  ctx.globalAlpha = base;
}

/* Luz curvada alrededor de un agujero negro (relatividad general, caso de un agujero sin rotación) */
let RAYOS = null;
const LENTE = { cx: 560, cy: 440, M: 38 };
function trazarRayo(b) {
  const sg = Math.sign(b), bb = Math.abs(b), pts = [], dfi = 0.012;
  let u = 0, v = 1 / bb, fi = 0, captura = false;
  for (let i = 0; i < 3500; i++) {
    v += (-u + 3 * u * u) * dfi; u += v * dfi; fi += dfi;
    if (u >= 0.5) { captura = true; pts.push([-Math.cos(fi) / u, sg * Math.sin(fi) / u]); break; }
    if (u <= 0.0001 && fi > 0.3) break;
    const r = 1 / u;
    if (r > 60) continue;
    if (i % 2 === 0) pts.push([-r * Math.cos(fi), sg * r * Math.sin(fi)]);
  }
  return { pts, captura };
}
function prepararRayos() {
  const { cx, cy, M } = LENTE;
  const bs = [-11, -8.5, -7, -6, -5.6, -5.3, -5.05, -4.6, -3.8, -2.8, 2.8, 3.8, 4.6, 5.05, 5.3, 5.6, 6, 7, 8.5, 11];
  RAYOS = bs.map((b, k) => {
    const { pts, captura } = trazarRayo(b);
    const P = pts.map(([x, y]) => [cx + x * M, cy + y * M]);
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    return { P, cum, L: cum[cum.length - 1], captura, k };
  }).filter(r => r.P.length > 4);
}
function puntoEn(r, s) {
  let lo = 0, hi = r.cum.length - 1;
  while (lo < hi - 1) { const m = (lo + hi) >> 1; if (r.cum[m] <= s) lo = m; else hi = m; }
  const t = (s - r.cum[lo]) / ((r.cum[hi] - r.cum[lo]) || 1);
  return [mezcla(r.P[lo][0], r.P[hi][0], t), mezcla(r.P[lo][1], r.P[hi][1], t)];
}
function dibujarLente(ts) {
  const o = LI.lente; if (!o) return;
  const { ctx, w, h } = o; if (!RAYOS) prepararRayos();
  ctx.clearRect(0, 0, w, h);
  const { cx, cy, M } = LENTE;
  ctx.globalAlpha = suave(progreso(ts, 2, 6));
  const g = ctx.createRadialGradient(cx, cy, 2 * M, cx, cy, 8 * M);
  g.addColorStop(0, 'rgba(255,190,100,.28)'); g.addColorStop(1, 'rgba(255,190,100,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 8 * M, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1.8;
  for (const r of RAYOS) {
    if (Fondo.liviano && r.k % 2) continue;
    ctx.strokeStyle = r.captura ? 'rgba(255,170,90,.34)' : 'rgba(190,215,255,.3)';
    ctx.beginPath(); r.P.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  }
  ctx.lineCap = 'round';
  for (const r of RAYOS) for (let j = 0; j < (Fondo.liviano ? 1 : 2); j++) {
    if (Fondo.liviano && r.k % 2) continue;
    const s = (ts * 650 + r.k * 311 + j * 1500) % (r.L + 300);
    if (s > r.L) continue;
    const p = puntoEn(r, s), q = puntoEn(r, Math.max(0, s - 80));
    ctx.strokeStyle = r.captura ? '#ffb066' : '#eaf3ff'; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,205,140,.32)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, 5.196 * M, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, 2 * M, 0, Math.PI * 2); ctx.fill();
  const a = suave(progreso(ts, 12.6, 14.2));
  if (a > 0) {
    ctx.setLineDash([10, 8]); ctx.lineDashOffset = -ts * 18; ctx.strokeStyle = `rgba(240,180,90,${a.toFixed(2)})`; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(cx, cy, 2 * M + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  }
  ctx.globalAlpha = 1;
}

/* Ondas de sonido del disco de oro */
function dibujarOndas(ts) {
  const o = LI.ondas; if (!o || ts < 19.5 || ts > 48) return;
  const { ctx, w, h } = o; ctx.clearRect(0, 0, w, h);
  const A = suave(progreso(ts, 20, 22));
  const col = ['rgba(240,180,90,.95)', 'rgba(158,212,242,.7)', 'rgba(255,255,255,.4)'];
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const env = Math.sin(Math.PI * x / w);
      const y = h / 2 + Math.sin(x * 0.018 * (k + 1) + ts * (2.2 + k * 0.9)) * 78 * env * A * (0.55 + 0.45 * Math.sin(ts * 1.4 + k * 2));
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = col[k]; ctx.lineWidth = 3.4 - k * 0.7; ctx.stroke();
  }
}

/* ---------- 7. IMÁGENES ---------- */
function prepararImagen(fig) {
  const base = fig.dataset.img, alt = fig.dataset.alt || base;
  const ref = document.createElement('div');
  ref.className = 'ref';
  ref.setAttribute('role', 'img');
  ref.setAttribute('aria-label', alt + ' (imagen de referencia)');
  ref.innerHTML = Ilus.obtener(fig.dataset.ref);
  const marca = document.createElement('span');
  marca.className = 'etiqueta-ref';
  marca.textContent = CONFIG.carpetaImagenes + base + '.jpg · referencia';
  fig.insertBefore(ref, fig.firstChild);
  fig.appendChild(marca);
  fig.classList.add('es-ref');
  let i = 0;
  const probar = () => {
    if (i >= CONFIG.extensiones.length) return;
    const img = new Image();
    img.decoding = 'async';
    img.alt = alt;
    img.onload = () => { ref.replaceWith(img); marca.remove(); fig.classList.remove('es-ref'); };
    img.onerror = () => { i++; probar(); };
    img.src = CONFIG.carpetaImagenes + base + '.' + CONFIG.extensiones[i];
  };
  probar();
}

/* ---------- 8. MOTOR DEL VIDEO ---------- */
const Estado = { t: 0, reproduciendo: false, iniciado: false, sucio: true, idx: -1, fin: false, sub: null, retomar: false };
const formatoMiles = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const escapar = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function prepararEscenas() {
  ESCENAS.forEach(e => {
    e.el = document.getElementById(e.id);
    e.cues = $$('[data-in]', e.el).map(el => {
      el.classList.add('cue');
      const a = parseFloat(el.dataset.in);
      const b = el.dataset.out !== undefined ? parseFloat(el.dataset.out) : e.dur + 1;
      return { el, a, b, q: el.hasAttribute('data-q'), on: false };
    });
    e.anim = $$('[data-dur]', e.el).map(el => {
      const o = {
        el, a: parseFloat(el.dataset.in), d: parseFloat(el.dataset.dur),
        n: el.dataset.count ? parseFloat(el.dataset.count) : null,
        lineal: el.hasAttribute('data-lineal'), texto: null, tiles: null, lit: -1, v: -1,
      };
      if (el.hasAttribute('data-escribir')) { o.texto = el.textContent.trim(); el.textContent = ''; }
      if (el.classList.contains('rejilla')) {
        for (let k = 0; k < o.n; k++) el.appendChild(document.createElement('i'));
        o.tiles = Array.from(el.children);
      }
      return o;
    });
    e.trazos = $$('[data-trazo]', e.el).map(el => {
      const L = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 2300;
      el.style.strokeDasharray = L;
      return { el, L, a: parseFloat(el.dataset.in), d: parseFloat(el.dataset.trazo) };
    });
    e.notas = $$('.notas p', e.el).map(p => ({ t: parseFloat(p.dataset.t), texto: p.textContent.trim() }));
  });
}

function indiceEscena(t) {
  for (let i = 0; i < ESCENAS.length; i++) if (t < ESCENAS[i].fin) return i;
  return ESCENAS.length - 1;
}

function cambiarEscena(i) {
  const previa = Estado.idx;
  ESCENAS.forEach((e, k) => e.el.classList.toggle('activa', k === i));
  Estado.idx = i;
  if (previa !== -1) Fondo.pulso();
  detenerAudio();
}

function aplicarCues(e, ts) {
  for (const c of e.cues) {
    const on = ts >= c.a && ts < c.b;
    if (on !== c.on) { c.on = on; c.el.classList.toggle('on', on); }
    if (c.q && on) c.el.style.setProperty('--q', acotar((ts - c.a) / (Math.min(c.b, e.dur) - c.a)).toFixed(4));
  }
  for (const a of e.anim) {
    const lin = acotar((ts - a.a) / a.d), v = a.lineal ? lin : suave(lin);
    if (v === a.v) continue;
    a.v = v;
    a.el.style.setProperty('--v', v.toFixed(4));
    if (a.texto !== null) {
      const n = Math.floor(a.texto.length * v);
      a.el.innerHTML = '<span>' + escapar(a.texto.slice(0, n)) + '</span><span style="opacity:0">' + escapar(a.texto.slice(n)) + '</span>';
    } else if (a.tiles) {
      const n = Math.round(a.n * v);
      if (n !== a.lit) { a.tiles.forEach((t, k) => t.classList.toggle('lit', k < n)); a.lit = n; }
    } else if (a.n !== null) {
      a.el.textContent = formatoMiles(Math.round(a.n * v));
    }
  }
  for (const z of e.trazos) z.el.style.strokeDashoffset = z.L * (1 - suave(acotar((ts - z.a) / z.d)));
}

function actualizarSubtitulo(e, ts) {
  let txt = '';
  for (const n of e.notas) if (ts >= n.t) txt = n.texto;
  if (txt === Estado.sub) return;
  Estado.sub = txt;
  const el = $('#subtitulo');
  el.textContent = txt;
  el.classList.toggle('hay', !!txt);
}

/* Narración grabada opcional */
const Voz = { audio: null, id: null };
function detenerAudio() {
  if (Voz.audio) { try { Voz.audio.pause(); } catch (_) { /* sin audio */ } }
  Voz.audio = null; Voz.id = null;
}
function sincronizarAudio(e, ts) {
  const src = CONFIG.audioPorEscena[e.id];
  if (!src) return;
  if (Voz.id !== e.id) { detenerAudio(); Voz.audio = new Audio(src); Voz.id = e.id; }
  const a = Voz.audio;
  if (Math.abs(a.currentTime - ts) > 0.6) { try { a.currentTime = ts; } catch (_) { /* aún sin cargar */ } }
  if (Estado.reproduciendo && a.paused) a.play().catch(() => {});
  if (!Estado.reproduciendo && !a.paused) a.pause();
}

const DIBUJO = {
  s2: ts => { dibujarFases(ts); dibujarCara(ts); },
  s3: ts => { dibujarDemo(ts); dibujarMapa(ts); },
  s5: ts => dibujarLente(ts),
  s8: ts => dibujarOndas(ts),
};

function render(t) {
  const i = indiceEscena(t), e = ESCENAS[i], ts = t - e.ini;
  if (i !== Estado.idx) cambiarEscena(i);
  e.el.style.setProperty('--p', (ts / e.dur).toFixed(4));
  aplicarCues(e, ts);
  if (DIBUJO[e.id]) DIBUJO[e.id](ts);
  Fondo.estado.revelado = (e.id === 's1' && Estado.iniciado) ? suave(acotar(ts / 10)) : 1;
  actualizarSubtitulo(e, ts);
  sincronizarAudio(e, ts);
  actualizarLinea(t);
}

/* ---------- 9. CONTROLES ---------- */
function construirLinea() {
  const l = $('#linea');
  ESCENAS.forEach(e => {
    const s = document.createElement('div');
    s.className = 'seg';
    s.style.flexGrow = e.dur;
    const r = document.createElement('i');
    s.appendChild(r);
    l.appendChild(s);
    e.seg = s; e.relleno = r;
  });
}
function actualizarLinea(t) {
  ESCENAS.forEach(e => { e.relleno.style.width = (acotar((t - e.ini) / e.dur) * 100).toFixed(2) + '%'; });
  $('#tiempo').textContent = tiempoTexto(t) + ' / ' + tiempoTexto(DURACION_TOTAL);
  $('#linea').setAttribute('aria-valuenow', Math.round(t / DURACION_TOTAL * 100));
}
function tiempoDesdeX(x) {
  for (const e of ESCENAS) {
    const r = e.seg.getBoundingClientRect();
    if (x <= r.right + 2) return e.ini + acotar((x - r.left) / r.width) * e.dur;
  }
  return DURACION_TOTAL;
}

function actualizarBotones() {
  const fin = Estado.fin && !Estado.reproduciendo;
  $('#ic-play').classList.toggle('oculto', Estado.reproduciendo || fin);
  $('#ic-pausa').classList.toggle('oculto', !Estado.reproduciendo);
  $('#ic-repetir').classList.toggle('oculto', !fin);
}
function buscar(t) {
  Estado.t = acotar(t, 0, DURACION_TOTAL);
  if (Estado.t < DURACION_TOTAL) Estado.fin = false;
  Estado.sucio = true;
  actualizarBotones();
}
function reproducir() {
  if (Estado.t >= DURACION_TOTAL - 0.05) buscar(0);
  Estado.reproduciendo = true; Estado.fin = false;
  actualizarBotones(); activarUI();
}
function pausar() { Estado.reproduciendo = false; actualizarBotones(); }
function alternar() { Estado.reproduciendo ? pausar() : reproducir(); }
function irEscena(delta) {
  const i = Estado.idx, e = ESCENAS[i];
  if (delta < 0) buscar((Estado.t - e.ini > 3 || i === 0) ? e.ini : ESCENAS[i - 1].ini);
  else buscar(i < ESCENAS.length - 1 ? ESCENAS[i + 1].ini : DURACION_TOTAL);
}
function comenzar(pantalla) {
  document.body.classList.remove('sin-iniciar');
  Estado.iniciado = true;
  if (pantalla) pantallaCompleta();
  reproducir();
}
function pantallaCompleta() {
  const d = document, el = d.documentElement;
  const dentro = d.fullscreenElement || d.webkitFullscreenElement;
  const p = dentro ? (d.exitFullscreen || d.webkitExitFullscreen).call(d) : (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  if (p && p.catch) p.catch(() => {});
}
function alternarSubtitulos() {
  const v = document.body.classList.toggle('con-sub');
  $('#btn-sub').classList.toggle('activo', v);
}
function activarLiviano(v) {
  Fondo.modoLiviano(v);
  document.body.classList.toggle('liviano', v);
  $('#btn-liviano').classList.toggle('activo', v);
}
function abrirPreguntas() {
  Estado.retomar = Estado.reproduciendo;
  pausar();
  $('#preguntas').classList.add('abierto');
  $('#btn-cerrar-pre').focus();
}
function cerrarPreguntas() {
  $('#preguntas').classList.remove('abierto');
  if (Estado.retomar && !Estado.fin) reproducir();
  Estado.retomar = false;
}

let temporizadorUI = 0;
function activarUI() {
  document.body.classList.remove('quieto');
  clearTimeout(temporizadorUI);
  temporizadorUI = setTimeout(() => {
    if (Estado.reproduciendo && !$('#controles').matches(':hover')) document.body.classList.add('quieto');
  }, 2800);
}

function ajustarEscenario() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  $('#escenario').style.transform = 'translate(-50%,-50%) scale(' + s.toFixed(4) + ')';
}

/* Si el equipo va justo de recursos, pasa solo al modo liviano */
const Rend = { n: 0, suma: 0, listo: false };
function medirRendimiento(dt) {
  if (Rend.listo) return;
  Rend.n++; Rend.suma += dt;
  if (Rend.n === 150) {
    Rend.listo = true;
    if (Rend.suma / Rend.n > 0.034 && !Fondo.liviano) activarLiviano(true);
  }
}

let previo = performance.now();
function bucle(ahora) {
  const dt = Math.min((ahora - previo) / 1000, 0.1);
  previo = ahora;
  if (Estado.reproduciendo) {
    Estado.t += dt;
    if (Estado.t >= DURACION_TOTAL) {
      Estado.t = DURACION_TOTAL; Estado.reproduciendo = false; Estado.fin = true;
      actualizarBotones(); document.body.classList.remove('quieto');
    }
    medirRendimiento(dt);
  }
  if (Estado.reproduciendo || Estado.sucio) { render(Estado.t); Estado.sucio = false; }
  Fondo.dibujar(dt);
  requestAnimationFrame(bucle);
}

function conectarEventos() {
  $('#btn-comenzar').addEventListener('click', () => comenzar(false));
  $('#btn-comenzar-pant').addEventListener('click', () => comenzar(true));
  $('#btn-play').addEventListener('click', alternar);
  $('#btn-ant').addEventListener('click', () => irEscena(-1));
  $('#btn-sig').addEventListener('click', () => irEscena(1));
  $('#btn-sub').addEventListener('click', alternarSubtitulos);
  $('#btn-liviano').addEventListener('click', () => activarLiviano(!Fondo.liviano));
  $('#btn-pantalla').addEventListener('click', pantallaCompleta);
  $('#btn-repetir').addEventListener('click', () => { buscar(0); reproducir(); });
  $('#btn-preguntas').addEventListener('click', abrirPreguntas);
  $('#btn-cerrar-pre').addEventListener('click', cerrarPreguntas);
  $('#marco').addEventListener('click', ev => { if (Estado.iniciado && !ev.target.closest('button')) alternar(); });
  document.addEventListener('fullscreenchange', actualizarIconoPantalla);
  document.addEventListener('webkitfullscreenchange', actualizarIconoPantalla);
  window.addEventListener('resize', ajustarEscenario);
  ['mousemove', 'pointerdown', 'touchstart', 'keydown'].forEach(n => window.addEventListener(n, activarUI, { passive: true }));

  const linea = $('#linea'), tip = $('#tip');
  let arrastrando = false;
  linea.addEventListener('pointerdown', ev => { arrastrando = true; linea.setPointerCapture(ev.pointerId); buscar(tiempoDesdeX(ev.clientX)); });
  linea.addEventListener('pointermove', ev => {
    const t = tiempoDesdeX(ev.clientX), e = ESCENAS[indiceEscena(Math.min(t, DURACION_TOTAL - 0.01))];
    if (arrastrando) buscar(t);
    tip.textContent = tiempoTexto(t) + '  ' + e.nombre;
    const r = linea.getBoundingClientRect();
    tip.style.left = ev.clientX + 'px'; tip.style.top = (r.top - 8) + 'px'; tip.classList.add('ver');
  });
  linea.addEventListener('pointerup', () => { arrastrando = false; });
  linea.addEventListener('pointerleave', () => tip.classList.remove('ver'));

  window.addEventListener('keydown', ev => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const abierto = $('#preguntas').classList.contains('abierto');
    if (ev.key === 'Escape') { if (abierto) cerrarPreguntas(); return; }
    if (abierto || !Estado.iniciado) return;
    const enBoton = ev.target.closest && ev.target.closest('button');
    const k = ev.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && enBoton) return;
    let usada = true;
    if (k === ' ' || k === 'k') alternar();
    else if (k === 'arrowright') buscar(Estado.t + 5);
    else if (k === 'arrowleft') buscar(Estado.t - 5);
    else if (k === 'arrowdown' || k === 'pagedown') irEscena(1);
    else if (k === 'arrowup' || k === 'pageup') irEscena(-1);
    else if (k === 'home') buscar(0);
    else if (k === 'end') buscar(DURACION_TOTAL);
    else if (k === 'f') pantallaCompleta();
    else if (k === 'n') alternarSubtitulos();
    else if (k === 'l') activarLiviano(!Fondo.liviano);
    else if (k === 'p') abrirPreguntas();
    else if (k === 'e') document.body.classList.toggle('sin-etiquetas');
    else usada = false;
    if (usada) ev.preventDefault();
  });
}
function actualizarIconoPantalla() {
  const dentro = !!(document.fullscreenElement || document.webkitFullscreenElement);
  $('#ic-entrar').classList.toggle('oculto', dentro);
  $('#ic-salir').classList.toggle('oculto', !dentro);
}

/* ---------- 10. ARRANQUE ---------- */
function iniciar() {
  $$('[data-img]').forEach(prepararImagen);
  prepararEscenas();
  ['fases', 'cara', 'demo', 'mapa', 'lente', 'ondas'].forEach(k => { LI[k] = lienzo('cv-' + k); });
  construirLinea();
  conectarEventos();
  ajustarEscenario();
  const p = new URLSearchParams(window.location.search);
  if (p.has('t')) buscar(parseFloat(p.get('t')) || 0);
  if (p.has('liviano')) activarLiviano(true);
  if (p.has('sinetiquetas')) document.body.classList.add('sin-etiquetas');
  actualizarBotones();
  requestAnimationFrame(bucle);
}
window.VIDEO = { buscar, reproducir, pausar, estado: Estado, escenas: ESCENAS, render };
iniciar();
