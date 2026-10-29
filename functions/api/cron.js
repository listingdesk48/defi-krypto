/* Volá ho Worker kvelto-cron každých 5 minút. Pošle e-maily o schválení, ktorým už nastal čas, a skontroluje platby poplatku (_lib/platby.js).
   Bezpečné aj pri cudzom zavolaní: pošle len to, čo je naplánované a ešte neodoslané. */
import { json, posli, skontrolujLimit, esc } from '../_lib/mail.js';
import { teraz } from '../_lib/auth.js';
import { castiSk, datumSk } from '../_lib/cas.js';
import { kontrolaPlatieb } from '../_lib/platby.js';

function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function fmt2(n) { var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1]; }

/* E-mail o vybavení žiadosti (návrh 1 so zvýraznenou sumou). Všetko inline, aby to vyzeralo rovnako v Gmaile aj v Apple Mail. */
var F = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter','Helvetica Neue',Arial,sans-serif";
function datum(iso) { var c = castiSk(new Date(iso)); return c.d + '. ' + c.m + '. ' + c.y; }
function riadok(k, v, posledny) {
  return '<tr><td style="padding:14px 0;' + (posledny ? '' : 'border-bottom:1px solid #e9eaee;') + '">' +
    '<div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:3px">' + k + '</div>' +
    '<div style="font-family:' + F + ';font-size:17px;font-weight:600;color:#1d1d1f">' + v + '</div></td></tr>';
}
function cisloZiadosti(id) { return String(id || '').slice(0, 10).toUpperCase(); }
function ucel(z) { var u = {}; try { u = JSON.parse(z.udaje || '{}') || {}; } catch (e) {} var v = u.zkUcelSelText || u.zkUcelSel || u.zkUcel; return String(v || '').trim().slice(0, 120); }
function emailHtml(z) {
  var p = 'font-family:' + F + ';font-size:16px;line-height:1.6;color:#1d1d1f;margin:0';
  var u = ucel(z);
  var riadky = (u ? riadok('Účel financovania', esc(u)) : '') + riadok('Doba financovania', rokyText(z.doba)) +
    riadok('Dátum a čas podania', datumSk(new Date(z.vytvorene))) + riadok('Číslo žiadosti', cisloZiadosti(z.id), true);
  return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#ffffff">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 20px 40px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">' +
    '<tr><td style="padding-bottom:30px"><img src="https://kvelto.com/img/email/kvelto-ikona-email.png" width="30" height="30" alt="" style="display:block;border:0"></td></tr>' +
    '<tr><td style="font-family:' + F + ';font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-1.2px;color:#1d1d1f;padding-bottom:26px">Vaša žiadosť bola vybavená</td></tr>' +
    '<tr><td><p style="' + p + '">Dobrý deň, ' + esc(z.meno) + ' ' + esc(z.priezvisko) + ',</p><p style="' + p + ';margin-top:14px">Radi by sme Vám oznámili, že sme Vašu žiadosť prijali a schválili. Všetky podrobnosti vrátane Vašich osobných údajov nájdete vo svojom účte.</p></td></tr>' +
    '<tr><td style="padding:24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fc;border-radius:18px"><tr><td style="padding:22px 22px 6px">' +
      '<div style="font-family:' + F + ';font-size:14px;color:#86868b;margin-bottom:4px">Požadovaná suma</div>' +
      '<div style="font-family:' + F + ';font-size:44px;line-height:1.05;font-weight:800;letter-spacing:-1.6px;color:#1d1d1f">' + fmt(z.suma) + ' €</div>' +
      '<div style="height:14px;border-bottom:1px solid #e9eaee"></div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + riadky + '</table>' +
    '</td></tr></table></td></tr>' +
    '<tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" style="background:#1d1d1f;border-radius:100px"><a href="https://kvelto.com/ucet.html" style="display:inline-block;padding:15px 34px;font-family:' + F + ';font-size:16px;font-weight:600;color:#ffffff;text-decoration:none">Otvoriť môj účet</a></td></tr></table></td></tr>' +
    '<tr><td style="padding-top:26px;font-family:' + F + ';font-size:15px;line-height:1.6;color:#6e6e73">Obsah tohto e-mailu je dôverný a je určený len pre adresáta. Ak Vám tento e-mail nepatrí, vymažte ho.</td></tr>' +
    '<tr><td style="padding-top:26px"><p style="' + p + '">Klientske centrum</p></td></tr>' +
    '<tr><td style="padding-top:34px;border-bottom:1px solid #e9eaee"></td></tr>' +
    '<tr><td style="padding-top:24px;font-family:' + F + ';font-size:12px;line-height:1.5;color:#86868b">Pred pokračovaním si prosím pozorne prečítajte obchodné podmienky. Nájdete v nich, čo presne služba zahŕňa, koľko stojí a za akých podmienok ju poskytujeme. Dozviete sa v nich aj o svojich právach, napríklad o odstúpení od zmluvy.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

async function spracuj(context) {
  var env = context.env;
  var r = await env.DB.prepare("SELECT * FROM ziadosti WHERE stav = 'posudzuje' AND email_schvalenie_odoslany = 0 AND schvalit_o <= ? ORDER BY schvalit_o LIMIT 20").bind(teraz()).all();
  var poslane = 0, chyby = 0;
  for (var i = 0; i < (r.results || []).length; i++) {
    var z = r.results[i], kedy = new Date();
    var v = await posli(env, { to: [z.email], reply_to: env.KONTAKT_PRIJEMCA,
      subject: 'Žiadosť vybavená',
      html: emailHtml(z) });
    if (!v.ok) { chyby++; skontrolujLimit(context, v, 'e-mail o schválení', z.email); if (/quota_exceeded/.test(v.text || '')) break; continue; }
    await env.DB.prepare("UPDATE ziadosti SET stav = 'schvalene', schvalena_suma = suma, schvalene_o = ?, email_schvalenie_odoslany = 1 WHERE id = ?").bind(kedy.toISOString(), z.id).run();
    poslane++;
  }
  /* Kontrola platieb poplatku a zverejnenie inzerátov */
  var platby = null;
  try { platby = await kontrolaPlatieb(context); } catch (e) { platby = { chyba: String(e && e.message || e) }; }
  return json({ ok: true, poslane: poslane, chyby: chyby, platby: platby });
}
export function onRequestPost(context) { return spracuj(context); }
export function onRequestGet(context) { return spracuj(context); }

function rokyText(m) { var r = Math.round(m / 12); return r + (r === 1 ? ' rok' : r < 5 ? ' roky' : ' rokov'); }
