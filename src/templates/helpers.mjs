// Configuración del sitio y utilidades compartidas.
export const SITE = {
  name: 'FAROFX',
  url: (process.env.SITE_URL || 'https://farofx.org').replace(/\/$/, ''),
  tagline: 'Opiniones de brokers verificadas. Puntuación auditable.',
  description:
    'Plataforma independiente de análisis de brokers de forex y copytrading. Opiniones solo de traders verificados. Puntuación abierta y auditable. Nadie paga para cambiar su nota.',
  sisters: [],
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

// Dominio oficial de cada broker publicado, usado solo para mostrar su logo real
// (servicio gratuito de favicons por dominio; no usa IA ni tiene coste).
export const BROKER_DOMAINS = {
  aaafx: 'aaafx.com', admirals: 'admirals.com', adss: 'adss.com',
  'amana-capital': 'amanacapital.com', avatrade: 'avatrade.com', axi: 'axi.com',
  axiory: 'axiory.com', bdswiss: 'bdswiss.com', 'blackbull-markets': 'blackbull.com',
  'blueberry-markets': 'blueberrymarkets.com', capex: 'capex.com', 'capital-com': 'capital.com',
  'century-financial': 'century.ae', 'cmc-markets': 'cmcmarkets.com', 'colmex-pro': 'colmexpro.com',
  consorsbank: 'consorsbank.de', 'cwg-markets': 'cwgmarkets.com', darwinex: 'darwinex.com',
  deriv: 'deriv.com', 'dif-broker': 'difbroker.com', 'dmm-fx': 'fx.dmm.com',
  'doo-prime': 'dooprime.com', dukascopy: 'dukascopy.com', easymarkets: 'easymarkets.com',
  eightcap: 'eightcap.com', errante: 'errante.com', etoro: 'etoro.com',
  'etx-capital': 'etxcapital.com', eurotrader: 'eurotrader.com', exante: 'exante.eu',
  exness: 'exness.com', 'fibo-group': 'fibogroup.com', 'forex-com': 'forex.com',
  freedom24: 'freedom24.com', 'fusion-markets': 'fusionmarkets.com', fxcc: 'fxcc.com',
  fxchoice: 'fxchoice.com', fxgt: 'fxgt.com', fxopen: 'fxopen.com',
  fxpesa: 'fxpesa.com', fxprimus: 'fxprimus.com', fxpro: 'fxpro.com',
  fxtm: 'forextime.com', 'gaitame-com': 'gaitame.com', 'gbe-brokers': 'gbebrokers.com',
  'global-prime': 'globalprime.com', 'go-markets': 'gomarkets.com', 'grand-capital': 'grandcapital.net',
  gtcfx: 'gtcfx.com', 'gvc-gaesco': 'gvcgaesco.es', 'hantec-markets': 'hantecmarkets.com',
  hfm: 'hfm.com', hycm: 'hycm.com', ibroker: 'ibroker.es',
  'ic-markets': 'icmarkets.com', 'ifc-markets': 'ifcmarkets.com', iforex: 'iforex.com',
  ig: 'ig.com', infinox: 'infinox.com', 'interactive-brokers': 'interactivebrokers.com',
  intertrader: 'intertrader.com', 'invast-global': 'invast.com.au', ironfx: 'ironfx.com',
  libertex: 'libertex.com', 'markets-com': 'markets.com', mitrade: 'mitrade.com',
  'moneta-markets': 'monetamarkets.com', moomoo: 'moomoo.com', 'mufg-esmart': 'kabu.com',
  multibank: 'multibankgroup.com', naga: 'naga.com', oanda: 'oanda.com',
  octa: 'octafx.com', pepperstone: 'pepperstone.com', plus500: 'plus500.com',
  's-broker': 'sbroker.de', 'saxo-bank': 'home.saxo', 'scope-markets': 'scopemarkets.com',
  skilling: 'skilling.com', 'smbc-nikko': 'smbcnikko.co.jp', 'spread-co': 'spreadco.com',
  spreadex: 'spreadex.com', 'squared-financial': 'squaredfinancial.com', startrader: 'startrader.com',
  thinkmarkets: 'thinkmarkets.com', tickmill: 'tickmill.com', tiomarkets: 'tiomarkets.com',
  'titan-fx': 'titanfx.com', tmgm: 'tmgm.com', 'tms-brokers': 'tms.pl',
  topfx: 'topfx.com', 'trade-nation': 'tradenation.com',
  tradeeu: 'tradeeu.com', tradequo: 'tradequo.com',
  'tradeview-markets': 'tvmarkets.com', 'trading-212': 'trading212.com', trive: 'trive.com',
  'uob-kay-hian': 'uobkayhian.com', valutrades: 'valutrades.com', vantage: 'vantagemarkets.com',
  vestle: 'vestle.com', weltrade: 'weltrade.com', xm: 'xm.com',
  xtb: 'xtb.com', 'zero-markets': 'zeromarkets.com',
};

// Excepciones: logo real cuando el favicon por dominio no da un resultado bueno.
export const LOGO_OVERRIDES = {
  'trade-com': 'https://www.trade.com/wp-content/uploads/2025/04/cropped-Fav-trade-192x192.png',
};

// Devuelve la URL del logo real del broker (o null si no hay dominio mapeado,
// en cuyo caso la plantilla mantiene el círculo de iniciales de siempre).
export function logoUrl(slug) {
  if (LOGO_OVERRIDES[slug]) return LOGO_OVERRIDES[slug];
  const domain = BROKER_DOMAINS[slug];
  return domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : null;
}

// HTML del <img> del logo listo para insertar dentro de un badge .logo existente
// (position:relative en el span padre). Si falla la carga, se autoelimina y deja
// ver el círculo de iniciales que ya estaba debajo.
export function logoImg(slug) {
  const url = logoUrl(slug);
  if (!url) return '';
  return `<img src="${url}" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#fff" onerror="this.remove()">`;
}
