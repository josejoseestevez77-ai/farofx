#!/usr/bin/env node
/* ==========================================================================
   FAROFX — Generador estático (Node, sin dependencias).
   Mismo enfoque que el motor de Pulso Mercados: plantillas + contenido.
   En cada build: renderiza páginas, recalcula el ranking, genera sitemap +
   robots + llms.txt e inserta el enlazado interno. Salida: dist/.

   Uso:  SITE_URL=https://farofx.com  node build.mjs
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SITE, computeScore } from './src/templates/helpers.mjs';
import { renderHome } from './src/templates/home.mjs';
import {
  renderBroker, renderMethodology, renderComoVerificamos, renderRegulatorHub,
  renderRoundup, renderAuthorsIndex, renderAuthor, renderSimplePage,
  renderOpinar, renderOpinionRecibida,
} from './src/templates/pages.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dir, 'dist');
const KB = join(__dir, 'knowledge-base');

const BROKERS_DIR = join(KB, 'brokers');

// Carga de brokers. Preferimos una CARPETA con un fichero por broker
// (lo que el motor de n8n publica de uno en uno, igual que Pulso con cada
// artículo). Si la carpeta no existe o está vacía, usamos el brokers.json
// único (datos de demostración iniciales).
function loadBrokers() {
  if (existsSync(BROKERS_DIR)) {
    const files = readdirSync(BROKERS_DIR).filter((f) => f.toLowerCase().endsWith('.json'));
    const list = [];
    for (const f of files) {
      let parsed;
      try { parsed = JSON.parse(readFileSync(join(BROKERS_DIR, f), 'utf8')); }
      catch (e) { console.warn(`⚠ Broker inválido (ignorado): ${f} — ${e.message}`); continue; }
      if (Array.isArray(parsed)) list.push(...parsed);
      else if (parsed && Array.isArray(parsed.brokers)) list.push(...parsed.brokers);
      else if (parsed && parsed.slug) list.push(parsed);
    }
    if (list.length) {
      // Orden estable por slug para que el build sea determinista.
      list.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
      return list;
    }
  }
  return JSON.parse(readFileSync(join(KB, 'brokers.json'), 'utf8')).brokers;
}

const brokers = loadBrokers();
const authors = JSON.parse(readFileSync(join(KB, 'authors.json'), 'utf8')).authors;

const pages = []; // {path, html, priority, changefreq}

function page(path, html, priority = 0.6, changefreq = 'weekly') {
  pages.push({ path, html, priority, changefreq });
}

// ---- Construir el conjunto de páginas ----
page('/', renderHome(brokers), 1.0, 'daily');
page('/metodologia/', renderMethodology(), 0.7, 'monthly');
page('/como-verificamos/', renderComoVerificamos(), 0.7, 'monthly');
page('/mejores-brokers-forex/', renderRoundup(brokers), 0.9, 'weekly');
page('/opinar/', renderOpinar(brokers), 0.6, 'monthly');
page('/opinion-recibida/', renderOpinionRecibida(), 0.1, 'yearly');

// Fichas de reseña (página estrella)
for (const b of brokers) page(`/brokers/${b.slug}/`, renderBroker(b, authors), 0.9, 'weekly');

// Hubs por regulador (uno por cada regulador con al menos un broker verificado)
const regulators = [...new Set(brokers.flatMap((b) => b.regulators.filter((r) => r.ok).map((r) => r.authority)))];
for (const reg of regulators) page(`/regulados/${reg.toLowerCase()}/`, renderRegulatorHub(reg, brokers, authors), 0.7, 'weekly');

// Autores
page('/autores/', renderAuthorsIndex(authors), 0.5, 'monthly');
for (const a of authors) page(`/autores/${a.slug}/`, renderAuthor(a), 0.4, 'monthly');

// Legales / confianza
page('/politica-afiliacion/', renderSimplePage({
  slug: 'politica-afiliacion', title: 'Política de afiliación', eyebrow: 'Transparencia', h1: 'Política de afiliación',
  body: `<div class="answer-box"><b>En una frase.</b> FAROFX gana comisiones de afiliado declaradas cuando un trader elige un broker a través de nuestros enlaces. Esas comisiones no alteran la puntuación ni la posición en el ranking.</div>
  <p>Marcamos los enlaces de afiliado con el atributo <span class="mono">rel="nofollow sponsored"</span> y con una nota de disclosure visible en cada ficha. La nota y el orden del ranking dependen exclusivamente de la <a href="/metodologia/" style="color:var(--seal)">metodología pública</a>.</p>`,
}), 0.3, 'yearly');

page('/aviso-legal/', renderSimplePage({
  slug: 'aviso-legal', title: 'Aviso legal y advertencia de riesgo', eyebrow: 'Legal', h1: 'Aviso legal y advertencia de riesgo',
  body: `<div class="risk" style="color:#a83b37;background:var(--alert-soft)"><b>Advertencia de riesgo.</b> El trading de forex y CFD, y el copytrading, conllevan un alto riesgo de perder dinero rápidamente por el apalancamiento. Entre el 74% y el 89% de las cuentas minoristas pierden dinero.</div>
  <p>FAROFX ofrece información general y análisis independiente. No constituye asesoramiento financiero ni recomendación de inversión. Los datos de la entidad, el correo de contacto y los textos legales definitivos los aporta el titular del sitio y requieren revisión jurídica (CNMV / MiFID II) antes de publicar.</p>`,
}), 0.3, 'yearly');

// ---- Escribir a disco ----
if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const p of pages) {
  const out = p.path === '/' ? join(DIST, 'index.html') : join(DIST, p.path, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, p.html);
}

// Assets estáticos
const themeCss = readFileSync(join(__dir, 'src', 'theme.css'), 'utf8');
const homeJs = readFileSync(join(__dir, 'src', 'home.js'), 'utf8');
cpSync(join(__dir, 'src', 'theme.css'), join(DIST, 'theme.css'));
cpSync(join(__dir, 'src', 'home.js'), join(DIST, 'home.js'));

// ---- Preview todo-en-uno (para abrir con DOBLE CLIC, sin servidor) ----
// Inlina CSS + JS en el HTML para que funcione desde el disco (file://).
function standalone(html) {
  return html
    .replace('<link rel="stylesheet" href="/theme.css">', `<style>\n${themeCss}\n</style>`)
    .replace('<script src="/home.js" defer></script>', `<script>\n${homeJs}\n</script>`);
}
const homeHtml = pages.find((p) => p.path === '/').html;
writeFileSync(join(DIST, 'ABRIR-PREVIEW-FAROFX.html'), standalone(homeHtml));
// También una ficha de reseña de ejemplo, todo-en-uno (la primera disponible).
const fichaPage = pages.find((p) => p.path.startsWith('/brokers/'));
if (fichaPage) writeFileSync(join(DIST, 'PREVIEW-ficha-ejemplo.html'), standalone(fichaPage.html));

// ---- sitemap.xml ----
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map((p) => `  <url><loc>${SITE.url}${p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority.toFixed(1)}</priority></url>`)
  .join('\n')}
</urlset>
`;
writeFileSync(join(DIST, 'sitemap.xml'), sitemap);

// ---- robots.txt ----
writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`
);

// ---- llms.txt ----
const topBrokers = brokers.map((b) => ({ b, s: computeScore(b) })).sort((a, b) => b.s - a.s);
const llms = `# FAROFX

> ${SITE.description}

FAROFX es una plataforma independiente de reseñas verificadas y ranking de brokers de forex/CFD en español (España y LatAm). La posición de cada broker sale de un score editorial auditable (regulación 35%, retirada 25%, quejas 25%, costes 15%), complementado con reseñas de usuarios verificadas. Ningún broker paga por su nota.

## Páginas clave
- [Ranking y home](${SITE.url}/): comparador de brokers verificados.
- [Metodología](${SITE.url}/metodologia/): fórmula y pesos del score.
- [Cómo verificamos](${SITE.url}/como-verificamos/): proceso anti-fraude y verificación de licencias.
- [Mejores brokers de forex 2026](${SITE.url}/mejores-brokers-forex/)

## Fichas de reseña
${topBrokers.map(({ b, s }) => `- [${b.name} (${s.toFixed(1)}/10)](${SITE.url}/brokers/${b.slug}/)`).join('\n')}

## Hubs por regulador
${regulators.map((r) => `- [Brokers regulados por ${r}](${SITE.url}/regulados/${r.toLowerCase()}/)`).join('\n')}

## Familia de webs
${SITE.sisters.map((s) => `- ${s.name}: ${s.url} — ${s.desc}`).join('\n')}
`;
writeFileSync(join(DIST, 'llms.txt'), llms);

console.log(`✓ FAROFX construido: ${pages.length} páginas + sitemap/robots/llms en dist/`);
console.log(`  Ranking (score auditable):`);
topBrokers.forEach(({ b, s }, i) => console.log(`   ${i + 1}. ${b.name.padEnd(18)} ${s.toFixed(1)}/10`));
