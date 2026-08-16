// Fichas de reseña, hubs, autores, metodología y páginas de confianza/legales.
import { layout } from './layout.mjs';
import { SITE, esc, computeScore, scoreColor, riskLabel, starStr, fmt, AUDIT_LABELS, WEIGHTS, sealBadge } from './helpers.mjs';

const YEAR = 2026;
const EU_UK = ['FCA', 'CySEC', 'CNMV', 'ESMA'];

function breadcrumb(items) {
  const html = items
    .map((it, i) => (it.url ? `<a href="${it.url}">${esc(it.label)}</a>` : `<span>${esc(it.label)}</span>`) + (i < items.length - 1 ? ' / ' : ''))
    .join('');
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      item: it.url ? SITE.url + it.url : undefined,
    })),
  };
  return { html: `<div class="breadcrumb wrap">${html}</div>`, jsonld };
}

function auditLines(b) {
  return Object.keys(AUDIT_LABELS)
    .map((k) => {
      const v = b.subscores[k];
      return `<div class="ll"><span>${AUDIT_LABELS[k]} <em style="color:var(--muted);font-style:normal">(${Math.round(WEIGHTS[k] * 100)}%)</em></span><span class="bar"><i style="width:${v * 10}%;background:${scoreColor(v)}"></i></span><span class="v">${v.toFixed(1)}</span></div>`;
    })
    .join('');
}

