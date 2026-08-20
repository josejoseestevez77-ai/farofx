// Sección BLOG de Veredict FX — hub de contenido: noticias, guías y reseñas de brokers.
// Sustituye a la antigua sección "Noticias". Cada artículo es un JSON en
// knowledge-base/noticias/<slug>.json (lo publica el motor n8n); las reseñas de
// brokers viven en /brokers/<slug>/ y aquí se enlazan en tarjetas buscables.
import { layout } from './layout.mjs';
import { SITE, esc, computeScore, scoreColor } from './helpers.mjs';

const YEAR = 2026;

// Elige la tarjeta de tema (imagen OG/social) según el slug del artículo.
// Misma lógica que el post de Telegram: coherencia entre web y redes.
function temaCard(slug) {
  const s = String(slug || '');
  if (/chiringuito|clon|estafa|senal|pig-butchering|fraude/.test(s)) return 'chiringuitos';
  if (/retir/.test(s)) return 'retiradas';
  if (/apalancamiento|esma/.test(s)) return 'apalancamiento';
  if (/spread|comision|swap|coste|deposito|bono/.test(s)) return 'costes';
  if (/fscs|fogain|compensacion|pierde-licencia|proteg|garantia/.test(s)) return 'proteccion';
  if (/regula|mifid|licencia|cnmv|fca|cysec|asic|offshore|pasaporte/.test(s)) return 'regulacion';
  return 'general';
}

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
      // Lista con viñetas: líneas que empiezan por "- ".
      if (/^\s*-\s+/.test(t)) {
        const items = t.split(/\n/).filter((l) => /^\s*-\s+/.test(l)).map((l) => `<li>${inline(l.replace(/^\s*-\s+/, ''))}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${inline(t.replace(/\n/g, ' '))}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function breadcrumbBlog(article) {
  const items = [
    { label: 'Inicio', url: '/' },
    { label: 'Blog', url: '/blog/' },
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
  const crumb = breadcrumbBlog(article);
  const fecha = fechaLarga(article.updated || article.date);
  const author = article.author || (authors[0] && authors[0].name) || 'Redacción Veredict FX';

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
    publisher: { '@type': 'Organization', name: 'Veredict FX', logo: { '@type': 'ImageObject', url: SITE.logo } },
    image: `${SITE.url}/cards/temas/${temaCard(article.slug)}.jpg`,
    inLanguage: 'es-ES',
    mainEntityOfPage: SITE.url + `/blog/${article.slug}/`,
  };

  const main = `
${crumb.html}
<section class="block" style="padding-top:14px">
  <div class="wrap"><div class="article">
    <div class="kicker"><span class="eyebrow">${esc(PILLAR_LABEL[article.pillar] || 'Blog')}</span></div>
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

    <div class="hub-note" style="margin-top:26px"><a href="/blog/" style="color:var(--seal)">← Volver al blog</a></div>
  </div></div>
</section>`;

  return layout({
    active: 'blog',
    title: article.metaTitle || `${article.title} | Veredict FX`,
    description: article.metaDescription || article.excerpt || '',
    canonical: `/blog/${article.slug}/`,
    ogType: 'article',
    ogImage: `${SITE.url}/cards/temas/${temaCard(article.slug)}.jpg`,
    publishedTime: article.date,
    modifiedTime: article.updated || article.date,
    jsonld: [jsonldArticle, crumb.jsonld],
    main,
  });
}

// ---------- ÍNDICE /blog/ (HUB) ----------
export function renderBlogIndex(articles, brokers = []) {
  const list = [...articles].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  // --- Tarjetas de artículos/noticias ---
  const artCards = list
    .map((a) => `
    <a class="blog-card" data-blog-art data-name="${esc((a.title + ' ' + (a.excerpt || '')).toLowerCase())}" href="/blog/${a.slug}/">
      <div class="chips"><span class="chip">${esc(PILLAR_LABEL[a.pillar] || 'Blog')}</span><span class="chip">${esc(fechaLarga(a.date))}</span></div>
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.excerpt || '')}</p>
      <span class="blog-more">Leer →</span>
    </a>`)
    .join('');

  // --- Tarjetas de reseñas de brokers (ordenadas por nota) ---
  const ranked = [...brokers]
    .map((b) => ({ b, s: computeScore(b) }))
    .sort((x, y) => y.s - x.s);
  const DEFAULT_VISIBLE = 12;

  const brkCards = ranked
    .map(({ b, s }, i) => {
      const regs = (b.regulators || []).filter((r) => r.ok).map((r) => r.authority);
      const regsTxt = regs.slice(0, 3).join(' · ') || 'Sin regulación UE/UK';
      const stars = Math.round(b.reviews?.stars || 0);
      const starStr = '★★★★★☆☆☆☆☆'.slice(5 - stars, 10 - stars);
      const hidden = i >= DEFAULT_VISIBLE ? ' is-hidden' : '';
      return `
      <a class="brk-card${hidden}" data-blog-brk data-name="${esc(b.name.toLowerCase())}" href="/brokers/${b.slug}/">
        <div class="brk-top">
          <span class="brk-logo" style="background:${esc(b.color || '#4a5568')}">${esc(b.init || b.name.slice(0, 2).toUpperCase())}</span>
          <span class="brk-name">${esc(b.name)}</span>
          <span class="brk-score" style="color:${scoreColor(s)}">${s.toFixed(1)}</span>
        </div>
        <div class="brk-stars">${starStr} <span>${b.reviews?.count ? b.reviews.count + ' opiniones' : 'Ficha completa'}</span></div>
        <div class="brk-regs">${esc(regsTxt)}</div>
      </a>`;
    })
    .join('');

  const showMore = ranked.length > DEFAULT_VISIBLE
    ? `<div style="text-align:center;margin-top:20px"><a href="#" id="brk-more" class="btn btn-ghost">Ver las ${ranked.length} reseñas</a></div>`
    : '';

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Blog de Veredict FX: noticias, guías y reseñas de brokers',
    itemListElement: list.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.url + `/blog/${a.slug}/`, name: a.title })),
  };

  const styles = `<style>
  .blog-search{max-width:560px;margin:8px 0 30px}
  .blog-search input{width:100%;padding:14px 18px;border:1px solid var(--line-dark,#d7d2c7);border-radius:12px;font-size:16px;font-family:inherit;background:var(--surface,#fff);color:var(--ink,#1a1a1a)}
  .blog-search input:focus{outline:none;border-color:var(--seal)}
  .blog-sec-title{font-family:var(--display);font-size:20px;letter-spacing:-.01em;margin:34px 0 16px;display:flex;align-items:center;gap:10px}
  .blog-sec-title .count{font-size:13px;color:var(--muted);font-family:var(--mono,monospace);font-weight:500}
  .blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
  .blog-card{display:flex;flex-direction:column;gap:8px;padding:20px;border:1px solid var(--line-dark,#e5e0d6);border-radius:14px;text-decoration:none;background:var(--surface,#fff);transition:border-color .15s,transform .15s}
  .blog-card:hover{border-color:var(--seal);transform:translateY(-2px)}
  .blog-card .chips{display:flex;gap:6px;flex-wrap:wrap}
  .blog-card .chip{font-size:11px;padding:3px 9px;border-radius:20px;background:var(--alert-soft,#f2efe8);color:var(--muted);font-weight:600}
  .blog-card h3{margin:2px 0 0;font-size:17px;line-height:1.3;color:var(--ink,#1a1a1a)}
  .blog-card p{margin:0;font-size:14px;color:var(--muted);line-height:1.5;flex:1}
  .blog-card .blog-more{font-size:13px;color:var(--seal);font-weight:600}
  .brk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
  .brk-card{display:flex;flex-direction:column;gap:9px;padding:15px 16px;border:1px solid var(--line-dark,#e5e0d6);border-radius:12px;text-decoration:none;background:var(--surface,#fff);transition:border-color .15s,transform .15s}
  .brk-card:hover{border-color:var(--seal);transform:translateY(-2px)}
  .brk-card.is-hidden{display:none}
  .brk-top{display:flex;align-items:center;gap:9px}
  .brk-logo{width:30px;height:30px;border-radius:8px;color:#fff;font-family:var(--display);font-weight:700;font-size:12px;display:grid;place-items:center;flex:none}
  .brk-name{font-weight:600;font-size:15px;color:var(--ink,#1a1a1a);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .brk-score{font-family:var(--display);font-weight:700;font-size:18px}
  .brk-stars{font-size:13px;color:#C8A24B;letter-spacing:1px}
  .brk-stars span{color:var(--muted);letter-spacing:0;margin-left:6px}
  .brk-regs{font-size:12px;color:var(--muted);font-family:var(--mono,monospace)}
  #blog-empty{display:none;color:var(--muted);padding:16px 0}
  </style>`;

  const main = `
${styles}
<section class="block" style="padding-top:14px"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow">Redacción independiente</span>
    <h1 style="font-family:var(--display);font-size:clamp(26px,3vw,38px);letter-spacing:-.02em;margin:10px 0 12px">Blog: noticias, guías y reseñas de brokers</h1>
    <p>Todo en un sitio: análisis regulatorio, avisos de fraude, guías para operar con criterio y las reseñas verificadas de cada broker. Busca lo que necesites.</p>
  </div>

  <div class="blog-search">
    <input id="blog-q" type="text" placeholder="Buscar un broker, una noticia o un tema…" aria-label="Buscar en el blog" autocomplete="off">
  </div>

  <div id="blog-empty">No hay resultados para tu búsqueda. Prueba con otro término.</div>

  <div class="blog-sec-title">Últimas publicaciones <span class="count">${list.length} artículo${list.length === 1 ? '' : 's'}</span></div>
  <div class="blog-grid">
    ${artCards || '<div class="empty" style="display:block">Muy pronto: primeros artículos.</div>'}
  </div>

  <div class="blog-sec-title">Reseñas de brokers <span class="count">${ranked.length} fichas</span></div>
  <div class="brk-grid">
    ${brkCards}
  </div>
  ${showMore}
</div></section>

<script>
(function(){
  var q=document.getElementById('blog-q');
  if(!q)return;
  var arts=[].slice.call(document.querySelectorAll('[data-blog-art]'));
  var brks=[].slice.call(document.querySelectorAll('[data-blog-brk]'));
  var more=document.getElementById('brk-more');
  var empty=document.getElementById('blog-empty');
  var DEF=${DEFAULT_VISIBLE};
  function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');}
  function apply(){
    var v=norm(q.value.trim());
    var shownA=0, shownB=0;
    arts.forEach(function(el){var m=!v||norm(el.getAttribute('data-name')).indexOf(v)>-1;el.style.display=m?'':'none';if(m)shownA++;});
    brks.forEach(function(el,i){var name=norm(el.getAttribute('data-name'));var m=v?name.indexOf(v)>-1:i<DEF;el.style.display=m?'':'none';if(m)shownB++;});
    if(more)more.style.display=v?'none':'';
    if(empty)empty.style.display=(v&&shownA===0&&shownB===0)?'block':'none';
  }
  q.addEventListener('input',apply);
  if(more)more.addEventListener('click',function(e){e.preventDefault();brks.forEach(function(el){el.classList.remove('is-hidden');el.style.display='';});more.style.display='none';});
  apply();
})();
</script>`;

  return layout({
    active: 'blog',
    title: 'Blog de brokers de forex: noticias, guías y reseñas | Veredict FX',
    description: 'Noticias y análisis de regulación, avisos de fraude, guías para operar y reseñas verificadas de brokers de forex y CFD. Búsqueda por broker o tema.',
    canonical: '/blog/',
    jsonld: [jsonld],
    main,
  });
}
