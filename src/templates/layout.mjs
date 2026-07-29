// Chrome reutilizable de FAROFX: <head>, cabecera, footer y ensamblado de página.
// Todas las páginas se construyen con layout() para que el "chrome" sea idéntico.
import { SITE, esc } from './helpers.mjs';

export function head({ title, description, canonical, jsonld = [], extraHead = '' }) {
  const ld = jsonld
    .filter(Boolean)
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE.url}${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE.url}${canonical}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/theme.css">
${extraHead}
${ld}
</head>
<body>`;
}

export function header(active = '') {
  const link = (href, label, key) =>
    `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<header>
  <div class="wrap nav">
    <a href="/" class="brand"><span class="mark">F</span>FARO<b>FX</b></a>
    <nav>
      ${link('/#ranking', 'Ranking', 'ranking')}
      ${link('/metodologia/', 'Cómo puntuamos', 'metodologia')}
      ${link('/como-verificamos/', 'Opiniones verificadas', 'verificar')}
      ${link('/mejores-brokers-forex/', 'Mejores brokers', 'mejores')}
      <a href="https://t.me/FaroFXSoporteBot" target="_blank" rel="noopener">Soporte</a>
    </nav>
    <span class="spacer"></span>
    <a class="btn btn-ghost" href="/opinar/">Dejar opinión</a>
    <a class="btn btn-seal" href="/#ranking">Comparar brokers</a>
    <a class="btn nav-toggle" href="/#ranking" aria-label="Menú">☰</a>
  </div>
</header>`;
}

export function footer() {
  return `<footer>
  <div class="wrap">
    <div class="risk">
      <b>Advertencia de riesgo.</b> El trading de forex y CFD, y el copytrading, conllevan un alto riesgo de perder dinero rápidamente debido al apalancamiento. Entre el 74 % y el 89 % de las cuentas de inversores minoristas pierden dinero al operar CFD. Esta web ofrece información general y análisis independiente; no constituye asesoramiento financiero ni recomendación de inversión.
    </div>
    <div class="foot-grid">
      <div>
        <a href="/" class="brand" style="color:var(--txt-inv);margin-bottom:12px"><span class="mark">F</span>FARO<b>FX</b></a>
        <p style="font-size:13.5px;max-width:36ch">Análisis independiente de brokers basado en datos verificados. Reseñas solo de traders verificados y puntuación abierta y auditable.</p>
        <p style="font-size:13.5px;margin-top:12px">Soporte: <a href="https://t.me/FaroFXSoporteBot" target="_blank" rel="noopener">Telegram</a> · <a href="mailto:contacto@farofx.org">contacto@farofx.org</a></p>
      </div>
      <div>
        <h6>Plataforma</h6>
        <a href="/#ranking">Ranking de brokers</a>
        <a href="/metodologia/">Metodología</a>
        <a href="/como-verificamos/">Opiniones verificadas</a>
        <a href="/regulados/cysec/">Brokers regulados (hubs)</a>
        <a href="/autores/">Autores</a>
      </div>
      <div>
        <h6>Transparencia</h6>
        <a href="/politica-afiliacion/">Política de afiliación</a>
        <a href="/como-verificamos/">Cómo verificamos</a>
        <a href="/aviso-legal/">Aviso legal y riesgo</a>
        <a href="/privacidad/">Privacidad</a>
        <a href="/cookies/">Cookies</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 FAROFX</span>
      <span class="mono">Sin pagos de brokers · datos verificables · fuente independiente</span>
    </div>
  </div>
</footer>`;
}

// Ensambla una página completa.
export function layout({ active = '', main = '', scripts = '', ...meta }) {
  return `${head(meta)}
${header(active)}
${main}
${footer()}
${scripts}
</body>
</html>`;
}
