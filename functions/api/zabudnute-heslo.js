import { txt, json, jeMail, posli, skontrolujLimit, esc } from '../_lib/mail.js';
import { nahodny } from '../_lib/auth.js';
/* E-mail na nastavenie nového hesla: rovnaký dizajn ako e-mail o vybavení žiadosti (cron.js). */
var F = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter','Helvetica Neue',Arial,sans-serif";
export function emailHesloHtml(meno, odkaz) {
  var p = 'font-family:' + F + ';font-size:16px;line-height:1.6;color:#1d1d1f;margin:0';
  return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#ffffff">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 20px 40px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">' +
    '<tr><td style="padding-bottom:30px"><img src="https://kvelto.com/img/email/kvelto-ikona-email.png" width="30" height="30" alt="" style="display:block;border:0"></td></tr>' +
    '<tr><td style="font-family:' + F + ';font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-1.2px;color:#1d1d1f;padding-bottom:26px">Nastavenie nového hesla</td></tr>' +
    '<tr><td><p style="' + p + '">Dobrý deň, ' + esc(meno) + ',</p><p style="' + p + ';margin-top:14px">nové heslo si nastavíte kliknutím na tlačidlo nižšie. Odkaz platí 1 hodinu.</p></td></tr>' +
    '<tr><td align="center" style="padding:28px 0 8px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" style="background:#1d1d1f;border-radius:100px"><a href="' + odkaz + '" style="display:inline-block;padding:15px 34px;font-family:' + F + ';font-size:16px;font-weight:600;color:#ffffff;text-decoration:none">Nastaviť nové heslo</a></td></tr></table></td></tr>' +
    '<tr><td style="padding-top:26px;font-family:' + F + ';font-size:15px;line-height:1.6;color:#6e6e73">Ak ste o nové heslo nežiadali, tento e-mail ignorujte. Vaše heslo sa nezmení.</td></tr>' +
    '<tr><td style="padding-top:34px;border-bottom:1px solid #e9eaee"></td></tr>' +
    '<tr><td style="padding-top:24px;font-family:' + F + ';font-size:12px;line-height:1.5;color:#86868b">Obsah tohto e-mailu je dôverný a je určený len pre adresáta. Ak Vám tento e-mail nepatrí, vymažte ho.</td></tr>' +
    '</table></td></tr></table></body></html>';
}
export async function onRequestPost(context) {
  var env = context.env, d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false }, 400); }
  var email = txt(d.email, 160).toLowerCase();
  if (!jeMail(email)) return json({ ok: false, chyba: 'Skontrolujte prosím e-mail.' }, 400);
  var z = await env.DB.prepare('SELECT id, meno FROM ziadosti WHERE email = ?').bind(email).first();
  if (z) {
    var t = nahodny(32), plati = new Date(Date.now() + 3600000).toISOString();
    await env.DB.prepare('INSERT INTO resety (token, ziadost_id, plati_do) VALUES (?, ?, ?)').bind(t, z.id, plati).run();
    var odkaz = 'https://kvelto.com/nove-heslo?t=' + t;
    var v = await posli(env, { to: [email], reply_to: env.KONTAKT_PRIJEMCA, subject: 'Nové heslo', html: emailHesloHtml(z.meno, odkaz) });
    if (!v.ok) skontrolujLimit(context, v, 'zabudnuté heslo', email);
  }
  return json({ ok: true });
}
