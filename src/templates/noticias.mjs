// Sección de Noticias/Artículos de FARO.
// Cada artículo es un JSON en knowledge-base/noticias/<slug>.json (lo publica el motor n8n).
// Reutiliza el "chrome" y las clases de estilo existentes (.article, .answer-box, etc.).
import { layout } from './layout.mjs';
import { SITE, esc } from './helpers.mjs';

const YEAR = 2026;

const PILLAR_LABEL = {
  A: 'Regulación',
  B: 'Fraude y seguridad',
  C: 'Brokers',
  D: 'Guías',
  E: 'Informes',
};

// Fecha legible en español a partir de "YYYY-MM-DD".
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fechaLarga(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

// --- Mini-markdown → HTML (sin dependencias) ---
// Soporta: ## y ### (subtítulos), párrafos separados por línea en blanco,
// **negrita**, *cursiva* y [texto](url). Todo el texto se escapa primero.
function inline(s) {
  let out = esc(s);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    const ext = /^https?:\/\//.test(u);
    const rel = ext ? ' target="_blank" rel="noopener nofollow"' : '';
    return `<a href="${u}" style="color:var(--seal)"${rel}>${t}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return out;
}
function mdToHtml(md) {
  const blocks = String(md).replace(/\r/g, '').split(/\n{2,}/);
  return blocks
    .map((b) => {
      const t = b.trim();
      if (!t) return '';
      if (t.startsWith('### ')) return `<h3>${inline(t.slice(4))}</h3>`;
      if (t.startsWith('## ')) return `<h2>${inline(t.slice(3))}</h2>`;
      return `<p>${inline(t.replace(/\n/g, ' '))}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function breadcrumbNoticia(article) {
  const items = [
    { label: 'Inicio', url: '/' },
    { label: 'Noticias', url: '/noticias/' },
    { label: article.title },
  ];
  const html = items
    .map((it, i) => (it.url ? `<a href="${it.url}">${esc(it.label)}</a>` : `<span>${esc(it.label)}</span>`) + (i < items.length - 1 ? ' / ' : ''))
    .join('');
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, item: it.url ? SITE.url + it.url : undefined })),
  };
  return { html: `<div class="breadcrumb wrap">${html}</div>`, jsonld };
}

// ---------- PÁGINA DE ARTÍCULO ----------
export function renderArticulo(article, brokers = [], authors = []) {
  const nameBySlug = Object.fromEntries(brokers.map((b) => [b.slug, b.name]));
  const crumb = breadcrumbNoticia(article);
  const fecha = fechaLarga(article.updated || article.date);
  const author = article.author || (authors[0] && authors[0].name) || 'Redacción FARO';

  const related = (article.relatedBrokers || [])
    .map((slug) => ({ slug, name: nameBySlug[slug] || slug }))
    .map((b) => `<a class="reg" href="/brokers/${b.slug}/" style="text-decoration:none">${esc(b.name)}</a>`)
    .join(' ');

  const sources = (article.sources || [])
    .map((s) => {
      const label = `${esc(s.title)}${s.date ? ' · ' + esc(fechaLarga(s.date) || s.date) : ''}`;
      return s.url
        ? `<li><a href="${esc(s.url)}" target="_blank" rel="noopener nofollow" style="color:var(--seal)">${label}</a></li>`
        : `<li>${label}</li>`;
    })
    .join('');

  const jsonldArticle = {
    '@context': 'https://schema.org',
    '@type': article.schemaType === 'NewsArticle' ? 'NewsArticle' : 'Article',
    headline: article.title,
    description: article.excerpt || article.metaDescription || '',
    datePublished: article.date,
    dateModified: article.updated || article.date,
    author: { '@type': 'Organization', name: author },
    publisher: { '@type': 'Organization', name: 'FARO' },
    mainEntityOfPage: SITE.url + `/noticias/${article.slug}/`,
  };

  const main = `
${crumb.html}
<section class="block" style="padding-top:14px">
  <div class="wrap"><div class="article">
    <div class="kicker"><span class="eyebrow">${esc(PILLAR_LABEL[article.pillar] || 'Noticias')}</span></div>
    <h1>${esc(article.title)}</h1>
    <div class="byline">
      <span class="who">Por ${esc(author)}</span>
      <span class="dot-sep">·</span><span>Actualizado: ${esc(fecha)}</span>
    </div>

    ${article.excerpt ? `<div class="answer-box"><b>En breve.</b> ${esc(article.excerpt)}</div>` : ''}

    ${mdToHtml(article.body || '')}

    ${article.keyTakeaway ? `<h2>Qué significa para ti</h2><div class="answer-box">${esc(article.keyTakeaway)}</div>` : ''}

    ${related ? `<div class="hub-note" style="margin-top:26px"><b>Fichas relacionadas:</b> <span class="regs">${related}</span></div>` : ''}

    ${sources ? `<div class="keydata" style="margin-top:22px"><h5>Fuentes</h5><ul style="margin:0;padding-left:18px;line-height:1.9">${sources}</ul></div>` : ''}

    ${article.riskWarning ? `<div class="disclosure" style="margin-top:20px"><b>Aviso de riesgo.</b> Los CFD y el forex son productos apalancados con alto riesgo de perder dinero rápidamente. Entre el 74 % y el 89 % de las cuentas minoristas pierden dinero operando CFD. Este artículo es información general, no asesoramiento financiero.</div>` : ''}

    <div class="hub-note" style="margin-top:26px"><a href="/noticias/" style="color:var(--seal)">← Volver a Noticias</a></div>
  </div></div>
</section>`;

  return layout({
    active: 'noticias',
    title: `${article.metaTitle || article.title} | FARO`,
    description: article.metaDescription || article.excerpt || '',
    canonical: `/noticias/${article.slug}/`,
    jsonld: [jsonldArticle, crumb.jsonld],
    main,
  });
}

// ---------- ÍNDICE /noticias/ ----------
export function renderNoticiasIndex(articles) {
  const list = [...articles].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const cards = list
    .map((a) => `
    <a class="author-card" href="/noticias/${a.slug}/" style="margin-bottom:14px;align-items:flex-start;text-decoration:none">
      <div>
        <div class="chips" style="margin-bottom:8px"><span class="chip">${esc(PILLAR_LABEL[a.pillar] || 'Noticias')}</span><span class="chip">${esc(fechaLarga(a.date))}</span></div>
        <h3 style="margin:0 0 6px">${esc(a.title)}</h3>
        <p style="color:var(--muted);max-width:70ch">${esc(a.excerpt || '')}</p>
      </div>
    </a>`)
    .join('');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Noticias y análisis de FARO',
    itemListElement: list.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.url + `/noticias/${a.slug}/`, name: a.title })),
  };

  const main = `
<section class="block" style="padding-top:14px"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow">Redacción independiente</span>
    <h1 style="font-family:var(--display);font-size:clamp(26px,3vw,38px);letter-spacing:-.02em;margin:10px 0 12px">Noticias y análisis</h1>
    <p>Regulación, avisos, movimientos de brokers y guías para operar con criterio. Todo con fuente y fecha; nada de humo.</p>
  </div>
  ${cards || '<div class="empty" style="display:block">Muy pronto: primeros artículos.</div>'}
</div></section>`;

  return layout({
    active: 'noticias',
    title: 'Noticias y análisis de brokers de forex | FARO',
    description: 'Regulación, avisos, movimientos de brokers y guías para operar con criterio. Análisis independiente con fuente y fecha.',
    canonical: '/noticias/',
    jsonld: [jsonld],
    main,
  });
}
