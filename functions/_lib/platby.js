/* Automatická kontrola platieb poplatku (volá ju /api/cron každých 5 minút).
   Pre každú nezaplatenú žiadosť s pridelenou adresou pozrie na mempool.space, koľko na adresu prišlo (iba potvrdené platby).
   Ak hodnota v eurách (kurz v momente kontroly) dosiahne PLATBA_MIN_EUR (nastavenie v Cloudflare, zatiaľ 5, neskôr 200):
   poplatok sa označí ako uhradený, inzerát sa zverejní na 1 mesiac a klient dostane e-mail.
   Nepoužité adresy zrušených žiadostí sa po 30 dňoch uvoľnia pre ďalších klientov (recyklácia). */
import { posli, skontrolujLimit, upozorni, esc, majitelHtml } from './mail.js';
import { datumSk } from './cas.js';

/* Overenie platieb: hlavne mempool.space, ako záloha Blockstream (rovnaký formát odpovede). Kurz: mempool.space, záloha CoinGecko. */
var ZDROJE = ['https://mempool.space/api', 'https://blockstream.info/api'];
/* Bezplatný Cloudflare dovolí 50 dotazov von na jedno spustenie, preto najviac 35 účtov + kurz + recyklácia 5. */
var LEHOTA_DNI = 5, NAVYSE_DNI = 2, KARANTENA_DNI = 30, NARAZ = 35, RECYKLACIA = 5;

/* Dotaz na adresu: skúsi zdroje po poradí. Keď hlavný zlyhá, v tomto spustení sa už používa iba záloha (šetrí limit 50 dotazov). */
async function btcApi(cesta, stav) {
  stav = stav || {};
  var od = stav.zaloha ? 1 : 0, chyba = null;
  for (var i = od; i < ZDROJE.length; i++) {
    try { return await jsonZ(ZDROJE[i] + cesta); } catch (e) { chyba = e; if (i === 0) stav.zaloha = true; }
  }
  throw chyba;
}
async function kurzEur() {
  try { var c = await jsonZ('https://mempool.space/api/v1/prices'); if (c && c.EUR) return c.EUR; } catch (e) {}
  var g = await jsonZ('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
  return g.bitcoin.eur;
}
async function jsonZ(url) { var r = await fetch(url, { headers: { 'Accept': 'application/json' } }); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }
function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function fmt2(n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1]; }
function plusMesiac(d) { var x = new Date(d.getTime()); var den = x.getUTCDate(); x.setUTCMonth(x.getUTCMonth() + 1); if (x.getUTCDate() < den) x.setUTCDate(0); return x; }
export function cisloZ(id) { return String(id || '').slice(0, 10).toUpperCase(); }

