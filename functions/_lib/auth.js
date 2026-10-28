/* Účty: heslá, prihlasovacie relácie (cookie), náhodné tokeny. Dáta sú v D1 (binding DB). */

var COOKIE = 'kvelto_r';
var DNI = 365; /* prihlásenie platí rok a pri každej návšteve sa obnoví */

function hex(buf) { return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
export function nahodny(bajty) { var a = new Uint8Array(bajty || 32); crypto.getRandomValues(a); return hex(a.buffer); }

export async function hashHesla(heslo, solHex) {
  var sol = new Uint8Array(solHex.match(/../g).map(function (h) { return parseInt(h, 16); }));
  var key = await crypto.subtle.importKey('raw', new TextEncoder().encode(heslo), 'PBKDF2', false, ['deriveBits']);
  var bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sol, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return hex(bits);
}
export async function overHeslo(heslo, solHex, hashHex) {
  var h = await hashHesla(heslo, solHex);
  if (h.length !== hashHex.length) return false;
  var r = 0; for (var i = 0; i < h.length; i++) r |= h.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return r === 0;
}

export function teraz() { return new Date().toISOString(); }

function cookieHodnota(request) {
  var c = request.headers.get('Cookie') || '';
  var m = c.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([a-f0-9]+)'));
  return m ? m[1] : null;
}
export function cookieNastav(token) {
  return COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + (DNI * 86400);
}
export function cookieZmaz() { return COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'; }

export async function vytvorRelaciu(env, ziadostId) {
  var token = nahodny(32);
  var plati = new Date(Date.now() + DNI * 86400000).toISOString();
  await env.DB.prepare('INSERT INTO relacie (token, ziadost_id, vytvorene, plati_do) VALUES (?, ?, ?, ?)').bind(token, ziadostId, teraz(), plati).run();
  return token;
}
export async function zrusRelaciu(env, request) {
  var t = cookieHodnota(request);
  if (t) await env.DB.prepare('DELETE FROM relacie WHERE token = ?').bind(t).run();
}
/* Vráti riadok žiadosti prihláseného klienta alebo null. */
export async function prihlaseny(env, request) {
  var t = cookieHodnota(request);
  if (!t) return null;
  var r = await env.DB.prepare('SELECT z.*, r.plati_do AS relacia_plati_do FROM relacie r JOIN ziadosti z ON z.id = r.ziadost_id WHERE r.token = ? AND r.plati_do > ?').bind(t, teraz()).first();
  if (!r) return null;
  /* Obnova: ak relácii ostáva menej ako 300 dní, predĺži sa na rok. Cookie obnoví /api/ja. */
  if (new Date(r.relacia_plati_do).getTime() < Date.now() + 300 * 86400000) {
    await env.DB.prepare('UPDATE relacie SET plati_do = ? WHERE token = ?').bind(new Date(Date.now() + DNI * 86400000).toISOString(), t).run();
  }
  r.relacia_token = t;
  return r;
}
