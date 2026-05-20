/*!
 * PWB Engagement Tracker v1.0
 * Drop-in script for any website displaying a PWBUnit.
 *
 * Usage (auto-config via data attributes):
 *   <script src="https://your-api/static/pwb-tracker.js"
 *           data-unit="john-doe"
 *           data-api="https://your-api"></script>
 *
 * Usage (manual config):
 *   <script>window.PWBConfig = { unit: 'john-doe', api: 'https://your-api' };</script>
 *   <script src="https://your-api/static/pwb-tracker.js"></script>
 */
(function () {
  'use strict';

  /* ── Config resolution ─────────────────────────────────────────────────── */
  var cfg = window.PWBConfig || {};
  var script = document.currentScript;
  if (script) {
    cfg.unit = cfg.unit || script.getAttribute('data-unit') || '';
    cfg.api  = cfg.api  || script.getAttribute('data-api')  || '';
  }

  var unitName = cfg.unit;
  var apiBase  = (cfg.api || '').replace(/\/+$/, '');

  if (!unitName || !apiBase) {
    console.warn('[pwb-tracker] Missing data-unit or data-api. Tracker disabled.');
    return;
  }

  var endpoint = apiBase + '/api/v1/pwbunits/' + unitName + '/track-engagement/';

  /* ── Session ID ────────────────────────────────────────────────────────── */
  var SESSION_KEY = 'pwb_session';
  function getSession() {
    try {
      var id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
          return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
        });
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (_) { return ''; }
  }

  /* ── State ─────────────────────────────────────────────────────────────── */
  var loadTime     = Date.now();
  var maxScroll    = 0;
  var sections     = {};
  var links        = [];
  var pdfClicked   = false;
  var emailClicked = false;
  var phoneClicked = false;
  var flushed      = false;

  /* ── Scroll tracking ───────────────────────────────────────────────────── */
  function onScroll() {
    var el  = document.documentElement;
    var pct = el.scrollHeight <= el.clientHeight
      ? 100
      : Math.round((window.scrollY / (el.scrollHeight - el.clientHeight)) * 100);
    if (pct > maxScroll) maxScroll = Math.min(pct, 100);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Section visibility (IntersectionObserver) ─────────────────────────── */
  if (typeof IntersectionObserver !== 'undefined') {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var name = e.target.dataset && e.target.dataset.section;
          if (name) sections[name] = true;
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('[data-section]').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── Click tracking ────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var anchor = e.target && e.target.closest && e.target.closest('a');
    if (!anchor) return;
    var href = anchor.href || '';
    var text = (anchor.textContent || anchor.title || '').trim().slice(0, 100);

    if (href.endsWith('.pdf') || href.includes('fl_attachment') || anchor.download) pdfClicked = true;
    if (href.startsWith('mailto:')) emailClicked = true;
    if (href.startsWith('tel:'))    phoneClicked = true;
    if (text && links.length < 20 && links.indexOf(text) === -1) links.push(text);
  }, true);

  /* ── Connection type ───────────────────────────────────────────────────── */
  function getConnectionType() {
    try {
      var conn = navigator.connection;
      if (!conn) return 'unknown';
      var t = conn.effectiveType || '';
      return ['4g', '3g', '2g', 'slow-2g'].indexOf(t) !== -1 ? t : 'unknown';
    } catch (_) { return 'unknown'; }
  }

  /* ── Payload ───────────────────────────────────────────────────────────── */
  function buildPayload() {
    return JSON.stringify({
      session_id:      getSession(),
      referrer:        document.referrer || '',
      page_url:        window.location.href,
      time_on_page:    Math.round((Date.now() - loadTime) / 1000),
      scroll_depth:    maxScroll,
      screen_width:    window.screen.width,
      screen_height:   window.screen.height,
      viewport_width:  window.innerWidth,
      viewport_height: window.innerHeight,
      language:        navigator.language || '',
      timezone:        (Intl && Intl.DateTimeFormat
                         ? Intl.DateTimeFormat().resolvedOptions().timeZone
                         : '') || '',
      color_scheme:    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
                         ? 'dark' : 'light',
      connection_type: getConnectionType(),
      pdf_downloaded:  pdfClicked,
      email_clicked:   emailClicked,
      phone_clicked:   phoneClicked,
      links_clicked:   links.slice(),
      sections_viewed: Object.keys(sections),
    });
  }

  /* ── Flush ─────────────────────────────────────────────────────────────── */
  function flush() {
    if (flushed) return;
    flushed = true;
    var payload = buildPayload();
    var blob    = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon(endpoint, blob)) return;
    // Fallback: sync XHR (runs during unload)
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, false); // synchronous
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    } catch (_) {}
  }

  window.addEventListener('pagehide', flush);

  // Early flush after 45 s (captures partial data for long sessions)
  setTimeout(function () {
    if (flushed) return;
    flushed = true; // mark true so pagehide won't double-send
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildPayload(),
      keepalive: true,
    }).catch(function () {});
  }, 45000);

})();