// ---------- FICHA DE RESEÑA (página estrella) ----------
export function renderBroker(b, authors, position = null) {
  const score = computeScore(b);
  const author = authors[0];
  const regOk = b.regulators.filter((r) => r.ok);
  const euUk = regOk.filter((r) => EU_UK.includes(r.authority));
  const isRegulated = euUk.length > 0;
  const regNames = regOk.map((r) => r.authority).join(', ') || 'ninguno de primer nivel';

  const directAnswer = isRegulated
    ? `¿Es fiable ${b.name}? Sí, con matices. Está regulado por ${euUk.map((r) => r.authority).join(' y ')} (${euUk.map((r) => r.licenseNumber).filter(Boolean).join(', ')}), con cuentas segregadas y protección de fondos. Obtiene ${score.toFixed(1)}/10 en nuestro score auditable, basado en regulación verificada, velocidad de retirada, resolución de quejas y transparencia de costes.`
    : `¿Es ${b.name} un scam o es fiable? No está regulado por ningún supervisor de primer nivel de la UE/UK (CNMV, FCA, CySEC), por lo que el riesgo es alto. Obtiene ${score.toFixed(1)}/10 en nuestro score auditable. Antes de depositar, verifica su licencia en el registro oficial del regulador que declare.`;

  // Pros y contras derivados de los datos objetivos.
  const pros = [];
  const cons = [];
  if (isRegulated) pros.push(`Regulado por ${euUk.map((r) => r.authority).join(' y ')}, con licencia verificada en el registro oficial.`);
  else cons.push('Sin regulación de primer nivel en la UE/UK: fuera del paraguas de MiFID II y de los fondos de compensación europeos.');
  if (b.subscores.retirada >= 8) pros.push('Retiradas rápidas y fiables según las cuentas verificadas.');
  else if (b.subscores.retirada < 6) cons.push('Velocidad de retirada por debajo de la media reportada.');
  if (b.subscores.costes >= 7.5) pros.push(`Costes transparentes: ${b.spreadTypical}.`);
  else cons.push('Transparencia de costes mejorable frente a las condiciones publicadas.');
  if (b.office.status === 'verified') pros.push(`Oficina física verificada (${b.office.date}).`);
  if (b.office.status === 'failed') cons.push('La verificación de oficina física no se superó.');
  if (b.subscores.quejas < 6) cons.push('Ratio de quejas sin resolver por encima de lo deseable.');

  const platforms = b.platforms.join(', ');
  const crumb = breadcrumb([
    { label: 'Inicio', url: '/' },
    { label: 'Brokers', url: '/#ranking' },
    { label: b.name },
  ]);

  const faqs = [
    { q: `¿Es ${b.name} fiable en ${YEAR}?`, a: directAnswer },
    {
      q: `¿Está regulado ${b.name}?`,
      a: isRegulated
        ? `Sí. ${b.name} opera bajo ${regNames}. Puedes comprobar cada licencia en el registro oficial del regulador correspondiente (enlaces en la caja de datos clave).`
        : `No por un regulador de primer nivel de la UE/UK. ${b.name} no aparece autorizado en CNMV, FCA ni CySEC según nuestra última verificación (${b.regulators[0].verifiedDate}).`,
    },
    { q: `¿Cuál es el depósito mínimo de ${b.name}?`, a: `El depósito mínimo es de ${b.depositMin} €. Las condiciones de cuenta se re-verifican periódicamente.` },
    { q: `¿Qué plataformas ofrece ${b.name}?`, a: `${b.name} ofrece ${platforms}.` },
  ];

  const jsonldReview = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'FinancialService',
      name: b.name,
      url: SITE.url + `/brokers/${b.slug}/`,
      areaServed: 'ES',
    },
    author: { '@type': 'Person', name: author.name, url: SITE.url + `/autores/${author.slug}/` },
    reviewRating: { '@type': 'Rating', ratingValue: score.toFixed(1), bestRating: '10', worstRating: '0' },
    datePublished: b.regulators[0].verifiedDate,
    publisher: { '@type': 'Organization', name: 'FAROFX' },
  };
  const jsonldAggregate = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: b.name,
    url: SITE.url + `/brokers/${b.slug}/`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: b.reviews.stars.toFixed(1),
      bestRating: '5',
      reviewCount: b.reviews.count,
    },
  };
  const jsonldFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const main = `
${crumb.html}
<section class="block" style="padding-top:14px">
  <div class="wrap"><div class="article">
    <div class="kicker">
      <span class="eyebrow">Ficha de reseña · Broker de ${b.type.includes('copy') ? 'copytrading' : 'forex/CFD'}</span>
    </div>
    <h1>${b.name}: ¿es fiable o un scam? Reseña ${YEAR}</h1>
    <div class="byline">
      <span class="who">Por <a href="/autores/${author.slug}/" style="color:var(--seal)">${esc(author.name)}</a></span>
      <span class="dot-sep">·</span><span>${esc(author.role)}</span>
      <span class="dot-sep">·</span><span>Actualizado: ${b.regulators[0].verifiedDate}</span>
      <span class="dot-sep">·</span><span>${starStr(b.reviews.stars)} ${b.reviews.stars.toFixed(1)}/5 · ${fmt(b.reviews.count)} reseñas</span>
    </div>

    <div class="answer-box"><b>Respuesta directa.</b> ${esc(directAnswer)}</div>

    <div class="keydata">
      <h5>Caja de dato clave · verificado con fuente y fecha</h5>
      <div class="kd"><b>Regulación</b><div>${regOk.map((r) => `${r.authority}${r.licenseNumber ? ' · ' + r.licenseNumber : ''} (${r.status})`).join('; ') || 'Sin regulación de primer nivel'}<span class="src">Fuente: registro oficial · verificado ${b.regulators[0].verifiedDate}</span></div></div>
      <div class="kd"><b>Entidad legal</b><div>${esc(b.legalEntity)}</div></div>
      <div class="kd"><b>Sede</b><div>${b.headquarters.flag} ${esc(b.headquarters.country)}</div></div>
      <div class="kd"><b>Protección de fondos</b><div>${esc(b.fundProtection)}</div></div>
      <div class="kd"><b>Trayectoria</b><div>Operando desde ${b.foundedYear} (${YEAR - b.foundedYear} años)</div></div>
      <div class="kd"><b>Depósito mínimo</b><div>${b.depositMin} €</div></div>
      <div class="kd"><b>Costes típicos</b><div>${esc(b.spreadTypical)}<span class="src">Medición propia · ${b.regulators[0].verifiedDate}</span></div></div>
      <div class="kd"><b>Plataformas</b><div>${esc(platforms)}</div></div>
      <div class="kd"><b>Oficina verificada</b><div>${b.office.status === 'verified' ? '✅ Sí (' + b.office.date + ')' : b.office.status === 'failed' ? '⚠ No superada' : b.office.status === 'pending' ? '🕓 En revisión' : '– No aportada'}</div></div>
    </div>

    <h2>¿Es ${b.name} un scam?</h2>
    <p>${isRegulated
      ? `${b.name} no es un scam en el sentido de fraude sin licencia: está autorizado por ${euUk.map((r) => r.authority).join(' y ')} y sus licencias figuran activas en el registro oficial. Como todo producto apalancado, sigue siendo de alto riesgo, pero la marca opera dentro de un marco regulado.`
      : `Conviene distinguir entre "broker regulado" y "fraude sin licencia". ${b.name} no aparece autorizado por ningún regulador de primer nivel de la UE/UK. Eso no prueba por sí solo que sea un fraude, pero sí que operas sin la protección de MiFID II ni de los fondos de compensación europeos.`}</p>
    <p><b>Cómo verificar su licencia tú mismo:</b> entra en el registro oficial del regulador (por ejemplo, el registro de la CNMV para España o el de la FCA para Reino Unido), busca la entidad legal exacta (${esc(b.legalEntity)}) y comprueba que el número de licencia y el estado coinciden con lo que el broker publica.</p>

    <h2>Regulación y seguridad</h2>
    <div class="keydata" style="margin-top:8px">
      <h5>Verificación regulatoria</h5>
      ${b.regulators.map((r) => `<div class="kd"><b>${r.authority}</b><div>${r.ok ? '✓' : '✕'} ${esc(r.status)}${r.licenseNumber ? ' · ' + esc(r.licenseNumber) : ''}<span class="src">Registro oficial · verificado ${r.verifiedDate}</span></div></div>`).join('')}
    </div>
    <p>Marco aplicable: ${isRegulated ? 'MiFID II y normativa ESMA para los reguladores europeos implicados.' : 'fuera del marco MiFID II al no constar regulación europea de primer nivel.'} La protección de fondos declarada es: ${esc(b.fundProtection)}.</p>

    <h2>Costes, plataformas y cuenta</h2>
    <p>Costes típicos medidos: ${esc(b.spreadTypical)}. Depósito mínimo: ${b.depositMin} €. Plataformas disponibles: ${esc(platforms)}. Cada dato se re-verifica de forma periódica; la fecha de "actualizado" de esta ficha es real.</p>

    <h3>Pros y contras reales</h3>
    <ul class="pc">
      ${pros.map((p) => `<li class="pro">${esc(p)}</li>`).join('')}
      ${cons.map((c) => `<li class="con">${esc(c)}</li>`).join('')}
    </ul>

    <h2>Veredicto con puntuación</h2>
    <div class="verdict">
      <div class="vh"><b style="color:${scoreColor(score)}">${score.toFixed(1)}</b><span class="vbadge">${riskLabel(score)}</span><span class="mono" style="font-size:12px;color:var(--muted)">basado en ${fmt(b.reviews.count)} cuentas verificadas</span></div>
      ${position ? `<div style="margin:14px 0 6px">${sealBadge(position)}</div><p style="margin:0 0 12px;font-size:13px;color:var(--muted)">${esc(b.name)} ocupa la posición <b>Nº ${position}</b> de ${YEAR} en el <a href="/ranking/" style="color:var(--seal)">ranking de FARO</a>.</p>` : ''}
      <p style="margin:0 0 12px">Este número es el mismo que ordena el ranking, derivado de la evidencia según la <a href="/metodologia/" style="color:var(--seal)">metodología pública</a>. Desglose auditable:</p>
      <div class="ledger-lines" style="color:var(--muted);padding:0">${auditLines(b)}</div>
    </div>

    <h2>Opiniones verificadas de traders</h2>
    ${b.reviews.samples.map((r) => `<div class="rev"><div class="rh"><span class="who"><span class="vbadge">VERIF.</span>${esc(r.user)}</span><span class="stars">${starStr(r.stars)}</span></div><p>${esc(r.text)}</p><div class="rmeta">${r.meta.map((m) => `<span>· ${esc(m)}</span>`).join('')}</div></div>`).join('')}

    <h2>Preguntas frecuentes</h2>
    <div class="faq">
      ${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
    </div>

    <div class="disclosure"><b>Disclosure de afiliación.</b> ${b.affiliateUrl ? 'FAROFX puede percibir una comisión si abres cuenta a través de nuestro enlace. Esta comisión no altera la puntuación ni la posición en el ranking, que dependen solo de la evidencia.' : 'No mantenemos enlace de afiliación con este broker.'} El trading de forex/CFD y el copytrading conllevan alto riesgo de pérdida por apalancamiento.</div>

    ${b.affiliateUrl ? `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px"><a class="btn btn-seal" href="${esc(b.affiliateUrl)}" rel="nofollow sponsored">Ver oferta de ${esc(b.name)} (afiliado declarado) →</a><a class="btn btn-ghost" style="color:var(--ink);border-color:var(--line-dark)" href="/#ranking">Comparar con otros brokers</a></div>` : `<a class="btn btn-ghost" style="color:var(--ink);border-color:var(--line-dark)" href="/#ranking">Comparar con otros brokers →</a>`}

    <div class="hub-note" style="margin-top:30px"><b>Enlaces relacionados:</b>
      ${euUk.map((r) => `<a href="/regulados/${r.authority.toLowerCase()}/" style="color:var(--seal)">Brokers regulados por ${r.authority}</a> · `).join('')}
      <a href="/mejores-brokers-forex/" style="color:var(--seal)">Mejores brokers de forex ${YEAR}</a>
    </div>
  </div></div>
