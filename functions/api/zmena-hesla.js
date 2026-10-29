/* Zmena hesla v účte (ucet.html). Klient zadá súčasné heslo a nové heslo.
   Po zmene ostane prihlásený na tomto zariadení, na ostatných zariadeniach sa odhlási. Žiadny e-mail sa neposiela. */
import { json } from '../_lib/mail.js';
import { prihlaseny, overHeslo, nahodny, hashHesla } from '../_lib/auth.js';

export async function onRequestPost(context) {
  try {
    var env = context.env, d;
    var z = await prihlaseny(env, context.request);
    if (!z) return json({ ok: false, chyba: 'Nie ste prihlásený.' }, 401);
    try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }
    var stare = String(d.stare || ''), nove = String(d.nove || '');
    if (!stare || !(await overHeslo(stare, z.heslo_sol, z.heslo_hash))) return json({ ok: false, pole: 'stare', chyba: 'Súčasné heslo nie je správne.' }, 400);
    if (nove.length < 5) return json({ ok: false, pole: 'nove', chyba: 'Heslo musí mať aspoň 5 znakov.' }, 400);
    var sol = nahodny(16), hash = await hashHesla(nove, sol);
    await env.DB.batch([
      env.DB.prepare('UPDATE ziadosti SET heslo_hash = ?, heslo_sol = ? WHERE id = ?').bind(hash, sol, z.id),
      env.DB.prepare('DELETE FROM relacie WHERE ziadost_id = ? AND token != ?').bind(z.id, z.relacia_token)
    ]);
    return json({ ok: true });
  } catch (e) {
    console.log('zmena-hesla chyba', String(e && e.stack || e));
    return json({ ok: false, chyba: 'Chyba servera.' }, 500);
  }
}
