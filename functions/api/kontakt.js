/* Kontaktný formulár (kontakt.html): pošle správu majiteľovi cez Cloudflare (zadarmo, mimo limitu Resend). */
import { esc, txt, json, jeMail, posliMajitelovi } from '../_lib/mail.js';

export async function onRequestPost(context) {
  var env = context.env;
  if (!env.UPOZORNENIE) return json({ ok: false, chyba: 'Server nie je nastavený.' }, 500);

  var d;
  try { d = await context.request.json(); } catch (e) { return json({ ok: false, chyba: 'Neplatné dáta.' }, 400); }

  var meno = txt(d.meno, 80), priez = txt(d.priezvisko, 80), email = txt(d.email, 160),
      tel = txt(d.telefon, 40), tema = txt(d.tema, 40), popis = txt(d.popis, 2000), sprava = txt(d.sprava, 5000);

  if (meno.length < 2 || priez.length < 2 || sprava.length < 20 || !jeMail(email) || d.suhlas !== true)
    return json({ ok: false, chyba: 'Chýbajú údaje.' }, 400);

  var html =
    '<p><b>Meno:</b> ' + esc(meno) + ' ' + esc(priez) + '<br>' +
    '<b>E-mail:</b> ' + esc(email) + '<br>' +
    '<b>Telefón:</b> ' + esc(tel) + '<br>' +
    '<b>Téma:</b> ' + esc(tema) + '</p>' +
    '<p><b>Správa:</b><br>' + esc(sprava).replace(/\n/g, '<br>') + '</p>' +
    (popis && popis !== sprava ? '<p><b>Pôvodný popis problému:</b><br>' + esc(popis).replace(/\n/g, '<br>') + '</p>' : '');

  var text = 'Meno: ' + meno + ' ' + priez + '\nE-mail: ' + email + '\nTelefón: ' + tel + '\nTéma: ' + tema + '\n\nSpráva:\n' + sprava + (popis && popis !== sprava ? '\n\nPôvodný popis problému:\n' + popis : '');
  var v = await posliMajitelovi(context, 'Kontakt: ' + (tema || 'Iné') + ' · ' + meno + ' ' + priez, text, html, email);
  if (!v.ok) return json({ ok: false, chyba: 'Odoslanie zlyhalo.' }, 502);
  return json({ ok: true });
}