</section>`;

  return layout({
    active: '',
    title: `${b.name}: ¿es fiable o un scam? Reseña ${YEAR} | FAROFX`,
    description: directAnswer.slice(0, 155),
    canonical: `/brokers/${b.slug}/`,
    jsonld: [jsonldReview, jsonldAggregate, jsonldFaq, crumb.jsonld],
    main,
  });
}

// ---------- METODOLOGÍA ----------
export function renderMethodology() {
  const crumb = breadcrumb([{ label: 'Inicio', url: '/' }, { label: 'Metodología' }]);
  const main = `${crumb.html}
<section class="block" style="padding-top:14px"><div class="wrap"><div class="article">
  <span class="eyebrow">Metodología abierta</span>
  <h1>Cómo puntuamos y rankeamos a los brokers</h1>
  <div class="answer-box"><b>En una frase.</b> La nota de cada broker es una media ponderada de cuatro factores medibles —regulación (35%), velocidad de retirada (25%), quejas resueltas (25%) y transparencia de costes (15%)— con fuente y fecha en cada dato. Ningún broker puede pagar para cambiar su nota.</div>
  <h2>La fórmula</h2>
  <p class="mono">score = 0,35·regulación + 0,25·retirada + 0,25·quejas + 0,15·costes</p>
  <div class="keydata"><h5>Pesos y qué mide cada factor</h5>
    <div class="kd"><b>Regulación verificada (35%)</b><div>Reguladores de primer nivel, entidad legal, protección/compensación de fondos y segregación. Licencias cruzadas en vivo con CNMV, FCA, CySEC, ASIC y reguladores LatAm.</div></div>
    <div class="kd"><b>Velocidad de retirada (25%)</b><div>Tiempo medio de pago reportado por cuentas verificadas.</div></div>
    <div class="kd"><b>Quejas y resolución (25%)</b><div>Ratio de incidencias abiertas vs. resueltas y antecedentes públicos tratados con transparencia.</div></div>
    <div class="kd"><b>Transparencia de costes (15%)</b><div>Spreads, comisiones y swaps publicados frente a los medidos.</div></div>
  </div>
  <h2>Reglas innegociables</h2>
  <ul class="pc">
    <li class="pro">El veredicto y la posición los decide la evidencia, nunca un acuerdo comercial.</li>
    <li class="pro">Nada de veredictos prefijados ni "siempre positivo/negativo" para ninguna marca.</li>
    <li class="pro">Pros y contras reales en cada ficha.</li>
    <li class="pro">Disclosure de afiliación visible siempre; los enlaces de afiliado no modifican la nota.</li>
  </ul>
  <div class="pledge" style="color:var(--ink);background:var(--seal-soft)"><b style="color:#7a5e18">Compromiso.</b> Nuestros ingresos vienen de comisiones de afiliado declaradas. Ningún broker puede pagar para subir, bajar o borrar su puntuación.</div>
