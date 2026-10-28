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
  var zhoda = 'Kontrolu sa nepodarilo vykonať';
  try {
    var z = await env.DB.prepare('SELECT email, poplatok_uhradeny FROM ziadosti WHERE id LIKE ? LIMIT 1').bind(cislo.toLowerCase() + '%').first();
    if (!z) return json({ ok: false, chyba: 'Žiadosť s týmto číslom sme nenašli.' }, 400);
    if (!z.poplatok_uhradeny) return json({ ok: false, chyba: 'Poplatok k tejto žiadosti nebol uhradený.' }, 400);
    zhoda = String(z.email || '').toLowerCase() === email.toLowerCase() ? 'Číslo žiadosti a e-mail sa zhodujú, poplatok uhradený' : 'Poplatok uhradený, ale e-mail sa nezhoduje so žiadosťou';
  } catch (e) { console.log('odstupenie kontrola', String(e)); }

  /* Bitcoinová adresa na vrátenie platby: povinná pri uhradenom poplatku, len bc1 s platným kontrolným súčtom */
  var btc = poplatok === 'Áno' ? String(d.btc || '').trim().toLowerCase() : '';
  if (poplatok === 'Áno' && !btcOk(btc)) return json({ ok: false, chyba: 'Neplatná bitcoinová adresa.' }, 400);

  var kedy = datumSk(new Date());

  /* 1. Majiteľovi cez Cloudflare (zadarmo, mimo limitu Resend) */
  var v1 = await posliMajitelovi(context, 'Odstúpenie od zmluvy · ' + meno + ' ' + priez,
    'Odstúpenie od zmluvy\nPodané: ' + kedy + '\nČíslo žiadosti: ' + cislo + ' (' + zhoda + ')\nMeno: ' + meno + ' ' + priez + '\nE-mail: ' + email + '\nTelefón: ' + tel + '\nPoplatok za službu uhradený: ' + poplatok + (btc ? '\nBitcoinová adresa na vrátenie platby: ' + btc : ''),
    '<p><b>Odstúpenie od zmluvy</b><br>Podané: ' + esc(kedy) + '</p>' +
      '<p><b>Číslo žiadosti:</b> ' + esc(cislo) + '<br><b>Kontrola v databáze:</b> ' + esc(zhoda) + '</p>' +
      '<p><b>Meno:</b> ' + esc(meno) + ' ' + esc(priez) + '<br>' +
      '<b>E-mail:</b> ' + esc(email) + '<br>' +
      '<b>Telefón:</b> ' + esc(tel) + '<br>' +
      '<b>Poplatok za službu uhradený:</b> ' + esc(poplatok) + (btc ? '<br><b>Bitcoinová adresa na vrátenie platby:</b> ' + esc(btc) : '') + '</p>', email);
  if (!v1.ok) return json({ ok: false, chyba: 'Odoslanie zlyhalo.' }, 502);

  /* Potvrdenie klientovi sa neposiela (rozhodnutie 13.10.2026, šetrenie limitu Resend). */
  return json({ ok: true });
}

function bPoly(v) { var G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3], c = 1; for (var i = 0; i < v.length; i++) { var b = c >>> 25; c = ((c & 0x1ffffff) << 5) ^ v[i]; for (var j = 0; j < 5; j++) if ((b >>> j) & 1) c ^= G[j]; } return c >>> 0; }
function btcOk(a) { if (a.slice(0, 3) !== 'bc1' || a.length < 14 || a.length > 90) return false; var CH = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l', d = [], i; for (i = 3; i < a.length; i++) { var x = CH.indexOf(a[i]); if (x < 0) return false; d.push(x); } if (d.length < 8) return false; var ver = d[0]; if (bPoly([3, 3, 0, 2, 3].concat(d)) !== (ver === 0 ? 1 : 0x2bc830a3)) return false; var pr = d.slice(1, d.length - 6), acc = 0, bits = 0, n = 0; for (i = 0; i < pr.length; i++) { acc = ((acc << 5) | pr[i]) & 0xfff; bits += 5; while (bits >= 8) { bits -= 8; n++; } } if (bits >= 5 || ((acc << (8 - bits)) & 255)) return false; if (ver > 16 || n < 2 || n > 40) return false; if (ver === 0 && n !== 20 && n !== 32) return false; return true; }
