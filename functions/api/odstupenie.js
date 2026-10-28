/* Odstúpenie od zmluvy (odstupenie-od-zmluvy.html): pošle údaje majiteľovi cez Cloudflare. */
import { esc, txt, json, jeMail, posliMajitelovi } from '../_lib/mail.js';

function datumSk(d) {
  var p = new Intl.DateTimeFormat('sk-SK', { timeZone: 'Europe/Bratislava', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).formatToParts(d);
  var m = {}; p.forEach(function (x) { m[x.type] = x.value; });
  return m.day + '. ' + m.month + '. ' + m.year + ' o ' + m.hour + ':' + m.minute;
}

export async function onRequestPost(context) {
  var env = context.env;
  if (!env.UPOZORNENIE) return json({ ok: false, chyba: 'Server nie je nastavený.' }, 500);

  var d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }

  var meno = txt(d.meno, 80), priez = txt(d.priezvisko, 80), email = txt(d.email, 160),
      tel = txt(d.telefon, 40), poplatok = txt(d.poplatok, 10);

  if (meno.length < 2 || priez.length < 2 || !jeMail(email) || (poplatok !== 'Áno' && poplatok !== 'Nie') || d.suhlas !== true)
    return json({ ok: false, chyba: 'Chýbajú údaje.' }, 400);

  /* Číslo žiadosti: povinné, 10 znakov 0-9 a A-F. Žiadosť musí existovať a mať uhradený poplatok (bez úhrady zmluva nevznikla). Nezhoda e-mailu odstúpenie neblokuje, iba sa uvedie v e-maile majiteľovi. */
  var cislo = String(d.cislo || '').replace(/\s+/g, '').toUpperCase();
  if (!/^[0-9A-F]{10}$/.test(cislo)) return json({ ok: false, chyba: 'Neplatné číslo žiadosti.' }, 400);
  var zhoda = 'Kontrolu sa nepodarilo vykonať', zz = null;
  /* TESTOVACIE číslo 0000000000: preskočí kontrolu v databáze. Pred spustením odstrániť (aj v odstupenie-kontrola.js). */
  if (cislo === '0000000001') return json({ ok: false, chyba: 'Lehota na odstúpenie uplynula.' }, 400);
  if (cislo === '0000000000') { zhoda = 'TESTOVACIE ČÍSLO, nie je to skutočná žiadosť'; zz = { platba_sat: 450000, platba_eur: 300, platba_txid: 'testovacia-platba', poplatok_uhradeny_o: new Date(Date.now() - 2 * 86400000).toISOString(), zverejnene_o: new Date(Date.now() - 2 * 86400000).toISOString(), zverejnene_do: new Date(Date.now() + 27 * 86400000).toISOString() }; }
  else try {
    var z = await env.DB.prepare('SELECT email, poplatok_uhradeny, poplatok_uhradeny_o, zverejnene_o, zverejnene_do, platba_sat, platba_eur, platba_txid FROM ziadosti WHERE id LIKE ? LIMIT 1').bind(cislo.toLowerCase() + '%').first();
    if (!z) return json({ ok: false, chyba: 'Žiadosť s týmto číslom sme nenašli.' }, 400);
    if (!z.poplatok_uhradeny) return json({ ok: false, chyba: 'Poplatok k tejto žiadosti nebol uhradený.' }, 400);
    if (lehota(new Date(z.poplatok_uhradeny_o || z.zverejnene_o || Date.now()).getTime()).uplynula) return json({ ok: false, chyba: 'Lehota na odstúpenie uplynula.' }, 400);
    zz = z;
    zhoda = String(z.email || '').toLowerCase() === email.toLowerCase() ? 'Číslo žiadosti a e-mail sa zhodujú, poplatok uhradený' : 'Poplatok uhradený, ale e-mail sa nezhoduje so žiadosťou';
  } catch (e) { console.log('odstupenie kontrola', String(e)); }

  /* Bitcoinová adresa na vrátenie platby: povinná pri uhradenom poplatku, len bc1 s platným kontrolným súčtom */
  var btc = poplatok === 'Áno' ? String(d.btc || '').trim().toLowerCase() : '';
  if (poplatok === 'Áno' && !btcOk(btc)) return json({ ok: false, chyba: 'Neplatná bitcoinová adresa.' }, 400);

  var kedy = datumSk(new Date());

  /* Prepočet vrátenia podľa VOP čl. VIII ods. 5: zadávateľ platí len za dni skutočného zverejnenia, zvyšok sa vracia */
  var vr = null;
  try { if (zz && zz.platba_sat) vr = await vypocet(zz); } catch (e) { console.log('odstupenie vypocet', String(e)); }
  var vrTxt = vr ? vr.text : '\n\nVRÁTENIE PLATBY\nÚdaje o platbe sa nepodarilo načítať, vrátenie treba prepočítať ručne.';
  var vrHtml = vr ? vr.html : '<p><b>Vrátenie platby</b><br>Údaje o platbe sa nepodarilo načítať, vrátenie treba prepočítať ručne.</p>';

  /* 1. Majiteľovi cez Cloudflare (zadarmo, mimo limitu Resend) */
  var v1 = await posliMajitelovi(context, 'Odstúpenie od zmluvy · ' + meno + ' ' + priez,
    'Odstúpenie od zmluvy\nPodané: ' + kedy + '\nČíslo žiadosti: ' + cislo + ' (' + zhoda + ')\nMeno: ' + meno + ' ' + priez + '\nE-mail: ' + email + '\nTelefón: ' + tel + '\nPoplatok za službu uhradený: ' + poplatok + (btc ? '\nBitcoinová adresa na vrátenie platby: ' + btc : '') + vrTxt,
    '<p><b>Odstúpenie od zmluvy</b><br>Podané: ' + esc(kedy) + '</p>' +
      '<p><b>Číslo žiadosti:</b> ' + esc(cislo) + '<br><b>Kontrola v databáze:</b> ' + esc(zhoda) + '</p>' +
      '<p><b>Meno:</b> ' + esc(meno) + ' ' + esc(priez) + '<br>' +
      '<b>E-mail:</b> ' + esc(email) + '<br>' +
      '<b>Telefón:</b> ' + esc(tel) + '<br>' +
      '<b>Poplatok za službu uhradený:</b> ' + esc(poplatok) + (btc ? '<br><b>Bitcoinová adresa na vrátenie platby:</b> ' + esc(btc) : '') + '</p>' + vrHtml, email);
  if (!v1.ok) return json({ ok: false, chyba: 'Odoslanie zlyhalo.' }, 502);

  /* Potvrdenie klientovi sa neposiela (rozhodnutie 13.10.2026, šetrenie limitu Resend). */
  return json({ ok: true });
}

