import { txt, json, jeMail, posli, skontrolujLimit, esc } from '../_lib/mail.js';
import { nahodny } from '../_lib/auth.js';
export async function onRequestPost(context) {
  var env = context.env, d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false }, 400); }
  var email = txt(d.email, 160).toLowerCase();
  if (!jeMail(email)) return json({ ok: false, chyba: 'Skontrolujte prosím e-mail.' }, 400);
  var z = await env.DB.prepare('SELECT id, meno FROM ziadosti WHERE email = ?').bind(email).first();
  if (z) {
    var t = nahodny(32), plati = new Date(Date.now() + 3600000).toISOString();
    await env.DB.prepare('INSERT INTO resety (token, ziadost_id, plati_do) VALUES (?, ?, ?)').bind(t, z.id, plati).run();
    var odkaz = 'https://kvelto.com/nove-heslo.html?t=' + t;
    var v = await posli(env, { to: [email], reply_to: env.KONTAKT_PRIJEMCA, subject: 'Kvelto: nastavenie nového hesla',
      html: '<p>Dobrý deň, ' + esc(z.meno) + ',</p><p>nové heslo si nastavíte na tomto odkaze. Odkaz platí 1 hodinu.</p>' +
        '<p><a href="' + odkaz + '">' + odkaz + '</a></p><p>Ak ste o nové heslo nežiadali, tento e-mail ignorujte.</p><p>Kvelto<br><a href="https://kvelto.com">kvelto.com</a></p>' });
    if (!v.ok) skontrolujLimit(context, v, 'zabudnuté heslo', email);
  }
  return json({ ok: true });
}
