/* Odstúpenie od zmluvy (odstupenie-od-zmluvy.html): pošle údaje majiteľovi cez Cloudflare a potvrdenie klientovi cez Resend. */
import { esc, txt, json, jeMail, posli, posliMajitelovi, upozorni, skontrolujLimit, majitelHtml } from '../_lib/mail.js';

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

  /* Prepočet vrátenia podľa VOP čl. III ods. 5 a čl. VI ods. 5 */
  var vr = null;
  try { if (zz && zz.platba_sat) vr = await vypocet(zz); } catch (e) { console.log('odstupenie vypocet', String(e)); }
  var m = emailMajitel({ kedy: kedy, cislo: cislo, zhoda: zhoda, meno: meno, priez: priez, email: email, tel: tel, btc: btc, vr: vr, lehotaDo: txtDen(denSk(Date.now()) + 14 * 86400000) });

  /* 1. Majiteľovi cez Cloudflare (zadarmo, mimo limitu Resend) */
  var v1 = await posliMajitelovi(context, 'Odstúpenie od zmluvy · ' + meno + ' ' + priez, m.text, m.html, email);
  if (!v1.ok) return json({ ok: false, chyba: 'Odoslanie zlyhalo.' }, 502);

  /* 2. Potvrdenie o doručení odstúpenia klientovi (§ 20a ods. 5 zákona č. 108/2024 Z. z.): obsah odstúpenia, dátum a čas odoslania. */
  var k = emailKlient({ kedy: kedy, cislo: cislo, meno: meno, priez: priez, email: email, tel: tel, btc: btc });
  try {
    var v2 = await posli(env, { to: [email], reply_to: env.KONTAKT_PRIJEMCA, subject: 'Potvrdenie o doručení odstúpenia od zmluvy', html: k.html, text: k.text });
    if (!v2.ok) { skontrolujLimit(context, v2, 'potvrdenie o odstúpení', email); upozorni(context, 'Klientovi sa nepodarilo poslať potvrdenie o odstúpení', 'Odstúpenie ' + cislo + ' (' + meno + ' ' + priez + ', ' + email + ') prišlo, ale potvrdenie klientovi sa neodoslalo. Pošli mu ho ručne.\nOdpoveď Resend: ' + (v2.text || v2.status)); }
  } catch (e) { console.log('odstupenie potvrdenie', String(e)); }
  return json({ ok: true });
}

