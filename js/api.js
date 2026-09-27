/* =====================================================================
   SIPETIK — api.js : komunikasi ke GAS REST API (fetch + text/plain)
   ===================================================================== */
const API = (() => {
  const cfg = window.SIPETIK_CONFIG || {};
  const KEY_TOKEN = 'sipetik_token';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* mode privat */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  let token = store.get(KEY_TOKEN) || '';
  let inflight = 0;
  const mem = {};

  function configured() { return !!cfg.GAS_URL && !/GANTI_DENGAN/.test(cfg.GAS_URL); }
  function loading(d) {
    inflight = Math.max(0, inflight + d);
    let el = document.getElementById('loader-line');
    if (inflight && !el) { el = document.createElement('div'); el.id = 'loader-line'; el.className = 'loader-line'; document.body.appendChild(el); }
    if (!inflight && el) el.remove();
  }

  /**
   * Panggil aksi backend. opt: { silent, toast, noAuthRedirect }
   * POST wajib Content-Type text/plain agar tidak memicu preflight CORS yang diblok GAS.
   */
  async function call(action, data = {}, opt = {}) {
    if (!configured()) { const e = new Error('GAS_URL belum diisi di js/config.js'); e.code = 'CONFIG'; throw e; }
    loading(1);
    try {
      let res;
      try {
        res = await fetch(cfg.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token, data }), redirect: 'follow' });
      } catch (e) { throw new Error('Tidak dapat menghubungi server. Periksa koneksi internet / URL Apps Script.'); }
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { throw new Error('Respon server bukan JSON. Pastikan deployment Apps Script "Who has access: Anyone" dan URL berakhiran /exec.'); }
      if (!json.success) {
        const err = new Error(json.message || 'Terjadi kesalahan.'); err.code = json.code;
        if (json.code === 'AUTH' && !opt.noAuthRedirect) { setToken(''); if (window.App) App.onAuthExpired(json.message); }
        throw err;
      }
      if (opt.toast && json.message) UI.toast(json.message, 'ok');
      return json.data;
    } catch (e) {
      if (!opt.silent && e.code !== 'AUTH') UI.toast(e.message, 'err');
      throw e;
    } finally { loading(-1); }
  }

  async function ping() {
    if (!configured()) return { ok: false, config: false };
    try {
      const r = await fetch(cfg.GAS_URL + (cfg.GAS_URL.indexOf('?') > -1 ? '&' : '?') + 'action=ping', { redirect: 'follow' });
      const j = await r.json();
      return { ok: !!j.success, data: j.data || {}, config: true };
    } catch (e) { return { ok: false, config: true, error: e.message }; }
  }

  function setToken(t) { token = t || ''; if (t) store.set(KEY_TOKEN, t); else store.del(KEY_TOKEN); }

  /** stale-while-revalidate: render cache dulu (instan), lalu data segar */
  async function swr(key, action, data, render) {
    const k = 'swr:' + key;
    let cached = mem[k];
    if (!cached) { try { const raw = sessionStorage.getItem(k); if (raw) cached = JSON.parse(raw); } catch (e) {} }
    if (cached) render(cached, true);
    const d = await call(action, data, { silent: !!cached });
    mem[k] = d;
    try { sessionStorage.setItem(k, JSON.stringify(d)); } catch (e) {}
    render(d, false);
    return d;
  }
  function clearCache() { Object.keys(mem).forEach((k) => delete mem[k]); try { Object.keys(sessionStorage).filter((k) => k.startsWith('swr:')).forEach((k) => sessionStorage.removeItem(k)); } catch (e) {} }

  return { call, ping, swr, clearCache, configured, setToken, get token() { return token; }, store, cfg };
})();
