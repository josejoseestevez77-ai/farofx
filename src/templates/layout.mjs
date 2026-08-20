// Chrome reutilizable de VEREDICTFX: <head>, cabecera, footer y ensamblado de página.
// Todas las páginas se construyen con layout() para que el "chrome" sea idéntico.
import { SITE, esc } from './helpers.mjs';

export function head({ title, description, canonical, jsonld = [], extraHead = '', ogType = 'website', ogImage = SITE.ogImage, publishedTime = '', modifiedTime = '' }) {
  const ld = jsonld
    .filter(Boolean)
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
  const url = `${SITE.url}${canonical}`;
  const articleMeta = ogType === 'article'
    ? `${publishedTime ? `\n<meta property="article:published_time" content="${esc(publishedTime)}">` : ''}${modifiedTime ? `\n<meta property="article:modified_time" content="${esc(modifiedTime)}">` : ''}`
    : '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="es" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="theme-color" content="#0c1a13">
<meta property="og:site_name" content="Veredict FX">
<meta property="og:locale" content="es_ES">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(ogImage)}">${articleMeta}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/theme.css">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${extraHead}
${ld}
</head>
<body>`;
}

export function header(active = '') {
  const link = (href, label, key) =>
    `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<header>
  <style>header nav{align-items:center!important}header nav a{white-space:nowrap!important}</style>
  <div class="wrap nav">
    <a href="/" class="brand"><img src="/logo-mark.png" alt="Veredict FX" width="30" height="30" style="border-radius:7px;vertical-align:middle;margin:-2px 9px 0 0">VEREDICT<b>FX</b></a>
    <nav>
      ${link('/ranking/', 'Ranking', 'ranking')}
      ${link('/blog/', 'Blog', 'blog')}
      ${link('/metodologia/', 'Metodología', 'metodologia')}
      ${link('/mejores-brokers-forex/', 'Mejores brokers', 'mejores')}
      <a href="https://t.me/VeredictFXSoporte_bot" target="_blank" rel="noopener">Soporte</a>
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
        <a href="/" class="brand" style="color:var(--txt-inv);margin-bottom:12px"><img src="/logo-mark.png" alt="Veredict FX" width="26" height="26" style="border-radius:6px;vertical-align:middle;margin:-2px 8px 0 0">VEREDICT<b>FX</b></a>
        <p style="font-size:13.5px;max-width:36ch">Análisis independiente de brokers basado en datos verificados. Reseñas solo de traders verificados y puntuación abierta y auditable.</p>
        <p style="font-size:13.5px;margin-top:12px">Soporte: <a href="https://t.me/VeredictFXSoporte_bot" target="_blank" rel="noopener">Telegram</a> · <a href="mailto:contacto@veredictfx.com">contacto@veredictfx.com</a></p>
      </div>
      <div>
        <h6>Plataforma</h6>
        <a href="/#ranking">Ranking de brokers</a>
        <a href="/blog/">Blog</a>
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
      <span>© 2026 Veredict FX</span>
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
