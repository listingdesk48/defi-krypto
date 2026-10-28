/* Odstúpenie od zmluvy: overí číslo žiadosti v databáze a či bol uhradený poplatok.
   Neprezradí žiadne iné údaje zo žiadosti. */
import { json } from '../_lib/mail.js';

export async function onRequestPost(context) {
  var env = context.env, d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }
  var cislo = String(d.cislo || '').replace(/\s+/g, '').toUpperCase();
  if (!/^[0-9A-F]{10}$/.test(cislo)) return json({ ok: false, chyba: 'Neplatné číslo žiadosti.' }, 400);
  /* TESTOVACIE číslo 0000000000: správa sa ako žiadosť s uhradeným poplatkom. Pred spustením odstrániť (aj v odstupenie.js). */
  if (cislo === '0000000000') return json({ ok: true, stav: 'uhradeny', dni: 3, zostava: 27 });
  /* TESTOVACIE číslo 0000000001: žiadosť po uplynutí lehoty na odstúpenie. Pred spustením odstrániť. */
  if (cislo === '0000000001') return json({ ok: true, stav: 'po_lehote', uhradene: '1. 10. 2026', zverejnene: '1. 10. 2026', lehota_do: '15. 10. 2026' });
  var z = await env.DB.prepare('SELECT poplatok_uhradeny, poplatok_uhradeny_o, zverejnene_o, zverejnene_do FROM ziadosti WHERE id LIKE ? LIMIT 1').bind(cislo.toLowerCase() + '%').first();
  if (!z) return json({ ok: true, stav: 'nenajdena' });
  if (!z.poplatok_uhradeny) return json({ ok: true, stav: 'neuhradeny' });
  var leh = lehota(new Date(z.poplatok_uhradeny_o || z.zverejnene_o || Date.now()).getTime());
  if (leh.uplynula) return json({ ok: true, stav: 'po_lehote', uhradene: leh.uhradene, zverejnene: z.zverejnene_o ? txtDen(denSk(new Date(z.zverejnene_o).getTime())) : null, lehota_do: leh.do });
  /* Koľko dní je inzerát zverejnený a koľko dní zverejnenia zostáva */
  var DEN = 86400000, teraz = Date.now(), od = new Date(z.zverejnene_o || z.poplatok_uhradeny_o || teraz).getTime(), dok = z.zverejnene_do ? new Date(z.zverejnene_do).getTime() : NaN;
  var dni = Math.max(1, Math.ceil((teraz - od) / DEN)), zostava = isNaN(dok) ? null : Math.max(0, Math.ceil((dok - teraz) / DEN));
  return json({ ok: true, stav: 'uhradeny', dni: dni, zostava: zostava });
}

/* Lehota na odstúpenie: 14 kalendárnych dní od uzavretia zmluvy. Zmluva vzniká úhradou poplatku (VOP čl. V ods. 4, čl. VIII ods. 1).
   Posledný deň lehoty = deň úhrady + 14 dní (slovenský čas). */
function denSk(ms) { var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bratislava', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ms)), m = {}; p.forEach(function (x) { m[x.type] = x.value; }); return Date.UTC(+m.year, +m.month - 1, +m.day); }
function txtDen(utc) { var d = new Date(utc); return d.getUTCDate() + '. ' + (d.getUTCMonth() + 1) + '. ' + d.getUTCFullYear(); }
function lehota(uhradeneMs) { var den = denSk(uhradeneMs), posledny = den + 14 * 86400000; return { uplynula: denSk(Date.now()) > posledny, uhradene: txtDen(den), do: txtDen(posledny) }; }
