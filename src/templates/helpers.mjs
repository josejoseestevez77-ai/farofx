// Configuración del sitio y utilidades compartidas.
export const SITE = {
  name: 'FAROFX',
  url: (process.env.SITE_URL || 'https://farofx.com').replace(/\/$/, ''),
  tagline: 'Opiniones de brokers verificadas. Puntuación auditable.',
  description:
    'Plataforma independiente de análisis de brokers de forex y copytrading. Opiniones solo de traders verificados. Puntuación abierta y auditable. Nadie paga para cambiar su nota.',
  sisters: [
    { name: 'Pulso Mercados', url: 'https://pulsomercados.com', desc: 'Noticias y análisis de forex de la misma familia.' },
    { name: 'FondeoMatch', url: 'https://fondeomatch.com', desc: 'Comparador de prop firms de la misma familia.' },
  ],
};

// Pesos del score editorial (deben coincidir con metodologia-ranking.md).
export const WEIGHTS = { regulacion: 0.35, retirada: 0.25, quejas: 0.25, costes: 0.15 };

export const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function computeScore(b) {
  const s = b.subscores;
  const raw =
    WEIGHTS.regulacion * s.regulacion +
    WEIGHTS.retirada * s.retirada +
    WEIGHTS.quejas * s.quejas +
    WEIGHTS.costes * s.costes;
  return Math.round(raw * 10) / 10; // 0–10, un decimal
}

export const scoreColor = (s) => (s >= 8 ? '#2FA36B' : s >= 6.5 ? '#C8A24B' : s >= 5 ? '#d08a2c' : '#D9534F');
export const riskLabel = (s) => (s >= 8 ? 'Riesgo bajo' : s >= 6 ? 'Riesgo medio' : 'Riesgo alto');
export const starStr = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
export const fmt = (n) => Number(n).toLocaleString('es-ES');

// Etiquetas legibles de las sub-notas para el desglose auditable.
export const AUDIT_LABELS = {
  regulacion: 'Regulación verificada',
  retirada: 'Velocidad de retirada',
  quejas: 'Quejas resueltas',
  costes: 'Transparencia de costes',
};
