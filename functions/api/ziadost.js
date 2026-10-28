/* Žiadosť o úver (index.html): uloží žiadosť, založí účet, prihlási klienta,
   pošle potvrdenie prijatia a naplánuje e-mail o schválení. */
import { esc, txt, json, jeMail, posli, skontrolujLimit, upozorni } from '../_lib/mail.js';
import { nahodny, hashHesla, vytvorRelaciu, cookieNastav, teraz } from '../_lib/auth.js';
import { naplanujSchvalenie, datumSk } from '../_lib/cas.js';
import { pridelAdresu } from '../_lib/adresa.js';

var UROK = 0.05, POPLATOK = 300;
function splatka(s, m) { var r = UROK / 12; return s * r / (1 - Math.pow(1 + r, -m)); }
function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function fmt2(n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1]; }

export async function onRequestPost(context) {
  try { return await spracuj(context); } catch (e) {
    console.log('ziadost chyba', String(e && e.stack || e));
    upozorni(context, 'Chyba pri ukladaní žiadosti', String(e && e.stack || e));
    return json({ ok: false, chyba: 'Chyba servera: ' + String(e && e.message || e).slice(0, 200) }, 500);
  }
}

async function spracuj(context) {
  var env = context.env;
  if (!env.DB || !env.RESEND_API_KEY) return json({ ok: false, chyba: 'Server nie je nastavený.' }, 500);
  var d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }

  var u = (d.udaje && typeof d.udaje === 'object') ? d.udaje : {};
  var email = txt(u.zkEmail, 160).toLowerCase(), heslo = String(d.heslo || '');
  var meno = txt(u.zkMeno, 80), priez = txt(u.zkPriezvisko, 80);
  var suma = parseInt(u.zkSuma, 10), doba = parseInt(u.zkDoba, 10);
  var tel = (txt(u.zkTelKod, 10) + ' ' + txt(u.zkTel, 30)).trim();

  var chyby = [];
  if (!jeMail(email)) chyby.push('e-mail');
  if (heslo.length < 5) chyby.push('heslo');
  if (meno.length < 2) chyby.push('meno');
  if (priez.length < 2) chyby.push('priezvisko');
  if (!(suma > 0 && suma <= 250000)) chyby.push('výška úveru');
  if (!(doba >= 12 && doba <= 300)) chyby.push('dĺžka splácania');
  if (!txt(u.zkUcelSel || u.zkUcel, 80)) chyby.push('účel');
  if (txt(u.zkOpis, 600).length < 10) chyby.push('popis účelu (aspoň 10 znakov)');
  if (d.suhlas !== true) chyby.push('súhlasy');
  if (chyby.length) return json({ ok: false, chyba: 'Chýba alebo je nesprávne: ' + chyby.join(', ') + '.' }, 400);

  var existuje = await env.DB.prepare('SELECT id FROM ziadosti WHERE email = ?').bind(email).first();
  if (existuje) return json({ ok: false, chyba: 'Na tento e-mail už máte účet. Prihláste sa prosím.', kod: 'existuje' }, 409);

  var sp = Math.round(splatka(suma, doba) * 100) / 100, celkom = Math.round(sp * doba * 100) / 100; /* bez poplatku za inzerát, podľa OP čl. VI ods. 3 */
  var id = nahodny(12), sol = nahodny(16), hash = await hashHesla(heslo, sol);
  var podane = new Date(), schvalitO = naplanujSchvalenie(podane);
  var udaje = Object.assign({}, u); delete udaje.zkHeslo;
  /* Podpis sa už neukladá (15.10.2026): nie je právne potrebný a zaberal väčšinu miesta v databáze. */
  var podpis = null;

  await env.DB.prepare(
    'INSERT INTO ziadosti (id, vytvorene, email, heslo_hash, heslo_sol, meno, priezvisko, telefon, suma, doba, splatka, celkom, udaje, podpis, stav, schvalit_o) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, podane.toISOString(), email, hash, sol, meno, priez, tel, suma, doba, sp, celkom, JSON.stringify(udaje), podpis, 'posudzuje', schvalitO.toISOString()).run();

  var token = await vytvorRelaciu(env, id);

  /* Každý nový účet dostane hneď svoju bitcoinovú adresu na úhradu poplatku. Chyba tu nesmie zastaviť žiadosť. */
  try { await pridelAdresu(env, id); } catch (e) { console.log('adresa', e && e.message); }

  /* Potvrdenie prijatia klientovi je VYPNUTÉ (13.10.2026, šetrenie limitu Resend). Zapnúť: POTVRDENIE = true. */
  var POTVRDENIE = false;
  var v = !POTVRDENIE ? { ok: true } : await posli(env, { to: [email], reply_to: env.KONTAKT_PRIJEMCA,
    subject: 'Žiadosť prijatá',
    html: '<p>Dobrý deň, ' + esc(meno) + ',</p>' +
      '<p>Vašu žiadosť sme prijali.<br><b>Dátum a čas podania:</b> ' + esc(datumSk(podane)) + '</p>' +
      '<p>Rozhodnutie o Vašej žiadosti Vám odošleme na tento e-mail do niekoľkých hodín. Skontrolujte prosím aj zložku Spam alebo Hromadné e-maily.</p>' +
      '<p><b>Vaša žiadosť</b><br>Suma: ' + fmt(suma) + ' €<br>Doba: ' + rokyText(doba) + '<br>Mesačne: ' + fmt2(sp) + ' €<br>Celkovo zaplatíte: ' + fmt2(celkom) + ' €</p>' +
      '<p>Stav žiadosti vidíte po prihlásení vo svojom účte: <a href="https://kvelto.com/ucet.html">kvelto.com/ucet.html</a><br>Prihlasovací e-mail: ' + esc(email) + '</p>'  });
  if (!v.ok) skontrolujLimit(context, v, 'potvrdenie žiadosti', email);

  /* Upozornenie majiteľovi o novej žiadosti je vypnuté (nechce ho). */

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieNastav(token) } });
}

function rokyText(m) { var r = Math.round(m / 12); return r + (r === 1 ? ' rok' : r < 5 ? ' roky' : ' rokov'); }
