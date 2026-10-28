import { txt, json } from '../_lib/mail.js';
import { nahodny, hashHesla, teraz, vytvorRelaciu, cookieNastav } from '../_lib/auth.js';
export async function onRequestPost(context) {
  var env = context.env, d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false }, 400); }
  var t = txt(d.t, 80), heslo = String(d.heslo || '');
  if (heslo.length < 6) return json({ ok: false, chyba: 'Heslo musí mať aspoň 6 znakov.' }, 400);
  var r = await env.DB.prepare('SELECT ziadost_id FROM resety WHERE token = ? AND pouzity = 0 AND plati_do > ?').bind(t, teraz()).first();
  if (!r) return json({ ok: false, chyba: 'Odkaz už neplatí. Vyžiadajte si nový.' }, 400);
  var sol = nahodny(16), hash = await hashHesla(heslo, sol);
  await env.DB.batch([
    env.DB.prepare('UPDATE ziadosti SET heslo_hash = ?, heslo_sol = ? WHERE id = ?').bind(hash, sol, r.ziadost_id),
    env.DB.prepare('UPDATE resety SET pouzity = 1 WHERE token = ?').bind(t),
    env.DB.prepare('DELETE FROM relacie WHERE ziadost_id = ?').bind(r.ziadost_id)
  ]);
  var token = await vytvorRelaciu(env, r.ziadost_id);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieNastav(token) } });
}
