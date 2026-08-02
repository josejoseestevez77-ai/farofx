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

// --- Saneado de datos generados por el motor (búsqueda web con IA) ---
// El motor puede colar en algún campo etiquetas de cita como <cite index="25-1">…</cite>.
// Esas comillas rompen el HTML (p. ej. en title="…") y el texto se desborda en la tabla.
// Quitamos cualquier etiqueta HTML suelta de TODOS los campos de texto, de forma recursiva,
// para que ningún broker (actual o futuro) muestre esa basura. Los datos de brokers son
// texto plano: nunca deben contener HTML legítimo, así que es seguro limpiarlo entero.
function stripTags(s) {
  return String(s)
    .replace(/<\/?cite[^>]*>/gi, '') // etiquetas de cita de la búsqueda web
    .replace(/<[^>]+>/g, '')          // cualquier otra etiqueta HTML suelta
    .replace(/[ \t]+/g, ' ')          // colapsa espacios sobrantes
    .trim();
}
function sanitize(value) {
  if (typeof value === 'string') return stripTags(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = sanitize(value[k]);
    return out;
  }
  return value;
}

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
      return list.map(sanitize);
    }
  }
  return JSON.parse(readFileSync(join(KB, 'brokers.json'), 'utf8')).brokers.map(sanitize);
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
  body: `<div class="risk" style="color:#a83b37;background:var(--alert-soft)"><b>Advertencia de riesgo.</b> El trading de forex y CFD, y el copytrading, conllevan un alto riesgo de perder dinero rápidamente por el apalancamiento. Entre el 74% y el 89% de las cuentas minoristas pierden dinero al operar CFD.</div>
  <p><b>Titularidad.</b> Este sitio web, <b>farofx.org</b> (en adelante «FAROFX»), es titularidad de <b>Finverse SL</b>, con CIF <b>B22856512</b> y domicilio en Lugar Verin 21, 36947 Cangas (Pontevedra), España. FAROFX es un proyecto editorial independiente de análisis y comparación de brokers de forex y CFD. Correo de contacto: <a href="mailto:contacto@farofx.org" style="color:var(--seal)">contacto@farofx.org</a>.</p>
  <p><b>Naturaleza de la información.</b> FAROFX ofrece información general y opiniones editoriales con fines exclusivamente informativos. No constituye asesoramiento financiero, fiscal ni legal, ni una recomendación de inversión personalizada. FAROFX no es una entidad regulada ni presta servicios de inversión. Antes de operar, valore su situación personal y, si lo necesita, consulte con un asesor autorizado.</p>
  <p><b>Enlaces de afiliado.</b> Algunos enlaces a brokers son enlaces de afiliado: FAROFX puede percibir una comisión si abre cuenta a través de ellos, sin coste adicional para usted. Esas comisiones no influyen en la puntuación ni en el orden del ranking, que dependen exclusivamente de nuestra <a href="/metodologia/" style="color:var(--seal)">metodología pública</a>. Consulte también nuestra <a href="/politica-afiliacion/" style="color:var(--seal)">política de afiliación</a>.</p>
  <p><b>Propiedad intelectual.</b> Los textos, análisis, puntuaciones y el diseño de FAROFX están protegidos por derechos de propiedad intelectual. No se permite su reproducción total o parcial sin autorización, salvo cita breve con enlace a la fuente.</p>
  <p><b>Responsabilidad.</b> Procuramos que la información sea veraz y esté actualizada, pero no garantizamos la ausencia de errores ni la disponibilidad continua del sitio. El uso de la información es responsabilidad del usuario. Los datos de licencias y reguladores deben verificarse siempre en los registros oficiales de cada organismo.</p>
  <p><b>Legislación aplicable.</b> El presente aviso legal se rige por la legislación española y de la Unión Europea que resulte de aplicación.</p>`,
}), 0.3, 'yearly');