/* E-mail po prijatí platby: rovnaký dizajn ako e-mail o vybavení žiadosti (cron.js). Všetko inline kvôli Gmailu a Apple Mail. */
var F = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter','Helvetica Neue',Arial,sans-serif";
function riadok(k, v, posledny) {
  return '<tr><td style="padding:14px 0;' + (posledny ? '' : 'border-bottom:1px solid #e9eaee;') + '">' +
    '<div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:3px">' + k + '</div>' +
    '<div style="font-family:' + F + ';font-size:17px;font-weight:600;color:#1d1d1f;word-break:break-all">' + v + '</div></td></tr>';
}
function box(nadpis, velke, riadky) {
  return '<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fc;border-radius:18px"><tr><td style="padding:22px 22px 6px">' +
    '<div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:4px">' + nadpis + '</div>' +
    '<div style="font-family:' + F + ';font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-1px;color:#1d1d1f">' + velke + '</div>' +
    '<div style="height:14px;border-bottom:1px solid #e9eaee"></div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + riadky + '</table></td></tr></table></td></tr>';
}
function ucelZ(z) { var u = {}; try { u = JSON.parse(z.udaje || '{}') || {}; } catch (e) {} var v = String(u.zkUcel || '').trim() || String(u.zkUcelSel || '').trim(); return v.slice(0, 120); }
export function emailHtml(z, kedy, doKedy, sat, eur, txid) {
  var p = 'font-family:' + F + ';font-size:16px;line-height:1.6;color:#1d1d1f;margin:0', c = cisloZ(z.id), u = ucelZ(z);
  return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#ffffff">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 20px 40px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">' +
    '<tr><td style="padding-bottom:30px"><img src="https://kvelto.com/img/email/kvelto-ikona-email.png" width="30" height="30" alt="" style="display:block;border:0"></td></tr>' +
    '<tr><td style="font-family:' + F + ';font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-1.2px;color:#1d1d1f;padding-bottom:26px">Ďakujeme za platbu, váš inzerát bol zverejnený</td></tr>' +
    '<tr><td><p style="' + p + '">Dobrý deň, ' + esc(z.meno) + ' ' + esc(z.priezvisko) + ',</p><p style="' + p + ';margin-top:14px">prijali sme Vašu platbu poplatku a Váš inzerát sme zverejnili na portáli.</p></td></tr>' +
    '<tr><td style="padding-top:24px"></td></tr>' +
    box('Váš inzerát je zverejnený do', esc(datumSk(doKedy)),
      (u ? riadok('Účel financovania', esc(u)) : '') + riadok('Číslo inzerátu', esc(c)) + riadok('Zverejnený od', esc(datumSk(kedy)), true)) +
    blocek(kedy, c, sat) +
    '<tr><td style="padding:0 0 22px"><div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:4px">Potvrdenie o uzavretí zmluvy</div>' +
      '<div style="font-family:' + F + ';font-size:15px;line-height:1.6;color:#1d1d1f">Týmto Vám potvrdzujeme uzavretie zmluvy o uverejnení inzerátu. Pri odoslaní objednávky ste výslovne požiadali, aby sme so službou začali hneď po úhrade ceny, ešte počas lehoty na odstúpenie od zmluvy. Zároveň ste potvrdili, že ste boli vopred poučení o následkoch tejto požiadavky.</div></td></tr>' +
    '<tr><td align="center" style="padding-top:8px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" style="background:#1d1d1f;border-radius:100px"><a href="https://kvelto.com/zoznam-k7r2q9mv.html#i-' + esc(c) + '" style="display:inline-block;padding:15px 34px;font-family:' + F + ';font-size:16px;font-weight:600;color:#ffffff;text-decoration:none">Zobraziť inzerát</a></td></tr></table></td></tr>' +
    '<tr><td style="padding-top:26px;font-family:' + F + ';font-size:15px;line-height:1.6;color:#6e6e73">Obsah tohto e-mailu je dôverný a je určený len pre adresáta. Ak Vám tento e-mail nepatrí, vymažte ho.</td></tr>' +
    '<tr><td style="padding-top:26px"><p style="' + p + '">Klientske centrum</p></td></tr>' +
    '<tr><td style="padding-top:34px;border-bottom:1px solid #e9eaee"></td></tr>' +
    '<tr><td style="padding-top:24px;font-family:' + F + ';font-size:12px;line-height:1.5;color:#86868b">Podmienky služby nájdete v obchodných podmienkach.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

/* Skontroluje jednu žiadosť. stav = { kurz, vysl } sa zdieľa medzi viacerými kontrolami v jednom spustení. Vráti true, ak sa práve teraz uznala platba. */
export async function skontrolujZiadost(context, z, stav) {
  var env = context.env, ted = new Date(), tIso = ted.toISOString(), vysl = stav.vysl;
  var min = parseFloat(env.PLATBA_MIN_EUR || '200');
  var a = await btcApi('/address/' + z.adresa, stav);
  vysl.skontrolovane++;
  var sat = (a.chain_stats && a.chain_stats.funded_txo_sum) || 0;
  await env.DB.prepare('UPDATE ziadosti SET platba_kontrola = ? WHERE id = ?').bind(tIso, z.id).run();
  if (!sat) return false;
  await env.DB.prepare('UPDATE adresy SET pouzita = 1 WHERE adresa = ?').bind(z.adresa).run();
  if (stav.kurz == null) stav.kurz = await kurzEur();
  var eur = sat / 1e8 * stav.kurz;
  if (eur < min) {
    if (z.platba_sat !== sat) {
      await env.DB.prepare('UPDATE ziadosti SET platba_sat = ?, platba_eur = ? WHERE id = ?').bind(sat, eur, z.id).run();
      upozorni(context, 'Prišla nižšia platba · ' + z.meno + ' ' + z.priezvisko,
        'Na adresu ' + z.adresa + ' prišlo ' + (sat / 1e8).toFixed(8) + ' BTC (asi ' + fmt2(eur) + ' €). To je menej ako ' + fmt(min) + ' €, poplatok preto nie je uhradený.\nE-mail klienta: ' + z.email,
        majitelHtml({ problem: true, stitok: 'Nižšia platba', nadpis: 'Prišla nižšia platba',
          hlavne: { label: 'Prišlo', value: (sat / 1e8).toFixed(8) + ' BTC', pod: [esc('asi ' + fmt2(eur) + ' €. To je menej ako ' + fmt(min) + ' €, poplatok preto nie je uhradený.')] },
          sekcie: [{ nadpis: 'Podrobnosti', riadky: [['Meno', z.meno + ' ' + z.priezvisko], ['E-mail klienta', z.email], ['Adresa', z.adresa]] }] }));
    }
    return false;
  }
  var txs = []; try { txs = await btcApi('/address/' + z.adresa + '/txs', stav); } catch (e) {}
  var tx = (txs || []).filter(function (t) { return t.status && t.status.confirmed; })[0];
  var txid = tx ? tx.txid : null, doKedy = plusMesiac(ted);
  var u = await env.DB.prepare(
    'UPDATE ziadosti SET poplatok_uhradeny = 1, poplatok_uhradeny_o = ?, platba_sat = ?, platba_eur = ?, platba_txid = ?, zverejnene_o = ?, zverejnene_do = ? WHERE id = ? AND poplatok_uhradeny = 0'
  ).bind(tIso, sat, eur, txid, tIso, doKedy.toISOString(), z.id).run();
  if (!u.meta || !u.meta.changes) return false;
  vysl.zaplatene++;
  var v = await posli(env, { to: [z.email], reply_to: env.KONTAKT_PRIJEMCA,
    subject: 'Ďakujeme za platbu', html: emailHtml(z, ted, doKedy, sat, eur, txid) });
  if (v.ok) await env.DB.prepare('UPDATE ziadosti SET email_zverejnenie_odoslany = 1 WHERE id = ?').bind(z.id).run();
  else skontrolujLimit(context, v, 'e-mail o zverejnení inzerátu', z.email);
  upozorni(context, 'Prijatá platba · ' + z.meno + ' ' + z.priezvisko,
    'Prijatá platba poplatku.\nKlient: ' + z.meno + ' ' + z.priezvisko + ' (' + z.email + ')\nPrijaté: ' + (sat / 1e8).toFixed(8) + ' BTC, asi ' + fmt2(eur) + ' €\nAdresa: ' + z.adresa + '\nTransakcia: ' + (txid || '') +
    '\nInzerát č. ' + cisloZ(z.id) + ' je zverejnený do ' + datumSk(doKedy) + '.',
    majitelHtml({ stitok: 'Prijatá platba', nadpis: 'Prijatá platba poplatku',
      hlavne: { label: 'Prijaté', value: (sat / 1e8).toFixed(8) + ' BTC', pod: [esc('asi ' + fmt2(eur) + ' €')] },
      sekcie: [{ nadpis: 'Klient', riadky: [['Meno', z.meno + ' ' + z.priezvisko], ['E-mail', z.email]] },
        { nadpis: 'Inzerát', riadky: [['Číslo inzerátu', cisloZ(z.id), true], ['Zverejnený do', datumSk(doKedy)]] },
        { nadpis: 'Platba', riadky: [['Adresa', z.adresa], ['Transakcia', txid || 'neznáma']] }] }));
  return true;
}

export async function kontrolaPlatieb(context) {
  var env = context.env, ted = new Date(), tIso = ted.toISOString(), vysl = { skontrolovane: 0, zaplatene: 0, uvolnene: 0, chyby: 0 };
  var odkedy = new Date(ted.getTime() - (LEHOTA_DNI + NAVYSE_DNI) * 86400000).toISOString();
  /* Najdlhšie nekontrolované idú prvé, takže sa postupne vystriedajú všetky. */
  var r = await env.DB.prepare(
    "SELECT * FROM ziadosti WHERE adresa IS NOT NULL AND poplatok_uhradeny = 0 AND (schvalene_o IS NULL OR schvalene_o > ?) ORDER BY COALESCE(platba_kontrola, '') LIMIT ?"
  ).bind(odkedy, NARAZ).all();
  var rows = r.results || [], stav = { kurz: null, vysl: vysl };
  for (var i = 0; i < rows.length; i++) {
    try { await skontrolujZiadost(context, rows[i], stav); } catch (e) { vysl.chyby++; console.log('platba', rows[i].id, e && e.message); }
  }
  /* E-maily o zverejnení, ktoré sa nepodarilo poslať (napr. vyčerpaný limit Resend), sa skúsia znova. */
  var neodosl = await env.DB.prepare('SELECT * FROM ziadosti WHERE poplatok_uhradeny = 1 AND email_zverejnenie_odoslany = 0 AND zverejnene_o IS NOT NULL ORDER BY zverejnene_o LIMIT 5').all();
  for (var n = 0; n < (neodosl.results || []).length; n++) {
    var y = neodosl.results[n];
    var w = await posli(env, { to: [y.email], reply_to: env.KONTAKT_PRIJEMCA, subject: 'Ďakujeme za platbu',
      html: emailHtml(y, new Date(y.zverejnene_o), new Date(y.zverejnene_do), y.platba_sat || 0, y.platba_eur || 0, y.platba_txid) });
    if (w.ok) await env.DB.prepare('UPDATE ziadosti SET email_zverejnenie_odoslany = 1 WHERE id = ?').bind(y.id).run();
    else { if (/quota_exceeded/.test(w.text || '')) break; }
  }
  /* Recyklácia: nepoužité adresy žiadostí, ktorým lehota uplynula pred viac ako 30 dňami. */
  var dlho = new Date(ted.getTime() - (LEHOTA_DNI + KARANTENA_DNI) * 86400000).toISOString();
  var st = await env.DB.prepare('SELECT id, adresa FROM ziadosti WHERE adresa IS NOT NULL AND poplatok_uhradeny = 0 AND schvalene_o IS NOT NULL AND schvalene_o < ? LIMIT ' + RECYKLACIA).bind(dlho).all();
  for (var j = 0; j < (st.results || []).length; j++) {
    var s = st.results[j];
    try {
      var b = await btcApi('/address/' + s.adresa, stav);
      var nic = !b.chain_stats.tx_count && !b.mempool_stats.tx_count;
      if (!nic) { await env.DB.prepare('UPDATE adresy SET pouzita = 1 WHERE adresa = ?').bind(s.adresa).run(); continue; }
      await env.DB.prepare('UPDATE adresy SET ziadost_id = NULL, uvolnit_po = ? WHERE adresa = ? AND pouzita = 0').bind(tIso, s.adresa).run();
      await env.DB.prepare('UPDATE ziadosti SET adresa = NULL WHERE id = ?').bind(s.id).run();
      vysl.uvolnene++;
    } catch (e) { vysl.chyby++; }
  }
  return vysl;
}

/* E-mail zadávateľovi so správou od záujemcu (formulár Ozvať sa). Rovnaký dizajn ako ostatné e-maily klientom. */
export function spravaHtml(cislo, meno, email, sprava) {
  var p = 'font-family:' + F + ';font-size:16px;line-height:1.6;color:#1d1d1f;margin:0';
  return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#ffffff">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 20px 40px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">' +
    '<tr><td style="padding-bottom:30px"><img src="https://kvelto.com/img/email/kvelto-ikona-email.png" width="30" height="30" alt="" style="display:block;border:0"></td></tr>' +
    '<tr><td style="font-family:' + F + ';font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-1.2px;color:#1d1d1f;padding-bottom:26px">Nová správa k Vášmu inzerátu</td></tr>' +
    '<tr><td><p style="' + p + '">Dobrý deň,</p><p style="' + p + ';margin-top:14px">na Váš inzerát odpovedal záujemca. Jeho správu nájdete nižšie. Ak mu chcete odpovedať, stačí odpísať na tento e-mail.</p></td></tr>' +
    '<tr><td style="padding-top:24px"></td></tr>' +
    box('Číslo inzerátu', esc(cislo), riadok('Meno záujemcu', esc(meno), true)) +
    '<tr><td style="padding:6px 0 16px"><div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:6px">Správa</div>' +
      '<div style="font-family:' + F + ';font-size:16px;line-height:1.6;color:#1d1d1f">' + esc(sprava).replace(/\n/g, '<br>') + '</div></td></tr>' +
    '<tr><td style="padding-top:18px;font-family:' + F + ';font-size:15px;line-height:1.6;color:#6e6e73">Správu sme Vám iba doručili. Jej obsah sme nehodnotili ani nemenili. Ďalšia komunikácia prebieha priamo medzi Vami a záujemcom.</td></tr>' +
    '<tr><td style="padding-top:34px;border-bottom:1px solid #e9eaee"></td></tr>' +
    '<tr><td style="padding-top:24px;font-family:' + F + ';font-size:12px;line-height:1.5;color:#86868b">Podmienky služby nájdete v obchodných podmienkach.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

/* Potvrdenie o úhrade v e-maile po platbe, v štýle bločku. */
function blocek(kedy, c, sat) {
  var t = 'font-family:' + F + ';', ciara = '<tr><td colspan="2" style="padding:6px 0"><div style="border-top:1px dashed #c7c9d1;height:0;line-height:0;font-size:0">&nbsp;</div></td></tr>';
  function r(k, v) { return '<tr><td style="' + t + 'font-size:14px;color:#6e6e73;padding:5px 0;vertical-align:top">' + k + '</td><td align="right" style="' + t + 'font-size:14px;font-weight:600;color:#1d1d1f;padding:5px 0 5px 12px;text-align:right;vertical-align:top;white-space:nowrap">' + v + '</td></tr>'; }
  return '<tr><td style="padding:8px 0 22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e3e5eb;border-radius:14px"><tr><td style="padding:22px 22px 18px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '<tr><td colspan="2" align="center" style="' + t + 'font-size:13px;font-weight:700;letter-spacing:1.5px;color:#1d1d1f;text-transform:uppercase;padding-bottom:10px;text-align:center">Potvrdenie o úhrade</td></tr>' + ciara +
    r('Dátum a čas', esc(datumSk(kedy))) + r('Číslo inzerátu', esc(c)) + ciara +
    '<tr><td style="' + t + 'font-size:14px;color:#1d1d1f;padding:5px 0;font-weight:600">Uverejnenie inzerátu<div style="font-weight:400;color:#86868b;font-size:13px;margin-top:2px">doba zverejnenia jeden mesiac</div></td><td align="right" style="' + t + 'font-size:14px;color:#1d1d1f;padding:5px 0 5px 12px;text-align:right;vertical-align:top;font-weight:600;white-space:nowrap">1 ks</td></tr>' + ciara +
    '<tr><td style="' + t + 'font-size:17px;color:#1d1d1f;padding:8px 0 4px;font-weight:800">Platba</td><td align="right" style="' + t + 'font-size:17px;color:#1d1d1f;padding:8px 0 4px;text-align:right;font-weight:800;white-space:nowrap">Uhradená</td></tr>' +
    ciara + '<tr><td colspan="2" align="center" style="' + t + 'font-size:12px;color:#86868b;padding-top:6px;text-align:center">Ďakujeme za platbu</td></tr>' +
    '</table></td></tr></table></td></tr>';
}
