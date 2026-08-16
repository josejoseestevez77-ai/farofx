// Página dedicada de RANKING de Veredict FX.
// Reutiliza el modelo de cliente, el podio, los modales y home.js de la home,
// y añade el argumento de visibilidad para brokers + el sello "Veredict FX Verificado".
import { layout } from './layout.mjs';
import { SITE, esc, podium, sealBadge } from './helpers.mjs';
import { clientModel, modals } from './home.mjs';

export function renderRanking(brokers) {
  const model = clientModel(brokers);
  const totalReviews = brokers.reduce((n, b) => n + b.reviews.count, 0);
  const top = model[0];

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Ranking de brokers de forex verificados 2026',
      itemListElement: model.map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.url + b.url, name: b.name })),
    },
  ];

  const main = `
<section class="block" style="padding-top:14px"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow">Ranking en vivo · 2026</span>
    <h1 style="font-family:var(--display);font-size:clamp(28px,3.4vw,42px);letter-spacing:-.02em;margin:10px 0 12px">Ranking de brokers de forex y CFD</h1>
    <p style="max-width:64ch">${model.length} brokers analizados y ordenados por un <a href="/metodologia/" style="color:var(--seal)">score auditable</a> (regulación 35%, retirada 25%, quejas 25%, costes 15%) y ${totalReviews.toLocaleString('es-ES')} opiniones verificadas. Ningún broker paga por su posición.</p>
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
</div></section>

<section class="block" id="para-brokers" style="background:var(--bg-alt,#0f110c)"><div class="wrap">
  <style>#para-brokers .pb-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:34px;align-items:center}@media(max-width:820px){#para-brokers .pb-grid{grid-template-columns:1fr;gap:24px}}</style>
  <div class="pb-grid">
    <div>
      <span class="eyebrow">Para brokers</span>
      <h2 style="font-family:var(--display);font-size:clamp(22px,2.6vw,32px);letter-spacing:-.02em;margin:10px 0 14px;color:var(--txt-inv,#f1f1ec)">Así te ve el mundo cuando estás en Veredict FX</h2>
      <p style="color:var(--muted-inv,#b9b9ad);max-width:52ch">Cada broker del ranking tiene su <b>ficha propia</b>, optimizada para aparecer en Google cuando alguien busca <span class="mono">"tu marca + opiniones"</span> o <span class="mono">"tu marca review"</span>. En lugar de que el usuario encuentre un foro con quejas sueltas, encuentra una ficha seria, con tu regulación verificada, tus datos y tu nota auditable.</p>
      <ul class="pc" style="margin-top:16px">
        <li class="pro" style="color:var(--txt-inv,#f1f1ec)">Página propia indexable: apareces cuando te buscan por nombre.</li>
        <li class="pro" style="color:var(--txt-inv,#f1f1ec)">Nota auditable y transparente: credibilidad, no publicidad.</li>
        <li class="pro" style="color:var(--txt-inv,#f1f1ec)">Opiniones verificadas de traders reales, sin ruido anónimo.</li>
        <li class="pro" style="color:var(--txt-inv,#f1f1ec)">Sello de posición que puedes exhibir en tu propia web.</li>
      </ul>
      <div style="margin-top:22px"><a class="btn btn-seal" href="mailto:contacto@veredictfx.com?subject=Quiero%20estar%20en%20el%20ranking%20de%20Veredict%20FX">Quiero estar en el ranking →</a></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
      <div style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-inv,#b9b9ad);font-weight:600">El sello que puedes mostrar</div>
      ${sealBadge(1)}
      ${sealBadge(3)}
      ${sealBadge(null)}
      <div style="font-size:12.5px;color:var(--muted-inv,#9a9a8f);max-width:34ch;margin-top:4px">El sello refleja tu posición real en el ranking. Sube o baja según la evidencia; no se compra.</div>
    </div>
  </div>
</div></section>

${modals()}
`;

  const scripts = `<script>window.__BROKERS__=${JSON.stringify(model)};window.__STAT_REVIEWS__=${totalReviews};</script>
<script src="/home.js" defer></script>`;

  return layout({
    active: 'ranking',
    title: 'Ranking de brokers de forex y CFD 2026 | Veredict FX',
    description: 'Ranking independiente de brokers de forex y CFD, ordenado por un score auditable y opiniones verificadas. Ningún broker paga por su posición.',
    canonical: '/ranking/',
    jsonld,
    main,
    scripts,
  });
}
