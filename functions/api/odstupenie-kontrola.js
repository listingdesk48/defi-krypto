/* Odstúpenie od zmluvy: overí číslo žiadosti v databáze a či bol uhradený poplatok.
   Neprezradí žiadne iné údaje zo žiadosti. */
import { json } from '../_lib/mail.js';

export async function onRequestPost(context) {
  var env = context.env, d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }
  var cislo = String(d.cislo || '').replace(/\s+/g, '').toUpperCase();
  if (!/^[0-9A-F]{10}$/.test(cislo)) return json({ ok: false, chyba: 'Neplatné číslo žiadosti.' }, 400);
  /* TESTOVACIE číslo 0000000000: správa sa ako žiadosť s uhradeným poplatkom. Pred spustením odstrániť (aj v odstupenie.js). */
  if (cislo === '0000000000') return json({ ok: true, stav: 'uhradeny' });
  var z = await env.DB.prepare('SELECT poplatok_uhradeny FROM ziadosti WHERE id LIKE ? LIMIT 1').bind(cislo.toLowerCase() + '%').first();
  return json({ ok: true, stav: !z ? 'nenajdena' : (z.poplatok_uhradeny ? 'uhradeny' : 'neuhradeny') });
}