</div></div></section>`;
  return layout({ active: 'metodologia', title: 'Metodología de ranking | FAROFX', description: 'Cómo FAROFX calcula la nota de cada broker: fórmula, pesos y reglas. Puntuación abierta y auditable.', canonical: '/metodologia/', jsonld: [crumb.jsonld], main });
}

// ---------- CÓMO VERIFICAMOS ----------
export function renderComoVerificamos() {
  const crumb = breadcrumb([{ label: 'Inicio', url: '/' }, { label: 'Cómo verificamos' }]);
  const main = `${crumb.html}
<section class="block" style="padding-top:14px"><div class="wrap"><div class="article">
  <span class="eyebrow">Opiniones verificadas</span>
  <h1>Cómo verificamos las opiniones y las licencias</h1>
  <div class="answer-box"><b>En una frase.</b> Una reseña no se publica hasta que el trader demuestra que tuvo una cuenta real, y una licencia no se da por válida hasta cruzarla con el registro oficial del regulador. Sin prueba, no se publica.</div>
  <h2>Opiniones de traders (anti-fraude)</h2>
  <div class="steps">
    <div class="step"><div class="num">1</div><h4>Demuestra tu cuenta</h4><p>Extracto, captura del nº de cuenta o contraseña <em>investor</em> de solo lectura. Nunca credenciales con permiso de operar.</p></div>
    <div class="step"><div class="num">2</div><h4>Revisión humana</h4><p>Comprobamos que la cuenta existió y anonimizamos datos sensibles. Deduplicación, límites por IP/usuario y detección de campañas.</p></div>
    <div class="step"><div class="num">3</div><h4>Sello + auditoría</h4><p>La reseña aparece con sello <em>Verificado</em> y un ID que enlaza a la evidencia tratada.</p></div>
  </div>
  <h2>Licencias de brokers</h2>
  <p>Para cada broker, verificamos la licencia en el registro oficial del regulador antes de publicar nada, y guardamos la fuente y la fecha. Las licencias se re-verifican periódicamente; si una cambia de estado, la ficha se actualiza.</p>
  <div style="margin-top:20px"><a class="btn btn-seal" href="/#verificar">Dejar mi opinión verificada</a></div>
