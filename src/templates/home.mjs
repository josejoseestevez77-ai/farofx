// Home / hub principal: hero + tabla de ranking data-driven + metodología + verificación + modales.
import { layout } from './layout.mjs';
import { SITE, esc, computeScore, scoreColor, riskLabel, fmt, AUDIT_LABELS, podium } from './helpers.mjs';

const EU_UK = ['FCA', 'CySEC', 'CNMV', 'ESMA'];

// Modelo de datos que consume el script del cliente (misma fuente que las fichas).
export function clientModel(brokers) {
  return brokers
    .map((b) => {
      const score = computeScore(b);
      const noEuUk = !b.regulators.some((r) => r.ok && EU_UK.includes(r.authority));
      const regs = b.regulators.filter((r) => r.ok).map((r) => ({ c: r.authority, ok: true }));
      if (noEuUk) regs.unshift({ c: 'none', ok: false });
      return {
        id: b.slug,
        url: `/brokers/${b.slug}/`,
        name: b.name,
        color: b.color,
        init: b.init,
        office: b.office,
        type: b.type,
        deposit: b.depositMin,
        score,
        risk: riskLabel(score),
        reviews: b.reviews.count,
        stars: b.reviews.stars,
        noEuUk,
        regs,
        audit: Object.keys(AUDIT_LABELS).map((k) => [AUDIT_LABELS[k], b.subscores[k]]),
        cross: b.regulators.map((r) => [
          `${r.authority}${r.licenseNumber ? ' · ' + r.licenseNumber : ''}`,
          r.ok,
          r.status.charAt(0).toUpperCase() + r.status.slice(1),
        ]),
        revs: b.reviews.samples.map((s) => ({ u: s.user, s: s.stars, t: s.text, m: s.meta })),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function renderHome(brokers) {
  const model = clientModel(brokers);
  const top = model[0];
  const totalReviews = brokers.reduce((n, b) => n + b.reviews.count, 0);

  // JSON-LD: Organization + ItemList del ranking.
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'FAROFX',
      url: SITE.url + '/',
      description: SITE.description,
      sameAs: SITE.sisters.map((s) => s.url),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Ranking de brokers de forex verificados',
      itemListElement: model.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: SITE.url + b.url,
        name: b.name,
      })),
    },
  ];

  const ledgerLines = top.audit
    .map(
      ([l, v]) =>
        `<div class="ll"><span>${esc(l)}</span><span class="bar"><i style="width:${v * 10}%"></i></span><span class="v">${v.toFixed(1)}</span></div>`
    )
    .join('');

  const main = `
<section class="hero">
  <div class="wrap">
    <div>
      <span class="eyebrow">Análisis independiente de brokers · forex &amp; copytrading</span>
      <h1>Cada nota es <span class="u">auditable</span>.<br>Cada opinión, <span class="u">verificada</span>.</h1>
      <p class="lead">No publicamos reseñas anónimas ni vendemos puntuaciones. Solo opiniones de traders que demostraron tener una cuenta real, y una fórmula de puntuación abierta que cualquiera puede revisar.</p>
      <div class="hero-cta">
        <a class="btn btn-seal" href="#ranking">Ver el ranking →</a>
        <a class="btn btn-ghost" href="/metodologia/">Cómo calculamos la nota</a>
      </div>
      <div class="hero-stats">
        <div class="s"><b id="stat-brokers">0</b><span>brokers analizados</span></div>
        <div class="s"><b id="stat-reviews">0</b><span>opiniones verificadas</span></div>
        <div class="s"><b>0&nbsp;€</b><span>cobrado a brokers</span></div>
      </div>
    </div>
    <div class="ledger" aria-label="Ficha de puntuación auditable de ejemplo">
      <div class="ledger-top">
        <div class="name"><span class="logo" style="width:26px;height:26px;border-radius:7px;background:${top.color};font-size:12px;display:grid;place-items:center;color:#fff;font-family:var(--display);font-weight:700">${esc(top.init)}</span> ${esc(top.name)}</div>
        <span class="vbadge">VERIFICADO</span>
      </div>
      <div class="score-row">
        <div class="score-big">${top.score.toFixed(1)}<span>/10</span></div>
        <div>
          <div class="score-tag">${esc(top.risk)}</div>
          <div class="mono" style="font-size:11px;color:var(--muted-inv)">basado en ${fmt(top.reviews)} cuentas verificadas</div>
        </div>
      </div>
      <div class="ledger-lines">${ledgerLines}</div>
      <div class="ledger-foot">
        <span>ID auditoría · FX-0001-2026</span>
        <a href="/brokers/${top.id}/">ver ficha completa →</a>
      </div>
    </div>
  </div>
</section>

<div class="pillars">
  <div class="wrap">
    <div class="pillar"><div class="n">01</div><h3>Solo opiniones verificadas</h3><p>Una reseña no se publica hasta que el trader demuestra que tuvo cuenta real: extracto, número de cuenta o contraseña <em>investor</em> de solo lectura. Sin pruebas, no se publica.</p></div>
    <div class="pillar"><div class="n">02</div><h3>Puntuación abierta</h3><p>La fórmula es pública y cada nota lleva un ID de auditoría con su desglose. Cualquiera puede reconstruir cómo se llegó a ese número.</p></div>
    <div class="pillar"><div class="n">03</div><h3>Nadie paga su nota</h3><p>Ganamos comisión de afiliado cuando un trader elige un broker, y lo declaramos. Pero ningún broker puede pagar para subir, bajar o borrar su puntuación. Nunca.</p></div>
  </div>
</div>

<section class="block" id="ranking">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">Ranking en vivo</span>
      <h2>Compara brokers por datos, no por marketing</h2>
      <p>Filtra por regulador, tipo de cuenta o depósito mínimo. Pulsa en cualquier broker para ver el desglose auditable de su nota y las opiniones verificadas. <a href="/ranking/" style="color:var(--seal)">Ver el ranking completo →</a></p>
    </div>
    ${podium(model)}
    <div class="filters">
      <input id="f-search" type="text" placeholder="Buscar broker…" oninput="renderRows()">
      <select id="f-reg" onchange="renderRows()">
        <option value="">Regulador: todos</option>
        <option value="CNMV">CNMV (España)</option>
        <option value="FCA">FCA (Reino Unido)</option>
        <option value="CySEC">CySEC (Chipre)</option>
        <option value="ASIC">ASIC (Australia)</option>
        <option value="none">Sin regulación UE/UK</option>
      </select>
      <select id="f-type" onchange="renderRows()">
        <option value="">Tipo: todos</option>
        <option value="forex">Forex / CFD</option>
        <option value="copy">Copytrading</option>
      </select>
      <select id="f-office" onchange="renderRows()">
        <option value="">Oficina: todas</option>
        <option value="verified">Oficina verificada</option>
        <option value="pending">En revisión</option>
        <option value="failed">No superada</option>
      </select>
      <select id="f-sort" onchange="renderRows()">
        <option value="score">Ordenar: nota</option>
        <option value="reviews">Ordenar: nº opiniones</option>
        <option value="deposit">Ordenar: depósito mínimo</option>
      </select>
    </div>
    <div class="table">
      <div class="thead"><span>#</span><span>Broker</span><span>Reguladores</span><span>Oficina</span><span>Opiniones verif.</span><span>Nota</span><span></span></div>
      <div id="rows"></div>
      <div class="empty" id="empty">Ningún broker coincide con esos filtros.</div>
    </div>
  </div>
</section>

<section class="block method" id="metodo">
  <div class="wrap"><div class="grid">
    <div>
      <div class="sec-head"><span class="eyebrow">Metodología abierta</span><h2>Así se calcula cada nota</h2><p>Sin cajas negras. La puntuación de un broker es una media ponderada de cuatro factores medibles, y los pesos están publicados. <a href="/metodologia/" style="color:var(--seal)">Ver metodología completa →</a></p></div>
      <div class="pledge"><b>Compromiso:</b> ningún broker puede pagar para modificar su puntuación, su posición en el ranking ni eliminar opiniones verificadas. Nuestros ingresos vienen de comisiones de afiliado declaradas, que no afectan a la nota.</div>
    </div>
    <div class="formula">
      <div class="w"><b>Regulación verificada</b><em>35%</em></div>
      <div class="w"><span>Licencias cruzadas en vivo con CNMV, FCA, CySEC, ASIC</span></div>
      <div class="w"><b>Velocidad de retirada</b><em>25%</em></div>
      <div class="w"><span>Tiempo medio de pago reportado por cuentas verificadas</span></div>
      <div class="w"><b>Quejas y resolución</b><em>25%</em></div>
      <div class="w"><span>Ratio de incidencias abiertas vs. resueltas</span></div>
      <div class="w"><b>Transparencia de costes</b><em>15%</em></div>
      <div class="w"><span>Spreads, comisiones y condiciones publicadas vs. reales</span></div>
    </div>
  </div></div>
</section>

<section class="block verify" id="verificar">
  <div class="wrap">
    <div class="sec-head"><span class="eyebrow">Opiniones verificadas</span><h2>Por qué nuestras opiniones valen lo que dicen</h2><p>Cualquiera puede inventar reseñas. Por eso cada opinión pasa por un proceso de prueba de cuenta antes de publicarse, y se marca con un sello de verificación que enlaza a la evidencia anonimizada.</p></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h4>Demuestra tu cuenta</h4><p>Subes un extracto, una captura del número de cuenta con depósito, o la contraseña <em>investor</em> de solo lectura de MT4/MT5. Nunca pedimos credenciales con permiso de operar.</p></div>
      <div class="step"><div class="num">2</div><h4>Revisión humana</h4><p>El equipo verifica que la cuenta existió y anonimiza los datos sensibles. Si no se puede comprobar, la opinión no se publica.</p></div>
      <div class="step"><div class="num">3</div><h4>Sello + auditoría</h4><p>La reseña aparece con sello <em>Verificado</em> y un ID que enlaza a la evidencia tratada. Transparente para el lector, privado para ti.</p></div>
    </div>
    <div style="margin-top:28px"><a class="btn btn-seal" href="/opinar/">Dejar mi opinión verificada</a></div>
  </div>
</section>

<section class="block" style="padding-top:0">
  <div class="wrap"><div class="broker-strip">
    <div class="t"><b>¿Eres un broker?</b> Demuestra que tienes una oficina física real. Graba un video continuo de tus instalaciones, lo revisamos contra tu dirección registrada y publicamos el sello <em>Oficina verificada</em> con fecha. Gratis, y no se puede pagar para conseguirlo.</div>
    <button class="btn btn-seal" onclick="openOffice()">Verificar mi oficina</button>
  </div></div>
</section>

${modals()}
`;

  const scripts = `<script>window.__BROKERS__=${JSON.stringify(model)};window.__STAT_REVIEWS__=${totalReviews};</script>
<script src="/home.js" defer></script>`;

  return layout({
    active: '',
    title: 'FAROFX — Opiniones de brokers verificadas. Puntuación auditable.',
    description: SITE.description,
    canonical: '/',
    jsonld,
    main,
    scripts,
  });
}

