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

  /* Prepočet vrátenia podľa VOP čl. IV ods. 5 a čl. VIII ods. 5 */
  var vr = null;
  try { if (zz && zz.platba_sat) vr = await vypocet(zz); } catch (e) { console.log('odstupenie vypocet', String(e)); }
  var m = emailMajitel({ kedy: kedy, cislo: cislo, zhoda: zhoda, meno: meno, priez: priez, email: email, tel: tel, btc: btc, vr: vr, lehotaDo: txtDen(denSk(Date.now()) + 14 * 86400000) });

  /* 1. Majiteľovi cez Cloudflare (zadarmo, mimo limitu Resend) */
  var v1 = await posliMajitelovi(context, 'Odstúpenie od zmluvy · ' + meno + ' ' + priez, m.text, m.html, email);
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

/* ===== Prepočet vrátenia platby (VOP čl. IV ods. 5: vracia sa pomerný podiel z prijatého množstva BTC, kurz eura sa neberie do úvahy) ===== */
async function kurzTeraz() {
  try { var r = await fetch('https://mempool.space/api/v1/prices'); if (r.ok) { var c = await r.json(); if (c && c.EUR) return c.EUR; } } catch (e) {}
  try { var g = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur'); if (g.ok) { var j = await g.json(); return j.bitcoin.eur; } } catch (e) {}
  return null;
}
function eurF(n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1] + ' €'; }
function dn(n) { return n + ' ' + (n === 1 ? 'deň' : (n >= 2 && n <= 4 ? 'dni' : 'dní')); }
function zv(n) { return n === 1 ? 'zvyšný' : (n >= 2 && n <= 4 ? 'zvyšné' : 'zvyšných'); }
function btcF(sat) { return (sat / 1e8).toFixed(8).replace('.', ',') + ' BTC'; }
async function vypocet(z) {
  var DEN = 86400000, sat = +z.platba_sat, eur = +z.platba_eur || 0, teraz = Date.now();
  var od = new Date(z.zverejnene_o || z.poplatok_uhradeny_o).getTime(), dok = new Date(z.zverejnene_do).getTime();
  var spolu = Math.max(1, Math.round((dok - od) / DEN)), dni = Math.min(spolu, Math.max(1, Math.ceil((teraz - od) / DEN))), zost = spolu - dni;
  var satV = Math.floor(sat * zost / spolu), kurzT = await kurzTeraz();
  return { sat: sat, satV: satV, satP: sat - satV, eur: eur, kurzU: eur ? eur / (sat / 1e8) : null, kurzT: kurzT, spolu: spolu, dni: dni, zost: zost,
    uhradene: datumSk(new Date(z.poplatok_uhradeny_o || od)), txid: z.platba_txid || 'neznáma' };
}
/* E-mail majiteľovi o odstúpení. Na vrátenie je rozhodujúca iba suma v BTC. */
function emailMajitel(d) {
  var v = d.vr, T = [], H = '';
  var F = 'font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;';
  function riad(a, b, silne) { return '<tr><td style="padding:9px 0;color:#6b6b70;border-bottom:1px solid #eee;vertical-align:top;width:48%">' + esc(a) + '</td><td style="padding:9px 0 9px 16px;border-bottom:1px solid #eee;text-align:right;overflow-wrap:anywhere;' + (silne ? 'font-weight:700;color:#1d1d1f' : 'color:#1d1d1f') + '">' + esc(b) + '</td></tr>'; }
  function nad(t) { return '<p style="margin:28px 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a89373;font-weight:700">' + esc(t) + '</p>'; }
  H += '<div style="' + F + 'max-width:560px;color:#1d1d1f;font-size:15px;line-height:1.5">';
  H += '<p style="margin:0;font-size:22px;font-weight:800">Odstúpenie od zmluvy</p><p style="margin:4px 0 0;color:#6b6b70">Podané ' + esc(d.kedy) + '</p>';
  T.push('ODSTÚPENIE OD ZMLUVY', 'Podané ' + d.kedy, '');
  if (v) {
    H += '<div style="margin:22px 0 0;padding:22px 24px;border-radius:14px;background:#f6f1e7">' +
      '<p style="margin:0;font-size:13px;color:#7a6a52;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Vrátiť klientovi</p>' +
      '<p style="margin:6px 0 0;font-size:30px;font-weight:800;letter-spacing:-.02em">' + esc(btcF(v.satV)) + '</p>' +
      '<p style="margin:12px 0 0;color:#6b6b70;font-size:13px">na bitcoinovú adresu</p><p style="margin:2px 0 0;font-family:Menlo,Consolas,monospace;font-size:13px;word-break:break-all">' + esc(d.btc || 'neuvedená') + '</p>' +
      '<p style="margin:12px 0 0;color:#6b6b70;font-size:13px">najneskôr do ' + esc(d.lehotaDo) + ' (14 dní od doručenia odstúpenia)</p></div>';
    T.push('VRÁTIŤ KLIENTOVI: ' + btcF(v.satV), 'Na bitcoinovú adresu: ' + (d.btc || 'neuvedená'), 'Najneskôr do ' + d.lehotaDo + ' (14 dní od doručenia odstúpenia)', '');
    H += nad('Výpočet') + '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
      riad('Klient zaplatil', btcF(v.sat), true) + riad('Dátum úhrady', v.uhradene) + riad('Transakcia', v.txid) +
      riad('Inzerát bol zverejnený', v.dni + ' z ' + v.spolu + ' dní') + riad('Za ' + dn(v.dni) + ' zverejnenia ostáva nám', btcF(v.satP)) +
      riad('Za ' + zv(v.zost) + ' ' + dn(v.zost) + ' sa vracia', btcF(v.satV), true) + '</table>' +
      '<p style="margin:8px 0 0;color:#6b6b70;font-size:12px">Vracia sa pomerný podiel z prijatého množstva BTC podľa VOP čl. IV ods. 5 a čl. VIII ods. 5.</p>';
    T.push('VÝPOČET', 'Klient zaplatil: ' + btcF(v.sat), 'Dátum úhrady: ' + v.uhradene, 'Transakcia: ' + v.txid, 'Inzerát bol zverejnený: ' + v.dni + ' z ' + v.spolu + ' dní',
      'Za ' + dn(v.dni) + ' zverejnenia ostáva nám: ' + btcF(v.satP), 'Za ' + zv(v.zost) + ' ' + dn(v.zost) + ' sa vracia: ' + btcF(v.satV), '');
  } else {
    H += '<div style="margin:22px 0 0;padding:18px 22px;border-radius:14px;background:#fbeaea;color:#8a1f1f">Údaje o platbe sa nepodarilo načítať. Sumu na vrátenie treba prepočítať ručne.</div>';
    T.push('Údaje o platbe sa nepodarilo načítať. Sumu na vrátenie treba prepočítať ručne.', '');
  }
  H += nad('Klient') + '<table style="width:100%;border-collapse:collapse;font-size:14px">' + riad('Číslo žiadosti', d.cislo, true) + riad('Kontrola v databáze', d.zhoda) +
    riad('Meno', d.meno + ' ' + d.priez) + riad('E-mail', d.email) + riad('Telefón', d.tel) + '</table>';
  T.push('KLIENT', 'Číslo žiadosti: ' + d.cislo + ' (' + d.zhoda + ')', 'Meno: ' + d.meno + ' ' + d.priez, 'E-mail: ' + d.email, 'Telefón: ' + d.tel, '');
  if (v) {
    H += nad('Len pre orientáciu') + '<div style="padding:14px 18px;border-radius:12px;background:#f6f7fa;font-size:13px;color:#6b6b70">' +
      '<p style="margin:0">V eurách sa nič nevracia. Klientovi sa pošle presne suma v BTC uvedená hore.</p>' +
      '<p style="margin:10px 0 0">Zaplatených ' + esc(btcF(v.sat)) + ' malo pri úhrade hodnotu približne ' + (v.eur ? esc(eurF(v.eur)) + ' (kurz ' + esc(eurF(v.kurzU)) + ' za 1 BTC)' : 'neznámu') + '.</p>' +
      '<p style="margin:6px 0 0">Vracaných ' + esc(btcF(v.satV)) + ' má dnes hodnotu približne ' + (v.kurzT ? esc(eurF(v.satV / 1e8 * v.kurzT)) + ' (kurz ' + esc(eurF(v.kurzT)) + ' za 1 BTC)' : 'neznámu, kurz sa nepodarilo načítať') + '.</p></div>';
    T.push('LEN PRE ORIENTÁCIU', 'V eurách sa nič nevracia. Klientovi sa pošle presne suma v BTC uvedená hore.',
      'Zaplatených ' + btcF(v.sat) + ' malo pri úhrade hodnotu približne ' + (v.eur ? eurF(v.eur) + ' (kurz ' + eurF(v.kurzU) + ' za 1 BTC)' : 'neznámu') + '.',
      'Vracaných ' + btcF(v.satV) + ' má dnes hodnotu približne ' + (v.kurzT ? eurF(v.satV / 1e8 * v.kurzT) + ' (kurz ' + eurF(v.kurzT) + ' za 1 BTC)' : 'neznámu') + '.');
  }
  H += '</div>';
  return { text: T.join('\n'), html: H };
}