</div></div></section>`;
  return layout({ active: 'verificar', title: 'Cómo verificamos opiniones y licencias | FAROFX', description: 'Proceso de verificación de opiniones de traders (anti-fraude) y de licencias de brokers en el registro oficial.', canonical: '/como-verificamos/', jsonld: [crumb.jsonld], main });
}

// ---------- HUB DE REGULADOR ----------
export function renderRegulatorHub(reg, brokers, authors) {
  const list = brokers
    .map((b) => ({ b, score: computeScore(b) }))
    .filter(({ b }) => b.regulators.some((r) => r.authority === reg && r.ok))
    .sort((a, b) => b.score - a.score);
  const crumb = breadcrumb([{ label: 'Inicio', url: '/' }, { label: 'Regulados', url: '/#ranking' }, { label: reg }]);
  const rows = list
    .map(({ b, score }, i) => `<a class="row" href="/brokers/${b.slug}/" style="text-decoration:none">
      <span class="rank">${i < 3 ? ['🥇', '🥈', '🥉'][i] : ''}${String(i + 1).padStart(2, '0')}</span>
      <div class="bk"><span class="logo" style="background:${b.color}">${b.init}</span><span class="meta"><b>${esc(b.name)}</b><span>Depósito mín. ${b.depositMin}€ · desde ${b.foundedYear}</span></span></div>
      <div class="regs">${b.regulators.filter((r) => r.ok).map((r) => `<span class="reg">${r.authority}</span>`).join('')}</div>
      <span class="scorepill"><span class="dot" style="background:${scoreColor(score)}"></span>${score.toFixed(1)}</span>
      <span class="more">Ver análisis</span></a>`)
    .join('');
  const jsonld = { '@context': 'https://schema.org', '@type': 'ItemList', name: `Brokers regulados por ${reg}`, itemListElement: list.map(({ b }, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.url + `/brokers/${b.slug}/`, name: b.name })) };
  const main = `${crumb.html}
<section class="block" style="padding-top:14px"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Hub · Regulador</span><h1 style="font-family:var(--display);font-size:clamp(26px,3vw,38px);letter-spacing:-.02em;margin:10px 0 12px">Brokers regulados por ${reg}</h1><p>Brokers con licencia activa verificada en el registro oficial de ${reg}, ordenados por nuestro score auditable.</p></div>
  <div class="hub-note">La regulación por ${reg} es uno de los factores de mayor peso (35%) del <a href="/metodologia/" style="color:var(--seal)">score editorial</a>. Comprobamos cada licencia en el registro oficial con fuente y fecha.</div>
  <div class="table"><div class="thead" style="grid-template-columns:28px 1.7fr 1fr 60px 92px"><span>#</span><span>Broker</span><span>Reguladores</span><span>Nota</span><span></span></div>
  <style>.hubtable .row{grid-template-columns:28px 1.7fr 1fr 60px 92px}</style>
  <div class="hubtable">${rows || '<div class="empty" style="display:block">Todavía no hay brokers verificados en este hub.</div>'}</div></div>
</div></section>`;
  return layout({ active: '', title: `Brokers regulados por ${reg} (${YEAR}) | FAROFX`, description: `Ranking de brokers de forex regulados por ${reg}, con licencia verificada en el registro oficial y score auditable.`, canonical: `/regulados/${reg.toLowerCase()}/`, jsonld: [jsonld, crumb.jsonld], main });
}

// ---------- ROUNDUP "MEJORES" ----------
export function renderRoundup(brokers) {
  const list = brokers.map((b) => ({ b, score: computeScore(b) })).sort((a, b) => b.score - a.score);
  const crumb = breadcrumb([{ label: 'Inicio', url: '/' }, { label: 'Mejores brokers de forex' }]);
  const rows = list
    .map(({ b, score }, i) => `<a class="row" href="/brokers/${b.slug}/" style="text-decoration:none">
      <span class="rank">${i < 3 ? ['🥇', '🥈', '🥉'][i] : ''}${String(i + 1).padStart(2, '0')}</span>
      <div class="bk"><span class="logo" style="background:${b.color}">${b.init}</span><span class="meta"><b>${esc(b.name)}</b><span>${starStr(b.reviews.stars)} ${b.reviews.stars.toFixed(1)}/5 · ${fmt(b.reviews.count)} reseñas</span></span></div>
      <div class="regs">${b.regulators.filter((r) => r.ok).map((r) => `<span class="reg">${r.authority}</span>`).join('') || '<span class="reg warn">Sin reg. UE/UK</span>'}</div>
      <span class="scorepill"><span class="dot" style="background:${scoreColor(score)}"></span>${score.toFixed(1)}</span>
      <span class="more">Ver análisis</span></a>`)
    .join('');
  const jsonld = { '@context': 'https://schema.org', '@type': 'ItemList', name: `Mejores brokers de forex ${YEAR}`, itemListElement: list.map(({ b }, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.url + `/brokers/${b.slug}/`, name: b.name })) };
  const main = `${crumb.html}