// Los tres modales (broker, opinión, oficina) — idénticos al diseño.
export function modals() {
  return `
<div class="overlay" id="officeModal" onclick="if(event.target===this)closeOffice()">
  <div class="modal" role="dialog" aria-modal="true" style="max-width:580px">
    <div class="m-head"><button class="x" onclick="closeOffice()" aria-label="Cerrar">✕</button><h3>Verifica la oficina de tu broker</h3><div class="sub">El sello no se compra: se gana enviando una grabación que podamos comprobar contra tu dirección registrada.</div></div>
    <div class="m-body">
      <div id="oform">
        <h5>Qué tiene que mostrar el video para que cuente</h5>
        <ul class="reqlist">
          <li>Plano <b>continuo y sin cortes</b> de recepción, puestos de trabajo y zonas comunes.</li>
          <li>Cartel o documento con la <b>dirección visible</b>, que debe coincidir con la registrada en tu licencia.</li>
          <li>Marca de <b>fecha reciente</b> en pantalla (un periódico del día o la hora del dispositivo).</li>
          <li>Tras revisarlo, programamos una <b>videollamada en vivo</b> breve como segundo factor.</li>
        </ul>
        <div class="vform" style="margin-top:6px">
          <label for="o-name">Nombre del broker</label><input id="o-name" type="text" placeholder="Tu marca registrada">
          <label for="o-addr">Dirección registrada (según licencia)</label><input id="o-addr" type="text" placeholder="Calle, ciudad, país">
          <label for="o-reg">Regulador y nº de licencia</label><input id="o-reg" type="text" placeholder="Ej. CySEC · 234/14">
          <label>Grabación de la oficina (obligatorio)</label>
          <div class="proofbox" onclick="document.getElementById('o-video').click()">🎥 Sube el video continuo de tus instalaciones.<br>Máx. 1 archivo · lo revisa una persona del equipo.<input type="file" id="o-video" accept="video/*" style="display:none" onchange="markVideo(this)"></div>
          <div id="video-name" class="mono" style="font-size:12px;color:var(--verified);margin-top:8px"></div>
          <button class="btn btn-seal" style="margin-top:18px;width:100%" onclick="submitOffice()">Enviar para revisión</button>
        </div>
      </div>
      <div class="ok-msg" id="office-ok">✓ Recibido. Un revisor comprobará el video contra tu dirección registrada y te contactará para la videollamada. Si todo cuadra, publicaremos <b>Oficina verificada</b> con la fecha de hoy.</div>
    </div>
  </div>
</div>

<div class="overlay" id="brokerModal" onclick="if(event.target===this)closeBroker()">
  <div class="modal" role="dialog" aria-modal="true">
    <div class="m-head"><button class="x" onclick="closeBroker()" aria-label="Cerrar">✕</button>
      <div class="top"><div class="logo" id="m-logo">PX</div><div><h3 id="m-name">—</h3><div class="sub" id="m-sub">—</div></div></div>
      <div class="scoreblock"><b id="m-score">0.0</b><span class="vbadge" id="m-risk">—</span><span class="mono" style="font-size:12px;color:var(--muted-inv)" id="m-basis"></span></div>
    </div>
    <div class="m-body">
      <div class="m-section"><h5>Desglose auditable de la nota</h5><div class="ledger-lines audit" id="m-audit"></div></div>
      <div class="m-section"><h5>Verificación regulatoria en vivo</h5><div class="crosscheck" id="m-cross"></div></div>
      <div class="m-section"><h5>Verificación de oficina física</h5><div class="office-detail" id="m-office"></div></div>
      <div class="m-section"><h5>Opiniones verificadas</h5><div id="m-reviews"></div></div>
    </div>
    <div class="m-foot">
      <a class="btn btn-seal" id="m-cta" href="#">Ver ficha completa →</a>
      <a class="btn btn-ghost" style="color:var(--ink);border-color:var(--line-dark)" href="/opinar/">Dejar opinión</a>
      <span class="disc">Enlace de afiliado declarado. Podemos cobrar comisión si abres cuenta; no afecta a la puntuación. El CFD y el copytrading conllevan alto riesgo de pérdida.</span>
    </div>
  </div>
</div>

<div class="overlay" id="verifyModal" onclick="if(event.target===this)closeVerify()">
  <div class="modal" role="dialog" aria-modal="true" style="max-width:560px">
    <div class="m-head"><button class="x" onclick="closeVerify()" aria-label="Cerrar">✕</button><h3>Dejar una opinión verificada</h3><div class="sub">Tu reseña no se publica hasta que validamos que tuviste cuenta real. Así protegemos la confianza de todos.</div></div>
    <div class="m-body">
      <div class="vform" id="vform">
        <label for="v-broker">Broker</label><select id="v-broker"></select>
        <label>Valoración</label>
        <div class="stars-input" id="v-stars" role="radiogroup" aria-label="Valoración"><span data-v="1">★</span><span data-v="2">★</span><span data-v="3">★</span><span data-v="4">★</span><span data-v="5">★</span></div>
        <label for="v-text">Tu experiencia</label><textarea id="v-text" placeholder="¿Cómo fueron los depósitos, retiradas, el soporte, los spreads…?"></textarea>
        <label>Prueba de cuenta (obligatorio)</label>
        <div class="proofbox" onclick="document.getElementById('v-proof').click()">📎 Sube un extracto, captura de tu nº de cuenta o contraseña <em>investor</em> de solo lectura.<br>Nunca pidas ni subas credenciales con permiso de operar.<input type="file" id="v-proof" style="display:none" onchange="markProof(this)"></div>
        <div id="proof-name" class="mono" style="font-size:12px;color:var(--verified);margin-top:8px"></div>
        <button class="btn btn-seal" style="margin-top:18px;width:100%" onclick="submitReview()">Enviar para verificación</button>
      </div>
      <div class="ok-msg" id="ok-msg">✓ Recibido. Tu opinión entrará en cola de verificación. Te avisaremos cuando se publique con el sello <b>Verificado</b>.</div>
    </div>
  </div>
</div>`;
}
