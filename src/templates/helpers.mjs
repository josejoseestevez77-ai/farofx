// Configuración del sitio y utilidades compartidas.
export const SITE = {
  name: 'Veredict FX',
  // Dominio canónico FIJO. No depende de env (Cloudflare tenía SITE_URL=farofx.org,
  // que hacía que canonical/og/sitemap/robots/llms apuntaran al dominio viejo).
  url: 'https://veredictfx.com',
  tagline: 'Opiniones de brokers verificadas. Puntuación auditable.',
  description:
    'Análisis independiente de brokers de forex y CFD. Opiniones solo de traders verificados y puntuación abierta y auditable. Ningún broker paga por su nota.',
  logo: 'https://veredictfx.com/logo-mark.png',
  ogImage: 'https://veredictfx.com/og.png',
  telegram: 'https://t.me/veredictfx',
  email: 'contacto@veredictfx.com',
  sameAs: ['https://t.me/veredictfx'],
  sisters: [],
};

// Pesos del score editorial (deben coincidir con la metodología pública).
// Regulación + estabilidad financiera mandan; luego retiros; después quejas y costes.
export const WEIGHTS = { regulacion: 0.35, estabilidad: 0.20, retiros: 0.22, quejas: 0.13, costes: 0.10 };

export const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// ---------- MOTOR DE PUNTUACIÓN (auditable) ----------
// La regulación se calcula desde HECHOS (los reguladores verificados), no desde
// una nota subjetiva del motor: así un chiringuito no puede "aprobar" por generosidad.
const clamp10 = (v) => Math.max(0, Math.min(10, Number(v) || 0));

// Reguladores de segundo nivel: serios pero fuera del paraguas UE/UK (sin fondo de
// compensación europeo). Los offshore débiles (FSC Mauricio, FSA Seychelles, VFSC…)
// NO cuentan como regulación real → el broker cae a "sin regulación reconocida".
export const TIER2_CODES = ['ASIC', 'FMA', 'FSCA', 'MAS', 'CFTC', 'NFA', 'SEC', 'FINRA', 'IIROC', 'SFC', 'DFSA', 'SCA', 'JFSA'];

// ¿Regulador serio no UE/UK? Por código, o la FSA de JAPÓN (distinta de la FSA de
// Seychelles, que es offshore). Se distingue por el país en el nombre del regulador.
function isTier2(r) {
  const code = regCode(r.authority);
  if (TIER2_CODES.includes(code)) return true;
  if (code === 'FSA' && /jap[oó]n|japan/i.test(String(r.authority))) return true;
  return false;
}

function regFacts(b) {
  const regs = Array.isArray(b.regulators) ? b.regulators : [];
  // Solo una ADVERTENCIA/ALERTA oficial cuenta como chiringuito. "no autorizado/sin
  // registro" es benigno (significa "no regulado por ese organismo", no una alerta).
  const warned = regs.some((r) => /advertenc|advertid|chiringu|fraud|estafa|alerta|lista negra|blacklist/i.test(String(r.status || '')));
  const t1 = regs.filter((r) => r.ok && EU_UK_CODES.includes(regCode(r.authority))).length; // UE/UK primer nivel
  const t2 = regs.filter((r) => r.ok && isTier2(r)).length;                                   // serios no UE/UK
  return { warned, t1, t2 };
}

function regulationScore(f) {
  if (f.warned) return 1;      // advertencia oficial / no autorizado
  if (f.t1 >= 3) return 10;
  if (f.t1 === 2) return 9.5;
  if (f.t1 === 1) return 8.0;
  if (f.t2 >= 2) return 6.0;
  if (f.t2 === 1) return 5.0;
  return 2.0;                  // sin regulación reconocida
}

// Estabilidad financiera (proxy con datos objetivos): antigüedad + protección de fondos.
function stabilityScore(b) {
  const y = Number(b.foundedYear);
  const age = y > 1900 && y <= 2026 ? 2026 - y : null;
  let ageS = 5.5;
  if (age != null) ageS = age >= 20 ? 10 : age >= 15 ? 9 : age >= 10 ? 8 : age >= 6 ? 6.5 : age >= 3 ? 5 : 3.5;
  const fp = String(b.fundProtection || '').toLowerCase();
  let prot = 5.5;
  if (/fscs|fogain|icf|compensa|garant/.test(fp)) prot = 9.5;
  else if (/segregad/.test(fp)) prot = 7;
  if (/sin protecci|no declarad|desconocid|ninguna/.test(fp)) prot = 2;
  return Math.round((0.6 * ageS + 0.4 * prot) * 10) / 10;
}

