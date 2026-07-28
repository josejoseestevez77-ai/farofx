/* FAROFX home — ranking interactivo. Datos inyectados por el build en window.__BROKERS__ */
(function () {
  const BROKERS = window.__BROKERS__ || [];
  const $ = (s) => document.querySelector(s);
  const rowsEl = $('#rows'), emptyEl = $('#empty');
  const MEDALS = ['🥇', '🥈', '🥉'];

  const scoreColor = (s) => (s >= 8 ? '#2FA36B' : s >= 6.5 ? '#C8A24B' : s >= 5 ? '#d08a2c' : '#D9534F');

  const OFFICE = {
    verified: { cls: 'ob-verified', ico: '🏢', label: 'Verificada' },
    pending: { cls: 'ob-pending', ico: '🕓', label: 'En revisión' },
    none: { cls: 'ob-none', ico: '–', label: 'No verificada' },
    failed: { cls: 'ob-failed', ico: '⚠', label: 'No superada' },
  };
  // Escapa texto para meterlo con seguridad dentro de un atributo HTML (title="…").
  // Sin esto, unas comillas en el texto romperían el atributo y desbordarían la tabla.
  const escAttr = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const officeBadge = (b) => {
    const o = OFFICE[b.office.status];
    return `<div class="office"><span class="ob ${o.cls}" title="${escAttr(b.office.method)}">${o.ico} ${o.label}</span></div>`;
  };

  window.renderRows = function () {
    const q = $('#f-search').value.toLowerCase().trim();
    const reg = $('#f-reg').value, type = $('#f-type').value, sort = $('#f-sort').value, office = $('#f-office').value;
    let list = BROKERS.filter((b) => {
      if (q && !b.name.toLowerCase().includes(q)) return false;
      if (type && !b.type.includes(type)) return false;
      if (office && b.office.status !== office) return false;
      if (reg) {
        if (reg === 'none') { if (!b.noEuUk) return false; }
        else if (!b.regs.some((r) => r.c === reg && r.ok)) return false;
      }
      return true;
    });
    list.sort((a, b) => (sort === 'reviews' ? b.reviews - a.reviews : sort === 'deposit' ? a.deposit - b.deposit : b.score - a.score));
    rowsEl.innerHTML = '';
    emptyEl.style.display = list.length ? 'none' : 'block';
    list.forEach((b, i) => {
      const regs = b.regs
        .map((r) => (r.c === 'none' ? `<span class="reg warn">Sin reg. UE/UK</span>` : `<span class="reg">${r.c}</span>`))
        .join('');
      const medal = i < 3 ? `<span class="medal">${MEDALS[i]}</span>` : '';
      const el = document.createElement('div');
      el.className = 'row';
      el.tabIndex = 0;
      el.onclick = (e) => { if (e.target.closest('.more')) return; openBroker(b.id); };
      el.onkeydown = (e) => { if (e.key === 'Enter') openBroker(b.id); };
      el.innerHTML = `
        <span class="rank">${medal}${String(i + 1).padStart(2, '0')}</span>
        <div class="bk"><span class="logo" style="background:${b.color}">${b.init}</span>
          <span class="meta"><b>${b.name}</b><span>Depósito mín. ${b.deposit}€ · ${b.type.includes('copy') ? 'Copytrading' : 'Forex/CFD'}</span></span></div>
        <div class="regs">${regs}</div>
        ${officeBadge(b)}
        <div class="vcount"><b>${b.reviews.toLocaleString('es')}</b><span>verificadas</span></div>
        <span class="scorepill"><span class="dot" style="background:${scoreColor(b.score)}"></span>${b.score.toFixed(1)}</span>
        <a class="more" href="${b.url}">Ver análisis</a>`;
      rowsEl.appendChild(el);
    });
  };

  window.openBroker = function (id) {
    const b = BROKERS.find((x) => x.id === id); if (!b) return;
    $('#m-logo').textContent = b.init; $('#m-logo').style.background = b.color;
    $('#m-name').textContent = b.name;
    $('#m-sub').textContent = `Depósito mínimo ${b.deposit}€ · ${b.type.includes('copy') ? 'Forex + Copytrading' : 'Forex / CFD'}`;
    $('#m-score').textContent = b.score.toFixed(1); $('#m-score').style.color = scoreColor(b.score);
    $('#m-risk').textContent = b.risk;
    $('#m-basis').textContent = `· ${b.reviews.toLocaleString('es')} cuentas verificadas`;
    $('#m-audit').innerHTML = b.audit.map(([l, v]) =>
      `<div class="ll"><span>${l}</span><span class="bar"><i style="width:${v * 10}%;background:${scoreColor(v)}"></i></span><span class="v">${v.toFixed(1)}</span></div>`).join('');
    $('#m-cross').innerHTML = b.cross.map(([l, ok, note]) =>
      `<div class="cc"><span class="l">${l}</span><span class="stat ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✕'} ${note}</span></div>`).join('');
    const o = OFFICE[b.office.status];
    $('#m-office').className = 'office-detail v-' + b.office.status;
    $('#m-office').innerHTML = `<span class="ic">${o.ico}</span><div class="ot"><b>${o.label} · ${b.office.date}</b><span>${b.office.method}</span></div>`;
    $('#m-reviews').innerHTML = b.revs.map((r) =>
      `<div class="rev"><div class="rh"><span class="who"><span class="vbadge">VERIF.</span>${r.u}</span><span class="stars">${'★'.repeat(r.s)}${'☆'.repeat(5 - r.s)}</span></div><p>${r.t}</p><div class="rmeta">${r.m.map((m) => `<span>· ${m}</span>`).join('')}</div></div>`).join('');
    $('#m-cta').href = b.url;
    $('#brokerModal').classList.add('open'); document.body.style.overflow = 'hidden';
  };
  window.closeBroker = function () { $('#brokerModal').classList.remove('open'); document.body.style.overflow = ''; };

  window.openVerify = function () {
    $('#v-broker').innerHTML = BROKERS.map((b) => `<option>${b.name}</option>`).join('');
    $('#vform').style.display = 'block'; $('#ok-msg').style.display = 'none';
    $('#verifyModal').classList.add('open'); document.body.style.overflow = 'hidden';
  };
  window.closeVerify = function () { $('#verifyModal').classList.remove('open'); document.body.style.overflow = ''; };
  window.markProof = function (inp) { if (inp.files[0]) $('#proof-name').textContent = '✓ ' + inp.files[0].name + ' adjuntado'; };
  window.submitReview = function () { $('#vform').style.display = 'none'; $('#ok-msg').style.display = 'block'; };

  window.openOffice = function () {
    $('#oform').style.display = 'block'; $('#office-ok').style.display = 'none'; $('#video-name').textContent = '';
    $('#officeModal').classList.add('open'); document.body.style.overflow = 'hidden';
  };
  window.closeOffice = function () { $('#officeModal').classList.remove('open'); document.body.style.overflow = ''; };
  window.markVideo = function (inp) { if (inp.files[0]) $('#video-name').textContent = '✓ ' + inp.files[0].name + ' adjuntado'; };
  window.submitOffice = function () { $('#oform').style.display = 'none'; $('#office-ok').style.display = 'block'; };

  let starVal = 0;
  const starsEl = document.getElementById('v-stars');
  if (starsEl) starsEl.addEventListener('click', (e) => {
    if (e.target.dataset.v) { starVal = +e.target.dataset.v; [...starsEl.children].forEach((s) => s.classList.toggle('on', +s.dataset.v <= starVal)); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeBroker(); closeVerify(); closeOffice(); } });

  function countUp(el, target, suffix = '') {
    if (!el) return;
    let n = 0; const step = Math.max(1, Math.ceil(target / 40));
    const t = setInterval(() => { n += step; if (n >= target) { n = target; clearInterval(t); } el.textContent = n.toLocaleString('es') + suffix; }, 20);
  }
  window.addEventListener('load', () => {
    renderRows();
    countUp(document.getElementById('stat-brokers'), BROKERS.length);
    countUp(document.getElementById('stat-reviews'), window.__STAT_REVIEWS__ || 0);
  });
})();

})();