<section class="block" style="padding-top:14px"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Roundup ${YEAR}</span><h1 style="font-family:var(--display);font-size:clamp(26px,3vw,38px);letter-spacing:-.02em;margin:10px 0 12px">Mejores brokers de forex verificados (${YEAR})</h1><p>Nuestra selección, ordenada por el score auditable. Cada posición se justifica con datos verificados, no con acuerdos comerciales.</p></div>
  <div class="table"><div class="thead" style="grid-template-columns:28px 1.7fr 1fr 60px 92px"><span>#</span><span>Broker</span><span>Reguladores</span><span>Nota</span><span></span></div>
  <style>.hubtable .row{grid-template-columns:28px 1.7fr 1fr 60px 92px}</style>
  <div class="hubtable">${rows}</div></div>
  <div class="disclosure" style="margin-top:24px"><b>Disclosure.</b> Algunas fichas incluyen enlaces de afiliado declarados que no alteran el orden ni la nota. Forex/CFD: alto riesgo de pérdida.</div>
</div></section>`;
  return layout({ active: 'mejores', title: `Mejores brokers de forex ${YEAR} | FAROFX`, description: `Ranking de los mejores brokers de forex verificados en ${YEAR}, ordenados por score auditable con datos verificados.`, canonical: '/mejores-brokers-forex/', jsonld: [jsonld, crumb.jsonld], main });
}

// ---------- AUTORES ----------
export function renderAuthorsIndex(authors) {
  const crumb = breadcrumb([{ label: 'Inicio', url: '/' }, { label: 'Autores' }]);
  const cards = authors
    .map((a) => `<a href="/autores/${a.slug}/" class="author-card" style="margin-bottom:14px">
      <span class="av">${a.name.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 1) || 'F'}</span>
      <div><h3>${esc(a.name)}</h3><p>${esc(a.role)} · ${esc(a.location)}</p><div class="chips">${a.specialties.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div></div></a>`)
    .join('');
  const main = `${crumb.html}
<section class="block" style="padding-top:14px"><div class="wrap"><div class="article">
  <span class="eyebrow">Equipo E-E-A-T</span><h1>Autores de FAROFX</h1>
  <p style="color:var(--muted)">Firmas reales ancladas a regulación y análisis de brokers. Cada autor responde de lo que firma.</p>
  <div class="hub-note">Proceso editorial verificado: cada licencia se comprueba en el registro oficial del regulador, con fuente y fecha, antes de publicar cada ficha.</div>
  ${cards}
</div></div></section>`;
  return layout({ active: '', title: 'Autores | FAROFX', description: 'El equipo editorial de FAROFX: analistas de brokers, regulación, costes y protección al inversor.', canonical: '/autores/', jsonld: [crumb.jsonld], main });
}

export function renderAuthor(a) {
  const crumb = breadcrumb([{ label: 'Inicio', url: '/' }, { label: 'Autores', url: '/autores/' }, { label: a.name }]);
  const jsonld = { '@context': 'https://schema.org', '@type': 'Person', name: a.name, jobTitle: a.role, url: SITE.url + `/autores/${a.slug}/`, knowsAbout: a.specialties, sameAs: a.sameAs };
  const main = `${crumb.html}
<section class="block" style="padding-top:14px"><div class="wrap"><div class="article">
  <div class="author-card" style="margin-bottom:22px"><span class="av">${a.name.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 1) || 'F'}</span><div><h1 style="font-size:26px;margin:0 0 4px">${esc(a.name)}</h1><p>${esc(a.role)} · ${esc(a.location)}</p></div></div>
  <h2>Especialidades</h2><div class="chips">${a.specialties.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div>
  <h2>Credenciales</h2><p>${esc(a.credentials)}</p>
  <div class="hub-note">Las reseñas de FAROFX las firma el equipo editorial. Cada ficha se elabora verificando las licencias en los registros oficiales de los reguladores, con fuente y fecha.</div>
</div></div></section>`;
  return layout({ active: '', title: `${a.name} — ${a.role} | FAROFX`, description: `${a.role} en FAROFX. Especialista en ${a.specialties.join(', ')}.`, canonical: `/autores/${a.slug}/`, jsonld: [jsonld, crumb.jsonld], main });
}

// ---------- PÁGINAS LEGALES / CONFIANZA ----------
export function renderSimplePage({ slug, title, eyebrow, h1, body, active = '' }) {
  const crumb = breadcrumb([{ label: 'Inicio', url: '/' }, { label: h1 }]);
  const main = `${crumb.html}
<section class="block" style="padding-top:14px"><div class="wrap"><div class="article">
  <span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(h1)}</h1>${body}