// Devuelve el desglose completo (pilares + topes + nota final). computeScore usa esto.
export function scoreBreakdown(b) {
  const s = b.subscores || {};
  const f = regFacts(b);
  const pillars = {
    regulacion: regulationScore(f),
    estabilidad: stabilityScore(b),
    retiros: clamp10(s.retirada),
    quejas: clamp10(s.quejas),
    costes: clamp10(s.costes),
  };
  let raw =
    WEIGHTS.regulacion * pillars.regulacion +
    WEIGHTS.estabilidad * pillars.estabilidad +
    WEIGHTS.retiros * pillars.retiros +
    WEIGHTS.quejas * pillars.quejas +
    WEIGHTS.costes * pillars.costes;

  // Bonus de excelencia: élite regulada (≥2 UE/UK), estable y sin problemas de retiro.
  const elite = f.t1 >= 2 && !f.warned && pillars.estabilidad >= 8 && pillars.retiros >= 7.5 && pillars.quejas >= 7.5;
  if (elite) raw += 0.5;
  // Penalización por quejas de retiro (lo que más duele al trader).
  let penalty = 0;
  if (pillars.retiros < 4) penalty = 1.0;
  else if (pillars.retiros < 5.5) penalty = 0.4;
  raw -= penalty;

  // TOPE SUAVE: por debajo del "hombro" la nota es la real (los malos siguen bajos);
  // por encima, se comprime asintóticamente hacia el techo → se reparten los que antes
  // se apelotonaban justo en el tope, SIN subir a los peores del grupo.
  const softcap = (r, cap, span) => {
    const sh = cap - span;
    return r <= sh ? r : sh + (cap - sh) * (1 - Math.exp(-(r - sh) / span));
  };

  let final, capReason = '';
  if (f.warned) { final = Math.min(raw, 2.0); capReason = 'Advertencia oficial de un regulador (posible chiringuito): nota limitada.'; }
  else if (f.t1 === 0 && f.t2 === 0) { final = softcap(raw, 4.5, 1.7); capReason = 'Sin regulación de primer/segundo nivel verificada: suspenso.'; }
  else if (f.t1 === 0 && f.t2 >= 1) { final = softcap(raw, 6.5, 1.5); capReason = 'Solo regulación fuera de la UE/UK (sin fondo de compensación europeo).'; }
  else { final = raw; } // regulado UE/UK: nota completa (bonus/penalización ya aplicados)

  final = Math.max(0.5, Math.min(9.9, final));
  return { pillars, raw, capReason, elite, penalty, warned: f.warned, t1: f.t1, t2: f.t2, final: Math.round(final * 10) / 10 };
}

export function computeScore(b) {
  return scoreBreakdown(b).final; // 0–10, un decimal
}

export const scoreColor = (s) => (s >= 8 ? '#2FA36B' : s >= 6.5 ? '#C8A24B' : s >= 5 ? '#d08a2c' : '#D9534F');

