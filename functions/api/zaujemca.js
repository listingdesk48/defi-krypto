/* Formulár na stránke Inzercia (inzercia.html): záujemca zadá meno, priezvisko a e-mail
   a server mu e-mailom pošle odkaz na neverejný zoznam inzerátov (OP čl. VIII ods. 1).
   Údaje sa po odoslaní odkazu neukladajú (Ochrana osobných údajov čl. II ods. 8 a čl. IV).
   Tabuľka zaujemcovia, kde sa údaje predtým ukladali, sa zmaže. */
import { esc, txt, json, jeMail, posli, skontrolujLimit } from '../_lib/mail.js';

var ODKAZ = 'https://kvelto.com/zoznam-k7r2q9mv';
var F = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter','Helvetica Neue',Arial,sans-serif";

function emailHtml(meno) {
  var p = 'font-family:' + F + ';font-size:16px;line-height:1.6;color:#1d1d1f;margin:0';
  return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#ffffff">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 20px 40px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">' +
    '<tr><td style="padding-bottom:30px"><img src="https://kvelto.com/img/email/kvelto-ikona-email.png" width="30" height="30" alt="" style="display:block;border:0"></td></tr>' +
    '<tr><td style="font-family:' + F + ';font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-1.2px;color:#1d1d1f;padding-bottom:26px">Prístup k inzerátom</td></tr>' +
    '<tr><td><p style="' + p + '">Dobrý deň, ' + esc(meno) + ',</p><p style="' + p + ';margin-top:14px">posielame Vám odkaz na zoznam inzerátov ľudí, ktorí hľadajú financovanie. Pri každom inzeráte je formulár, cez ktorý môžete zadávateľovi poslať správu.</p></td></tr>' +
    '<tr><td align="center" style="padding-top:30px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" style="background:#1d1d1f;border-radius:100px"><a href="' + ODKAZ + '" style="display:inline-block;padding:15px 34px;font-family:' + F + ';font-size:16px;font-weight:600;color:#ffffff;text-decoration:none">Zobraziť inzeráty</a></td></tr></table></td></tr>' +
    '<tr><td style="padding-top:30px;font-family:' + F + ';font-size:15px;line-height:1.6;color:#6e6e73">Prevádzkovateľ nikomu nepožičiava a do dohôd medzi zadávateľom a záujemcom nevstupuje. Identitu zadávateľov ani záujemcov nepreverujeme.</td></tr>' +
    '<tr><td style="padding-top:16px;font-family:' + F + ';font-size:15px;line-height:1.6;color:#6e6e73">Obsah tohto e-mailu je dôverný a je určený len pre adresáta. Ak Vám tento e-mail nepatrí, vymažte ho.</td></tr>' +
    '<tr><td style="padding-top:26px"><p style="' + p + '">Klientske centrum</p></td></tr>' +
    '<tr><td style="padding-top:34px;border-bottom:1px solid #e9eaee"></td></tr>' +
    '<tr><td style="padding-top:24px;font-family:' + F + ';font-size:12px;line-height:1.5;color:#86868b">Podmienky služby nájdete v obchodných podmienkach.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

export async function onRequestPost(context) {
  var env = context.env;
  var d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }
  var meno = txt(d.meno, 80), priez = txt(d.priezvisko, 80), email = txt(d.email, 160).toLowerCase();
  if (meno.length < 2 || priez.length < 2 || !jeMail(email)) return json({ ok: false, chyba: 'Chýbajú údaje.' }, 400);

  if (env.DB) { try { await env.DB.prepare('DROP TABLE IF EXISTS zaujemcovia').run(); } catch (e) {} }

  var v = await posli(env, { to: [email], reply_to: env.KONTAKT_PRIJEMCA, subject: 'Prístup k inzerátom', html: emailHtml(meno),
    text: 'Dobrý deň, ' + meno + ',\n\nposielame Vám odkaz na zoznam inzerátov ľudí, ktorí hľadajú financovanie:\n' + ODKAZ +
      '\n\nPrevádzkovateľ nikomu nepožičiava a do dohôd medzi zadávateľom a záujemcom nevstupuje. Identitu zadávateľov ani záujemcov nepreverujeme.' });
  if (!v.ok) { skontrolujLimit(context, v, 'prístup k inzerátom', 'údaje sa neuchovávajú'); return json({ ok: false, chyba: 'Odoslanie zlyhalo.' }, 502); }
  return json({ ok: true });
}