function bPoly(v) { var G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3], c = 1; for (var i = 0; i < v.length; i++) { var b = c >>> 25; c = ((c & 0x1ffffff) << 5) ^ v[i]; for (var j = 0; j < 5; j++) if ((b >>> j) & 1) c ^= G[j]; } return c >>> 0; }
function btcOk(a) { if (a.slice(0, 3) !== 'bc1' || a.length < 14 || a.length > 90) return false; var CH = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l', d = [], i; for (i = 3; i < a.length; i++) { var x = CH.indexOf(a[i]); if (x < 0) return false; d.push(x); } if (d.length < 8) return false; var ver = d[0]; if (bPoly([3, 3, 0, 2, 3].concat(d)) !== (ver === 0 ? 1 : 0x2bc830a3)) return false; var pr = d.slice(1, d.length - 6), acc = 0, bits = 0, n = 0; for (i = 0; i < pr.length; i++) { acc = ((acc << 5) | pr[i]) & 0xfff; bits += 5; while (bits >= 8) { bits -= 8; n++; } } if (bits >= 5 || ((acc << (8 - bits)) & 255)) return false; if (ver > 16 || n < 2 || n > 40) return false; if (ver === 0 && n !== 20 && n !== 32) return false; return true; }

/* Lehota na odstúpenie: 14 kalendárnych dní od uzavretia zmluvy. Zmluva vzniká úhradou poplatku (VOP čl. III ods. 11, čl. VI ods. 1).
   Posledný deň lehoty = deň úhrady + 14 dní (slovenský čas). */
function denSk(ms) { var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bratislava', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ms)), m = {}; p.forEach(function (x) { m[x.type] = x.value; }); return Date.UTC(+m.year, +m.month - 1, +m.day); }
function txtDen(utc) { var d = new Date(utc); return d.getUTCDate() + '. ' + (d.getUTCMonth() + 1) + '. ' + d.getUTCFullYear(); }
function lehota(uhradeneMs) { var den = denSk(uhradeneMs), posledny = den + 14 * 86400000; return { uplynula: denSk(Date.now()) > posledny, uhradene: txtDen(den), do: txtDen(posledny) }; }

/* ===== Prepočet vrátenia platby (VOP čl. III ods. 5: vracia sa pomerný podiel z prijatého množstva BTC, kurz eura sa neberie do úvahy) ===== */
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
/* E-mail majiteľovi o odstúpení (vzhľad pre majiteľa z mail.js). Na vrátenie je rozhodujúca iba suma v BTC. */
function emailMajitel(d) {
  var v = d.vr, T = [];
  var o = { stitok: 'Odstúpenie od zmluvy', nadpis: 'Odstúpenie od zmluvy', kedy: 'Podané ' + d.kedy, sekcie: [] };
  T.push('ODSTÚPENIE OD ZMLUVY', 'Podané ' + d.kedy, '');
  if (v) {
    o.hlavne = { label: 'Vrátiť klientovi', value: btcF(v.satV), pod: ['na bitcoinovú adresu<br><span style="font-family:Menlo,Consolas,monospace;word-break:break-all">' + esc(d.btc || 'neuvedená') + '</span>',
      esc('najneskôr do ' + d.lehotaDo + ' (14 dní od doručenia odstúpenia)')] };
    T.push('VRÁTIŤ KLIENTOVI: ' + btcF(v.satV), 'Na bitcoinovú adresu: ' + (d.btc || 'neuvedená'), 'Najneskôr do ' + d.lehotaDo + ' (14 dní od doručenia odstúpenia)', '');
    o.sekcie.push({ nadpis: 'Výpočet', riadky: [['Klient zaplatil', btcF(v.sat), true], ['Dátum úhrady', v.uhradene], ['Transakcia', v.txid],
      ['Inzerát bol zverejnený', v.dni + ' z ' + v.spolu + ' dní'], ['Za ' + dn(v.dni) + ' zverejnenia ostáva nám', btcF(v.satP)], ['Za ' + zv(v.zost) + ' ' + dn(v.zost) + ' sa vracia', btcF(v.satV), true]] });
    T.push('VÝPOČET', 'Klient zaplatil: ' + btcF(v.sat), 'Dátum úhrady: ' + v.uhradene, 'Transakcia: ' + v.txid, 'Inzerát bol zverejnený: ' + v.dni + ' z ' + v.spolu + ' dní',
      'Za ' + dn(v.dni) + ' zverejnenia ostáva nám: ' + btcF(v.satP), 'Za ' + zv(v.zost) + ' ' + dn(v.zost) + ' sa vracia: ' + btcF(v.satV), '');
  } else {
    o.problem = true;
    o.text = 'Údaje o platbe sa nepodarilo načítať. Sumu na vrátenie treba prepočítať ručne.';
    T.push('Údaje o platbe sa nepodarilo načítať. Sumu na vrátenie treba prepočítať ručne.', '');
  }
  o.sekcie.push({ nadpis: 'Klient', riadky: [['Číslo žiadosti', d.cislo, true], ['Kontrola v databáze', d.zhoda], ['Meno', d.meno + ' ' + d.priez], ['E-mail', d.email], ['Telefón', d.tel]] });
  T.push('KLIENT', 'Číslo žiadosti: ' + d.cislo + ' (' + d.zhoda + ')', 'Meno: ' + d.meno + ' ' + d.priez, 'E-mail: ' + d.email, 'Telefón: ' + d.tel, '');
  if (v) {
    var orient = 'V eurách sa nič nevracia. Klientovi sa pošle presne suma v BTC uvedená hore.\nZaplatených ' + btcF(v.sat) + ' malo pri úhrade hodnotu približne ' + (v.eur ? eurF(v.eur) + ' (kurz ' + eurF(v.kurzU) + ' za 1 BTC)' : 'neznámu') + '.';
    o.sekcie.push({ nadpis: 'Len pre orientáciu', text: orient + (v.kurzT ? '' : '\nDnešný kurz sa nepodarilo načítať.'),
      riadky: v.kurzT ? [['V dnešnom kurze ' + eurF(v.kurzT) + ' za 1 BTC nám zostáva', eurF(v.satP / 1e8 * v.kurzT), true], ['V dnešnom kurze vraciame', eurF(v.satV / 1e8 * v.kurzT), true]] : null });
    o.poznamka = 'Vracia sa pomerný podiel z prijatého množstva BTC podľa VOP čl. III ods. 5 a čl. VI ods. 5.';
    T.push('LEN PRE ORIENTÁCIU', 'V eurách sa nič nevracia. Klientovi sa pošle presne suma v BTC uvedená hore.',
      'Zaplatených ' + btcF(v.sat) + ' malo pri úhrade hodnotu približne ' + (v.eur ? eurF(v.eur) + ' (kurz ' + eurF(v.kurzU) + ' za 1 BTC)' : 'neznámu') + '.',
      (v.kurzT ? 'V dnešnom kurze ' + eurF(v.kurzT) + ' za 1 BTC: Nám zostáva ' + eurF(v.satP / 1e8 * v.kurzT) + '. Vraciame ' + eurF(v.satV / 1e8 * v.kurzT) + '.' : 'Dnešný kurz sa nepodarilo načítať.'));
  }
  return { text: T.join('\n'), html: majitelHtml(o) };
}

/* E-mail klientovi: potvrdenie o doručení odstúpenia od zmluvy, v rovnakom dizajne ako ostatné e-maily klientom. */
function emailKlient(d) {
  var F = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter','Helvetica Neue',Arial,sans-serif";
  var p = 'font-family:' + F + ';font-size:16px;line-height:1.6;color:#1d1d1f;margin:0';
  function riadok(k, v, posledny, mono) {
    return '<tr><td style="padding:14px 0;' + (posledny ? '' : 'border-bottom:1px solid #e9eaee;') + '">' +
      '<div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:3px">' + esc(k) + '</div>' +
      '<div style="font-family:' + F + ';font-size:17px;font-weight:600;color:#1d1d1f;' + (mono ? 'word-break:break-all' : '') + '">' + esc(v) + '</div></td></tr>';
  }
  var celeMeno = d.meno + ' ' + d.priez;
  var riadky = riadok('Číslo žiadosti', d.cislo) + riadok('Meno a priezvisko', celeMeno) + riadok('E-mail', d.email) + riadok('Telefónne číslo', d.tel, true); /* bez adresy na vrátenie: e-mail klientovi bez zmienok o kryptomenách (spam filter) */
  var html = '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#ffffff">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 20px 40px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">' +
    '<tr><td style="padding-bottom:30px"><img src="https://kvelto.com/img/email/kvelto-ikona-email.png" width="30" height="30" alt="" style="display:block;border:0"></td></tr>' +
    '<tr><td style="font-family:' + F + ';font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-1.2px;color:#1d1d1f;padding-bottom:26px">Vaše odstúpenie od zmluvy sme prijali</td></tr>' +
    '<tr><td><p style="' + p + '">Dobrý deň, ' + esc(celeMeno) + ',</p><p style="' + p + ';margin-top:14px">potvrdzujeme, že sme Vaše odstúpenie od zmluvy prijali. Nižšie nájdete jeho úplné znenie.</p></td></tr>' +
    '<tr><td style="padding:24px 0 0"><div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:4px">Znenie odstúpenia</div>' +
      '<div style="font-family:' + F + ';font-size:15px;line-height:1.6;color:#1d1d1f">Týmto odstupujem od zmluvy o poskytnutí služby uzavretej na základe žiadosti uvedenej nižšie.</div></td></tr>' +
    '<tr><td style="padding:16px 0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fc;border-radius:18px"><tr><td style="padding:22px 22px 6px">' +
      '<div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:4px">Odoslané</div>' +
      '<div style="font-family:' + F + ';font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-1px;color:#1d1d1f">' + esc(d.kedy) + '</div>' +
      '<div style="height:14px;border-bottom:1px solid #e9eaee"></div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + riadky + '</table></td></tr></table></td></tr>' +
    '<tr><td style="padding:0 0 6px"><div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:4px">Čo bude ďalej</div>' +
      '<div style="font-family:' + F + ';font-size:15px;line-height:1.6;color:#1d1d1f">Pomernú časť platby Vám vrátime najneskôr do 14 dní odo dňa doručenia odstúpenia.</div></td></tr>' +
    '<tr><td style="padding-top:26px;font-family:' + F + ';font-size:15px;line-height:1.6;color:#6e6e73">Tento e-mail je potvrdením o doručení odstúpenia od zmluvy. Odporúčame Vám ho uschovať.</td></tr>' +
    '<tr><td style="padding-top:26px"><p style="' + p + '">Klientske centrum</p></td></tr>' +
    '<tr><td style="padding-top:34px;border-bottom:1px solid #e9eaee"></td></tr>' +
    '<tr><td style="padding-top:24px;font-family:' + F + ';font-size:12px;line-height:1.5;color:#86868b">Podmienky služby nájdete v obchodných podmienkach.</td></tr>' +
    '</table></td></tr></table></body></html>';
  var T = ['Vaše odstúpenie od zmluvy sme prijali', '', 'Dobrý deň, ' + celeMeno + ',', 'potvrdzujeme, že sme Vaše odstúpenie od zmluvy prijali. Nižšie nájdete jeho úplné znenie.', '',
    'ZNENIE ODSTÚPENIA', 'Týmto odstupujem od zmluvy o poskytnutí služby uzavretej na základe žiadosti uvedenej nižšie.', '',
    'Odoslané ' + d.kedy, 'Číslo žiadosti ' + d.cislo, 'Meno a priezvisko ' + celeMeno, 'E-mail ' + d.email, 'Telefónne číslo ' + d.tel].concat(['',
    'ČO BUDE ĎALEJ', 'Pomernú časť platby Vám vrátime najneskôr do 14 dní odo dňa doručenia odstúpenia.', '',
    'Tento e-mail je potvrdením o doručení odstúpenia od zmluvy. Odporúčame Vám ho uschovať.', '', 'Klientske centrum']);
  return { html: html, text: T.join('\n') };
}