function bPoly(v) { var G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3], c = 1; for (var i = 0; i < v.length; i++) { var b = c >>> 25; c = ((c & 0x1ffffff) << 5) ^ v[i]; for (var j = 0; j < 5; j++) if ((b >>> j) & 1) c ^= G[j]; } return c >>> 0; }
function btcOk(a) { if (a.slice(0, 3) !== 'bc1' || a.length < 14 || a.length > 90) return false; var CH = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l', d = [], i; for (i = 3; i < a.length; i++) { var x = CH.indexOf(a[i]); if (x < 0) return false; d.push(x); } if (d.length < 8) return false; var ver = d[0]; if (bPoly([3, 3, 0, 2, 3].concat(d)) !== (ver === 0 ? 1 : 0x2bc830a3)) return false; var pr = d.slice(1, d.length - 6), acc = 0, bits = 0, n = 0; for (i = 0; i < pr.length; i++) { acc = ((acc << 5) | pr[i]) & 0xfff; bits += 5; while (bits >= 8) { bits -= 8; n++; } } if (bits >= 5 || ((acc << (8 - bits)) & 255)) return false; if (ver > 16 || n < 2 || n > 40) return false; if (ver === 0 && n !== 20 && n !== 32) return false; return true; }

/* Lehota na odstúpenie: 14 kalendárnych dní od uzavretia zmluvy. Zmluva vzniká úhradou poplatku (VOP čl. V ods. 4, čl. VIII ods. 1).
   Posledný deň lehoty = deň úhrady + 14 dní (slovenský čas). */
function denSk(ms) { var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bratislava', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ms)), m = {}; p.forEach(function (x) { m[x.type] = x.value; }); return Date.UTC(+m.year, +m.month - 1, +m.day); }
function txtDen(utc) { var d = new Date(utc); return d.getUTCDate() + '. ' + (d.getUTCMonth() + 1) + '. ' + d.getUTCFullYear(); }
function lehota(uhradeneMs) { var den = denSk(uhradeneMs), posledny = den + 14 * 86400000; return { uplynula: denSk(Date.now()) > posledny, uhradene: txtDen(den), do: txtDen(posledny) }; }

/* ===== Prepočet vrátenia platby ===== */
async function kurzTeraz() {
  try { var r = await fetch('https://mempool.space/api/v1/prices'); if (r.ok) { var c = await r.json(); if (c && c.EUR) return c.EUR; } } catch (e) {}
  try { var g = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur'); if (g.ok) { var j = await g.json(); return j.bitcoin.eur; } } catch (e) {}
  return null;
}
function eurF(n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1] + ' €'; }
function btcF(sat) { return (sat / 1e8).toFixed(8).replace('.', ',') + ' BTC (' + String(Math.round(sat)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' sat)'; }
async function vypocet(z) {
  var DEN = 86400000, sat = +z.platba_sat, eur = +z.platba_eur || 0, teraz = Date.now();
  var od = new Date(z.zverejnene_o || z.poplatok_uhradeny_o).getTime(), dok = new Date(z.zverejnene_do).getTime();
  var spolu = Math.max(1, Math.round((dok - od) / DEN)), dni = Math.min(spolu, Math.max(1, Math.ceil((teraz - od) / DEN))), zost = spolu - dni;
  var podiel = zost / spolu, kurzU = eur ? eur / (sat / 1e8) : null, kurzT = await kurzTeraz();
  var satV = Math.floor(sat * podiel), eurV = eur * podiel;
  var r = [
    ['Uhradené', btcF(sat)],
    ['Hodnota v čase úhrady', eur ? eurF(eur) + ' (kurz ' + eurF(kurzU) + ' za 1 BTC)' : 'neznáma'],
    ['Dátum úhrady', datumSk(new Date(z.poplatok_uhradeny_o || od))],
    ['Transakcia', z.platba_txid || 'neznáma'],
    ['Zverejnené', dni + ' z ' + spolu + ' dní'],
    ['Na vrátenie pripadá', zost + ' z ' + spolu + ' dní (' + (podiel * 100).toFixed(1).replace('.', ',') + ' %)'],
    ['Možnosť A: vrátiť rovnaký podiel BTC', btcF(satV) + (kurzT ? ', dnes približne ' + eurF(satV / 1e8 * kurzT) : '')],
    ['Možnosť B: vrátiť hodnotu v eurách', eurF(eurV) + (kurzT ? ', dnes je to ' + btcF(Math.floor(eurV / kurzT * 1e8)) : '')],
    ['Dnešný kurz', kurzT ? eurF(kurzT) + ' za 1 BTC' : 'nepodarilo sa načítať']
  ];
  var pozn = 'Ktorá možnosť platí, rozhoduje VOP čl. IV ods. 5. Táto veta je vo VOP zatiaľ nedoplnená. Vrátiť do 14 dní od doručenia odstúpenia (VOP čl. VIII ods. 5).';
  return {
    text: '\n\nVRÁTENIE PLATBY\n' + r.map(function (x) { return x[0] + ': ' + x[1]; }).join('\n') + '\n' + pozn,
    html: '<p><b>Vrátenie platby</b></p><table cellpadding="6" style="border-collapse:collapse;font-size:14px">' + r.map(function (x) { return '<tr><td style="color:#666;border-bottom:1px solid #eee">' + esc(x[0]) + '</td><td style="border-bottom:1px solid #eee"><b>' + esc(x[1]) + '</b></td></tr>'; }).join('') + '</table><p style="color:#666;font-size:13px">' + esc(pozn) + '</p>'
  };
}