page('/privacidad/', renderSimplePage({
  slug: 'privacidad', title: 'Política de privacidad', eyebrow: 'Legal', h1: 'Política de privacidad',
  body: `<div class="answer-box"><b>En una frase.</b> Solo tratamos los datos que nos envías al dejar una opinión o al escribirnos, para moderar y publicar reseñas verificadas. No vendemos tus datos a nadie.</div>
  <p><b>Responsable del tratamiento.</b> Finverse SL, CIF B22856512, con domicilio en Lugar Verin 21, 36947 Cangas (Pontevedra), España, titular de farofx.org. Contacto: <a href="mailto:contacto@farofx.org" style="color:var(--seal)">contacto@farofx.org</a>.</p>
  <p><b>Qué datos tratamos y con qué finalidad.</b> Cuando envías una opinión a través del formulario, tratamos el alias que eliges, el texto de tu opinión, el contexto opcional y, si lo adjuntas, un archivo de prueba (por ejemplo, una captura). Los usamos para verificar y moderar la reseña antes de publicarla, y para mostrar la reseña ya aprobada (el alias y el texto; la prueba nunca se publica). Si nos escribes por correo, tratamos tu dirección y el contenido del mensaje para atenderte.</p>
  <p><b>Base jurídica.</b> Tu consentimiento al enviar el formulario o al escribirnos, y nuestro interés legítimo en mantener un sistema de reseñas fiable y libre de fraude.</p>
  <p><b>Conservación.</b> Conservamos la reseña mientras esté publicada o sea necesaria para las finalidades descritas. Los archivos de prueba se conservan solo el tiempo necesario para la verificación.</p>
  <p><b>Destinatarios.</b> No vendemos ni cedemos tus datos. Pueden acceder a ellos, como encargados del tratamiento, los proveedores tecnológicos que nos prestan servicio (alojamiento del sitio y mensajería interna del equipo de moderación), que actúan bajo nuestras instrucciones.</p>
  <p><b>Tus derechos.</b> Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a href="mailto:contacto@farofx.org" style="color:var(--seal)">contacto@farofx.org</a>. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<span class="mono">aepd.es</span>).</p>
  <p><b>Menores.</b> FAROFX no está dirigido a menores de edad y no recopilamos deliberadamente datos de menores.</p>`,
}), 0.3, 'yearly');

page('/cookies/', renderSimplePage({
  slug: 'cookies', title: 'Política de cookies', eyebrow: 'Legal', h1: 'Política de cookies',
  body: `<div class="answer-box"><b>En una frase.</b> FAROFX es un sitio estático que no instala cookies publicitarias ni de seguimiento propias.</div>
  <p><b>Cookies propias.</b> No utilizamos cookies propias de análisis ni de publicidad. Únicamente podrían emplearse cookies estrictamente técnicas necesarias para que el sitio funcione y se muestre correctamente.</p>
  <p><b>Enlaces a terceros.</b> Cuando pulsas un enlace hacia un broker, sales de FAROFX y accedes a un sitio de terceros que puede instalar sus propias cookies, con sus propias políticas. Algunos de esos enlaces son de afiliado (ver <a href="/politica-afiliacion/" style="color:var(--seal)">política de afiliación</a>). No controlamos las cookies de terceros y te recomendamos revisar sus políticas.</p>
  <p><b>Cómo gestionarlas.</b> Puedes bloquear o eliminar las cookies desde la configuración de tu navegador. Si en el futuro incorporamos herramientas de analítica, actualizaremos esta política y solicitaremos tu consentimiento cuando corresponda.</p>
  <p>Para cualquier duda sobre esta política, escríbenos a <a href="mailto:contacto@farofx.org" style="color:var(--seal)">contacto@farofx.org</a>.</p>`,
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
cpSync(join(__dir, 'src', 'logo-mark.png'), join(DIST, 'logo-mark.png'));
cpSync(join(__dir, 'src', 'favicon.png'), join(DIST, 'favicon.png'));
cpSync(join(__dir, 'src', 'apple-touch-icon.png'), join(DIST, 'apple-touch-icon.png'));

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
`;
writeFileSync(join(DIST, 'llms.txt'), llms);

console.log(`✓ FAROFX construido: ${pages.length} páginas + sitemap/robots/llms en dist/`);
console.log(`  Ranking (score auditable):`);
topBrokers.forEach(({ b, s }, i) => console.log(`   ${i + 1}. ${b.name.padEnd(18)} ${s.toFixed(1)}/10`));
