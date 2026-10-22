/* X Unfollow Manager - license module (original implementation).
 * Shared by popup / background / content script.
 * Key format: XUM1.<base64url(payload)>.<base64url(sig)>
 * payload = { h: boundHandle|"", p: plan, exp: timestampMs, cap: dailyCap }
 * Authoritative check is server-side (/api/validate); local checks are
 * format + expiry + install binding. Offline grace: 7 days.
 */
(function (root) {
  'use strict';

  var GRACE_MS = 7 * 864e5;

  function b64urlDecode(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }

  async function sha256hex(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  async function getState() {
    var d = await chrome.storage.local.get(['xum']);
    return d.xum || {};
  }
  async function setState(patch) {
    var s = await getState();
    var next = {};
    for (var k in s) next[k] = s[k];
    for (var k2 in patch) next[k2] = patch[k2];
    await chrome.storage.local.set({ xum: next });
  }

  function parseKey(key) {
    var m = /^XUM1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(key || '').trim());
    if (!m) return null;
    try {
      var payload = JSON.parse(b64urlDecode(m[1]));
      if (!payload || typeof payload.exp !== 'number') return null;
      return { payload: payload, sig: m[2], raw: String(key).trim() };
    } catch (e) { return null; }
  }

  function localCheck(parsed) {
    if (!parsed) return { ok: false, reason: 'bad-format' };
    if (parsed.payload.exp < Date.now()) return { ok: false, reason: 'expired' };
    return { ok: true };
  }

  async function getInstallId() {
    var s = await getState();
    if (s.installId) return s.installId;
    var id = 'i' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await setState({ installId: id });
    return id;
  }

  async function validateRemote(serverUrl, key, handle) {
    var res = await fetch(String(serverUrl).replace(/\/$/, '') + '/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key, handle: handle })
    });
    if (!res.ok) throw new Error('server-' + res.status);
    return res.json();
  }

  async function writeLicense(record) {
    var installId = await getInstallId();
    var token = await sha256hex(installId + '|' + record.key + '|' + (record.boundHandle || ''));
    var lic = {
      key: record.key,
      pro: true,
      plan: record.plan || 'pro',
      exp: record.exp,
      cap: record.cap || 500,
      boundHandle: (record.boundHandle || '').toLowerCase(),
      validatedAt: Date.now(),
      installId: installId,
      token: token
    };
    await setState({ license: lic });
    return lic;
  }

  // Activate a key. handle = current X handle (lowercase, without @).
  async function activate(key, serverUrl, handle) {
    var parsed = parseKey(key);
    var lc = localCheck(parsed);
    if (!lc.ok) return lc;
    var h = String(parsed.payload.h || handle || '').replace(/^@/, '').toLowerCase();
    /* No handle known (e.g. activated with no X tab open): proceed anyway
     * and let the server apply its own handling — validateRemote sends
     * the key with an empty handle and the response decides. */
    if (!serverUrl) return { ok: false, reason: 'no-server' };

    var remote = null;
    try {
      remote = await validateRemote(serverUrl, key, h);
    } catch (e) {
      // offline: honor grace period from last good validation
      var s = await getState();
      var lic = s.license || {};
      if (lic.key === String(key).trim() && lic.pro && lic.validatedAt &&
          (Date.now() - lic.validatedAt) < GRACE_MS && lic.exp > Date.now()) {
        return { ok: true, offline: true, plan: lic.plan, exp: lic.exp };
      }
      return { ok: false, reason: 'server-unreachable' };
    }
    if (!remote || !remote.ok) {
      return {
        ok: false,
        reason: (remote && remote.reason) || 'rejected',
        boundHandle: (remote && remote.boundHandle) || parsed.payload.h || ''
      };
    }
    var lic2 = await writeLicense({
      key: String(key).trim(),
      plan: remote.plan,
      exp: remote.exp,
      cap: remote.cap,
      boundHandle: remote.boundHandle || h
    });
    return { ok: true, plan: lic2.plan, exp: lic2.exp };
  }

  async function isPro() {
    var s = await getState();
    var lic = s.license;
    if (!lic || !lic.pro) return false;
    if (lic.exp < Date.now()) return false;
    if ((Date.now() - (lic.validatedAt || 0)) > GRACE_MS) return false; // needs revalidation
    var expect = await sha256hex(lic.installId + '|' + lic.key + '|' + (lic.boundHandle || ''));
    if (expect !== lic.token) return false;
    return true;
  }

  async function getLicense() {
    var s = await getState();
    return s.license || null;
  }

  async function clear() {
    await setState({ license: null });
  }

  // Silent revalidation (used by background alarm). Returns true if still pro.
  async function revalidate(serverUrl) {
    var s = await getState();
    var lic = s.license;
    if (!lic || !lic.pro || !serverUrl) return false;
    try {
      var remote = await validateRemote(serverUrl, lic.key, lic.boundHandle);
      if (remote && remote.ok) {
        await writeLicense({ key: lic.key, plan: remote.plan, exp: remote.exp, cap: remote.cap, boundHandle: remote.boundHandle || lic.boundHandle });
        return true;
      }
      await setState({ license: null });
      return false;
    } catch (e) {
      return (Date.now() - (lic.validatedAt || 0)) < GRACE_MS && lic.exp > Date.now();
    }
  }

  root.XUMLicense = {
    parseKey: parseKey,
    activate: activate,
    isPro: isPro,
    getLicense: getLicense,
    clear: clear,
    revalidate: revalidate,
    _getState: getState,
    _setState: setState
  };
})(typeof window !== 'undefined' ? window : self);
