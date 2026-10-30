/* Nová žiadosť po zrušení (ucet.html): prihlásený klient so zrušenou žiadosťou zadá novú sumu a dĺžku.
   Údaje o ňom ostávajú, žiadosť sa posúdi znova ako prvýkrát. */
import { esc, json, posli, skontrolujLimit, upozorni } from '../_lib/mail.js';
import { prihlaseny } from '../_lib/auth.js';
import { naplanujSchvalenie, datumSk } from '../_lib/cas.js';

var UROK = 0.05, POPLATOK = 300, LEHOTA_DNI = 5;
function splatka(s, m) { var r = UROK / 12; return s * r / (1 - Math.pow(1 + r, -m)); }
function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function fmt2(n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1]; }

export async function onRequestPost(context) {
  try { return await spracuj(context); } catch (e) {
    console.log('nova-ziadost chyba', String(e && e.stack || e));
    upozorni(context, 'Chyba pri novej žiadosti', String(e && e.stack || e));
    return json({ ok: false, chyba: 'Chyba servera: ' + String(e && e.message || e).slice(0, 200) }, 500);
  }
}

async function spracuj(context) {
  var env = context.env;
  var z = await prihlaseny(env, context.request);
  if (!z) return json({ ok: false, chyba: 'Nie ste prihlásený.' }, 401);

  /* Nová žiadosť sa dá podať len po zrušení (poplatok neuhradený do 5 dní od schválenia). */
  var zrusene = false;
  if (z.stav === 'zrusene') zrusene = true;
  else if (z.stav === 'schvalene' && !z.poplatok_uhradeny && z.schvalene_o && new Date(z.schvalene_o).getTime() + LEHOTA_DNI * 86400000 <= Date.now()) zrusene = true;
  /* Zmena sumy alebo doby (26.10.2026): kým poplatok nie je uhradený, klient môže sumu a dobu zmeniť.
     Žiadosť sa posúdi znova a príde nový e-mail o schválení. Po úhrade poplatku sa už nič nemení (inzerát je pevný). */
  var zmena = !zrusene && !z.poplatok_uhradeny && (z.stav === 'posudzuje' || z.stav === 'schvalene');
  if (!zrusene && !zmena) return json({ ok: false, chyba: 'Inzerát je už zaplatený, sumu a dobu nie je možné zmeniť.' }, 400);

  var d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }
  var suma = parseInt(d.suma, 10), doba = parseInt(d.doba, 10);
  if (!(suma >= 1000 && suma <= 250000)) return json({ ok: false, chyba: 'Suma musí byť od 1 000 € do 250 000 €.' }, 400);
  if (!(doba >= 12 && doba <= 300)) return json({ ok: false, chyba: 'Doba musí byť od 1 do 25 rokov.' }, 400);

  var sp = Math.round(splatka(suma, doba) * 100) / 100, celkom = Math.round(sp * doba * 100) / 100; /* bez poplatku za inzerát, podľa OP čl. IV ods. 3 */
  var podane = new Date(), schvalitO = naplanujSchvalenie(podane);
  var udaje = {}; try { udaje = JSON.parse(z.udaje || '{}') || {}; } catch (e) { udaje = {}; }
  udaje.zkSuma = String(suma); udaje.zkDoba = String(doba);

  await env.DB.prepare(
    "UPDATE ziadosti SET suma = ?, doba = ?, splatka = ?, celkom = ?, udaje = ?, vytvorene = ?, stav = 'posudzuje', schvalit_o = ?, " +
    "schvalene_o = NULL, schvalena_suma = NULL, email_schvalenie_odoslany = 0, poplatok_uhradeny = 0, poplatok_uhradeny_o = NULL WHERE id = ?"
  ).bind(suma, doba, sp, celkom, JSON.stringify(udaje), zmena ? z.vytvorene : podane.toISOString(), schvalitO.toISOString(), z.id).run(); /* pri zmene ostáva pôvodný dátum podania */

  /* Potvrdenie prijatia klientovi je VYPNUTÉ (19.10.2026), rovnako ako pri prvej žiadosti. Klient dostane len e-mail o schválení. Zapnúť: POTVRDENIE = true. */
  var POTVRDENIE = false;
  var v = !POTVRDENIE ? { ok: true } : await posli(env, { to: [z.email], reply_to: env.KONTAKT_PRIJEMCA,
    subject: 'Žiadosť prijatá',
    html: '<p>Dobrý deň, ' + esc(z.meno) + ',</p>' +
      '<p>Vašu žiadosť sme prijali.<br><b>Dátum a čas podania:</b> ' + esc(datumSk(podane)) + '</p>' +
      '<p>Rozhodnutie o Vašej žiadosti Vám odošleme na tento e-mail do niekoľkých hodín. Skontrolujte prosím aj zložku Spam alebo Hromadné e-maily.</p>' +
      '<p><b>Vaša žiadosť</b><br>Suma: ' + fmt(suma) + ' €<br>Doba: ' + rokyText(doba) + '<br>Mesačne: ' + fmt2(sp) + ' €<br>Celkovo zaplatíte: ' + fmt2(celkom) + ' €</p>' +
      '<p>Stav žiadosti vidíte po prihlásení vo svojom účte: <a href="https://kvelto.com/ucet">kvelto.com/ucet</a><br>Prihlasovací e-mail: ' + esc(z.email) + '</p>'  });
  if (!v.ok) skontrolujLimit(context, v, 'potvrdenie novej žiadosti', z.email);

  /* Upozornenie majiteľovi o novej žiadosti je vypnuté (nechce ho). */

  return json({ ok: true });
}

function rokyText(m) { var r = Math.round(m / 12); return r + (r === 1 ? ' rok' : r < 5 ? ' roky' : ' rokov'); }
