import { txt, json, jeMail } from '../_lib/mail.js';
import { overHeslo, vytvorRelaciu, cookieNastav } from '../_lib/auth.js';

export async function onRequestPost(context) {
  var env = context.env, d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false }, 400); }
  var email = txt(d.email, 160).toLowerCase(), heslo = String(d.heslo || '');
  var zle = json({ ok: false, chyba: 'Nesprávny e-mail alebo heslo.' }, 401);
  if (!jeMail(email) || !heslo) return zle;
  var z = await env.DB.prepare('SELECT id, heslo_hash, heslo_sol FROM ziadosti WHERE email = ?').bind(email).first();
  if (!z || !(await overHeslo(heslo, z.heslo_sol, z.heslo_hash))) return zle;
  var token = await vytvorRelaciu(env, z.id);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieNastav(token) } });
}