// Código canónico de un regulador a partir de su etiqueta (que puede venir verbosa
// del motor: "CySEC (Chipre)", "Banco Central de Irlanda (CBI)", "SEC/FINRA (EE. UU.)"…).
// Prioriza el acrónimo entre paréntesis al final; si no, el primer token.
export function regCode(authority) {
  const s = String(authority || '').trim();
  const paren = s.match(/\(([A-Z]{2,6})\)\s*$/); // acrónimo TODO en mayúsculas al final: "(CBI)", "(CFTC)"
  if (paren) return paren[1];
  const tok = s.split(/[\s(/]/)[0]; // si no, el primer token: "CySEC (Chipre)" → "CySEC"
  return tok;
}

// Reguladores de primer nivel de la UE/UK (para el flag "Sin reg. UE/UK").
export const EU_UK_CODES = [
  'FCA',   // Reino Unido
  'CySEC', // Chipre
  'CNMV',  // España
  'ESMA',  // UE
  'BaFin', // Alemania
  'CBI',   // Irlanda (Central Bank of Ireland)
  'AMF',   // Francia
  'CONSOB',// Italia
  'MFSA',  // Malta
  'FCMC',  // Letonia
  'KNF',   // Polonia
  'HCMC',  // Grecia
  'CMVM',  // Portugal
  'AFM',   // Países Bajos
  'FSMA',  // Bélgica
  'CSSF',  // Luxemburgo
  'CNB',   // Chequia
  'MNB',   // Hungría
];

// Reguladores con página-hub propia (/regulados/<code>/).
export const HUB_REGS = ['CNMV', 'FCA', 'CySEC', 'ASIC'];

// Depósito mínimo legible: "n/d" cuando no hay dato (evita "null €").
export const depLabel = (d) => (d == null || d === '' || Number.isNaN(+d)) ? 'n/d' : `${Number(d).toLocaleString('es-ES')} €`;
export const riskLabel = (s) => (s >= 8 ? 'Riesgo bajo' : s >= 6 ? 'Riesgo medio' : 'Riesgo alto');
export const starStr = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
export const fmt = (n) => Number(n).toLocaleString('es-ES');

// Etiquetas legibles de las sub-notas para el desglose auditable.
export const AUDIT_LABELS = {
  regulacion: 'Regulación verificada',
  estabilidad: 'Estabilidad financiera',
  retiros: 'Velocidad de retirada',
  quejas: 'Quejas resueltas',
  costes: 'Transparencia de costes',
};

// ---------- SELLO "Veredict FX Verificado · Nº X del ranking" ----------
// Insignia autocontenida (estilos en línea) que un broker puede mostrar como
// prueba de su posición. Se usa en las fichas, el podio y la página de ranking.
export function sealBadge(position, { size = 'md' } = {}) {
  const sm = size === 'sm';
  const posText = position ? `Nº ${position} · Ranking 2026` : 'Ranking 2026';
  return `<span class="faro-seal" style="display:inline-flex;align-items:center;gap:${sm ? '8px' : '11px'};padding:${sm ? '7px 12px' : '9px 15px'};border-radius:13px;background:linear-gradient(135deg,#0f1b14,#17281e);border:1px solid #2FA36B;box-shadow:0 6px 18px rgba(20,60,40,.18);font-family:var(--display,'Space Grotesk',system-ui,sans-serif);vertical-align:middle">
    <span style="display:grid;place-items:center;width:${sm ? '28px' : '34px'};height:${sm ? '28px' : '34px'};border-radius:9px;background:#2FA36B;color:#fff;font-weight:700;font-size:${sm ? '14px' : '17px'};flex:none">✓</span>
    <span style="display:flex;flex-direction:column;line-height:1.15;text-align:left">
      <span style="font-size:${sm ? '9px' : '10px'};letter-spacing:.14em;color:#7fd4a6;font-weight:600;text-transform:uppercase">Veredict FX · Verificado</span>
      <span style="font-size:${sm ? '13px' : '15px'};color:#fff;font-weight:700">${posText}</span>
    </span>
  </span>`;
}

// ---------- PODIO (top 3) ----------
// Recibe el modelo de cliente ya ordenado por nota (id,url,name,color,init,score,reviews).
export function podium(model) {
  const top = model.slice(0, 3);
  if (top.length < 3) return '';
  const order = [top[1], top[0], top[2]]; // 2º, 1º (centro, elevado), 3º
  const place = { 0: 2, 1: 1, 2: 3 };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const cards = order
    .map((b, idx) => {
      const p = place[idx];
      const isFirst = p === 1;
      return `<a class="pod-card${isFirst ? ' pod-1' : ''}" href="${b.url}" style="text-decoration:none">
        <div class="pod-medal">${medals[p]}</div>
        <div class="pod-logo" style="background:${b.color}">${esc(b.init)}</div>
        <div class="pod-name">${esc(b.name)}</div>
        <div class="pod-score" style="color:${scoreColor(b.score)}">${b.score.toFixed(1)}<span>/10</span></div>
        <div class="pod-rev">${Number(b.reviews).toLocaleString('es-ES')} verificadas</div>
        <div class="pod-pos">Nº ${p}</div>
      </a>`;
    })
    .join('');
  return `<style>
  .podium{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:end;margin:6px 0 30px}
  .pod-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 14px;border:1px solid var(--line-dark,#e5e0d6);border-radius:16px;background:var(--surface,#fff);text-align:center;transition:transform .15s,border-color .15s}
  .pod-card:hover{transform:translateY(-3px);border-color:var(--seal)}
  .pod-1{padding:28px 14px 24px;border-color:#2FA36B;box-shadow:0 10px 30px rgba(20,60,40,.12)}
  .pod-medal{font-size:26px}
  .pod-1 .pod-medal{font-size:34px}
  .pod-logo{width:44px;height:44px;border-radius:11px;color:#fff;font-family:var(--display);font-weight:700;font-size:17px;display:grid;place-items:center}
  .pod-1 .pod-logo{width:54px;height:54px;font-size:20px}
  .pod-name{font-weight:700;font-size:16px;color:var(--ink,#1a1a1a);font-family:var(--display)}
  .pod-1 .pod-name{font-size:19px}
  .pod-score{font-family:var(--display);font-weight:700;font-size:26px;line-height:1}
  .pod-1 .pod-score{font-size:34px}
  .pod-score span{font-size:13px;color:var(--muted);font-weight:500}
  .pod-rev{font-size:12px;color:var(--muted)}
  .pod-pos{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--seal);font-weight:700}
  @media(max-width:640px){.podium{grid-template-columns:1fr;align-items:stretch}.pod-1{order:-1}}
  </style>
  <div class="podium">${cards}</div>`;
}
