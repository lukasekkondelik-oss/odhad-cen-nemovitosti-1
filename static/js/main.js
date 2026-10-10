(function () {
  // ---- mobilní menu ----
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // ---- cookies / souhlas ----
  var KEY = 'cookie_consent';
  var banner = document.getElementById('cookie-banner');
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadAnalytics() {
    var id = window.__GA_ID;
    if (!id || document.getElementById('ga-script')) return;
    var s = document.createElement('script');
    s.id = 'ga-script'; s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }
  var c = stored();
  if (c === 'accept') loadAnalytics();
  if (banner && !c) banner.hidden = false;
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cookie],[data-cookie-settings]');
    if (!t) return;
    if (t.hasAttribute('data-cookie-settings')) { if (banner) banner.hidden = false; return; }
    var v = t.getAttribute('data-cookie');
    store(v);
    if (banner) banner.hidden = true;
    if (v === 'accept') loadAnalytics();
  });

  // ---- formulář ----
  var form = document.getElementById('lead-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type=submit]');
  form.elements.ts.value = String(Date.now());

  function setStatus(msg, cls) { status.textContent = msg; status.className = 'form-status ' + (cls || ''); }
  function valid() {
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      var good = el.type === 'checkbox' ? el.checked : el.checkValidity() && el.value.trim() !== '';
      var wrap = el.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', !good);
      if (!good) ok = false;
    });
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valid()) { setStatus('Zkontrolujte prosím vyplněná pole.', 'err'); return; }
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data.consent = form.elements.consent.checked;
    btn.disabled = true; btn.textContent = form.dataset.sending; setStatus('');
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; });
    }).then(function (res) {
      if (res.ok) { window.location.href = '/dekujeme/'; return; }
      throw new Error(res.j.error || 'err');
    }).catch(function () {
      setStatus(form.dataset.error, 'err');
      btn.disabled = false; btn.textContent = form.dataset.submit;
    });
  });
})();