</div></div></section>`;
  return layout({ active, title: `${title} | FAROFX`, description: title, canonical: `/${slug}/`, jsonld: [crumb.jsonld], main });
}

// ---------- FORMULARIO: DEJAR OPINIÓN ----------
// El formulario envía la reseña al webhook de n8n (moderación por Telegram).
export const REVIEW_WEBHOOK = 'https://n8n.pulsomercados.com/webhook/farofx-review';

export function renderOpinar(brokers) {
  const crumb = breadcrumb([{ label: 'Inicio', url: '/' }, { label: 'Dejar opinión' }]);
  const options = brokers.map((b) => `<option value="${esc(b.name)}"></option>`).join('');
  const mapJs = JSON.stringify(brokers.map((b) => ({ slug: b.slug, name: b.name })));
  const style = `<style>
  .form-card{background:var(--surface,#12130f);border:1px solid var(--line,rgba(255,255,255,.12));border-radius:16px;padding:22px;max-width:660px;color:var(--txt-inv,#f1f1ec)}
  .form-row{margin:0 0 16px}
  .form-row .lbl{display:block;font-weight:600;margin:0 0 6px;color:var(--txt-inv,#f1f1ec)}
  .form-row .hint{color:rgba(255,255,255,.55);font-size:13px;margin:5px 0 0}
  .form-row input[type=text],.form-row textarea,.form-row input[type=file]{width:100%;background:var(--bg,#0c0d0a);border:1px solid var(--line,rgba(255,255,255,.14));border-radius:10px;padding:11px 12px;color:var(--txt-inv,#f1f1ec);caret-color:var(--txt-inv,#f1f1ec);font:inherit;box-sizing:border-box}
  .form-row input::placeholder,.form-row textarea::placeholder{color:rgba(255,255,255,.42)}
  .form-row textarea{min-height:120px;resize:vertical}
  .form-card label{color:var(--txt-inv,#f1f1ec)}
  .stars-input{display:inline-flex;flex-direction:row-reverse;gap:4px;font-size:32px;line-height:1}
  .stars-input input{display:none}
  .stars-input label{color:#5a5f52;cursor:pointer;transition:color .1s}
  .stars-input input:checked ~ label,.stars-input label:hover,.stars-input label:hover ~ label{color:#e6b800}
  .req{color:#ff6b66}
  .hp{position:absolute!important;left:-9999px!important}
  </style>`;
  const main = `${crumb.html}
<section class="block" style="padding-top:14px"><div class="wrap"><div class="article">
  <div class="sec-head"><span class="eyebrow">Opiniones verificadas</span>
  <h1 style="font-family:var(--display);font-size:clamp(26px,3vw,38px);letter-spacing:-.02em;margin:10px 0 12px">Deja tu opinión sobre un broker</h1>
  <p>Solo publicamos opiniones de traders que demuestran haber tenido una cuenta real. Tu opinión pasa por revisión humana antes de aparecer. Puedes adjuntar una prueba (captura de la cuenta, rentabilidades…) que solo verá nuestro equipo de verificación: no se publica.</p></div>
  ${style}
  <form class="form-card" action="${REVIEW_WEBHOOK}" method="post" enctype="multipart/form-data" onsubmit="return farofxReviewSubmit(this)">
    <div class="form-row">
      <label class="lbl" for="broker-input">Broker <span class="req">*</span></label>
      <input type="text" list="brokers-list" id="broker-input" name="broker_name" placeholder="Escribe y elige el broker…" autocomplete="off" required>
      <datalist id="brokers-list">${options}</datalist>
      <input type="hidden" name="broker_slug" id="broker-slug">
      <p class="hint">Empieza a escribir el nombre y selecciónalo de la lista.</p>
    </div>
    <div class="form-row">
      <span class="lbl">Tu puntuación <span class="req">*</span></span>
      <span class="stars-input">
        <input type="radio" id="st5" name="stars" value="5" required><label for="st5" title="5 estrellas">★</label>
        <input type="radio" id="st4" name="stars" value="4"><label for="st4" title="4 estrellas">★</label>
        <input type="radio" id="st3" name="stars" value="3"><label for="st3" title="3 estrellas">★</label>
        <input type="radio" id="st2" name="stars" value="2"><label for="st2" title="2 estrellas">★</label>
        <input type="radio" id="st1" name="stars" value="1"><label for="st1" title="1 estrella">★</label>
      </span>
    </div>
    <div class="form-row">
      <label class="lbl" for="op">Tu opinión <span class="req">*</span></label>
      <textarea id="op" name="opinion" maxlength="1200" placeholder="Cuenta tu experiencia real: retiros, spreads, atención al cliente, incidencias…" required></textarea>
    </div>
    <div class="form-row">
      <label class="lbl" for="alias">Alias a mostrar <span class="req">*</span></label>
      <input type="text" id="alias" name="alias" maxlength="40" placeholder="P. ej. Carlos M." required>
      <p class="hint">No pongas tu nombre completo ni datos personales.</p>
    </div>
    <div class="form-row">
      <label class="lbl" for="contexto">Contexto (opcional)</label>
      <input type="text" id="contexto" name="contexto" maxlength="60" placeholder="P. ej. 8 meses operando · depósito 2.000 €">
    </div>
    <div class="form-row">
      <label class="lbl" for="prueba">Prueba <span class="req">*</span></label>
      <input type="file" id="prueba" name="prueba" accept="image/*,application/pdf">
      <p class="hint"><b>Obligatorio para verificar tu opinión:</b> adjunta una captura de la cuenta, rentabilidades o similar. Solo la ve nuestro equipo de verificación; no se publica.</p>
    </div>
    <div class="form-row">
      <label><input type="checkbox" name="confirmo" value="si" required> Confirmo que he tenido una cuenta real en este broker. <span class="req">*</span></label>
    </div>
    <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <button class="btn btn-seal" type="submit">Enviar opinión</button>
    <p class="hint" style="margin-top:10px">Al enviar, tu opinión pasa a revisión humana. No compartas datos sensibles.</p>
  </form>
</div></div></section>`;
  const scripts = `<script>
  var FAROFX_BROKERS = ${mapJs};
  (function(){
    var input=document.getElementById('broker-input'), hidden=document.getElementById('broker-slug');
    if(!input) return;
    function sync(){ var v=(input.value||'').trim().toLowerCase(); var m=FAROFX_BROKERS.find(function(b){return b.name.toLowerCase()===v;}); hidden.value=m?m.slug:''; }
    input.addEventListener('input',sync); input.addEventListener('change',sync);
  })();
  function farofxReviewSubmit(f){
    var slug=(document.getElementById('broker-slug')||{}).value;
    if(!slug){ alert('Elige un broker de la lista escribiendo su nombre.'); return false; }
    // Si no se adjunta archivo, deshabilitamos el input para NO enviar una parte de fichero vacía
    // (un fichero de 0 bytes rompe la recepción del webhook y provoca el error al publicar).
    var fileInp=document.getElementById('prueba');
    if(fileInp && (!fileInp.files || fileInp.files.length===0)){ fileInp.disabled=true; }
    return true;
  }
  </script>`;
  return layout({ active: '', title: 'Deja tu opinión sobre un broker | FAROFX', description: 'Comparte tu experiencia real con un broker de forex/CFD. Opiniones verificadas con revisión humana antes de publicar.', canonical: '/opinar/', jsonld: [crumb.jsonld], main, scripts });
}

export function renderOpinionRecibida() {
  const main = `
<section class="block" style="padding-top:44px"><div class="wrap"><div class="article" style="text-align:center;max-width:640px;margin:0 auto">
  <div class="answer-box"><b>¡Gracias por tu opinión!</b> La hemos recibido correctamente. Pasará por revisión humana antes de publicarse; si supera la verificación, aparecerá en la ficha del broker.</div>
  <p style="margin-top:20px"><a class="btn btn-seal" href="/#ranking">Volver al ranking</a></p>
</div></div></section>`;
  return layout({ active: '', title: 'Opinión recibida | FAROFX', description: 'Gracias por tu opinión. Pasará por revisión antes de publicarse.', canonical: '/opinion-recibida/', jsonld: [], main });
}
